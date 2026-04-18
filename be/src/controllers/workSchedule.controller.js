import mongoose from "mongoose";
import ShiftAssignment from "../models/shiftAssignment.model.js";
import ShiftTemplate from "../models/shiftTemplate.model.js";
import WorkSchedule from "../models/workSchedule.model.js";
import { getDeleteFilter } from "../utils/query.js";
import { errorResponse, successResponse } from "../utils/response.js";

// helpers
function combineDateAndTime(dateStr, timeStr) {
  // dateStr: YYYY-MM-DD, timeStr: HH:mm
  // const [y, m, d] = dateStr.split("-").map((v) => parseInt(v, 10));
  // const [hh, mm] = timeStr.split(":").map((v) => parseInt(v, 10));
  // return new Date(Date.UTC(y, m - 1, d, hh, mm, 0));
  return new Date(`${dateStr}T${timeStr}:00+07:00`);
}

function dateRange(fromStr, toStr) {
  const res = [];
  const from = new Date(fromStr + "T00:00:00Z");
  const to = new Date(toStr + "T00:00:00Z");
  for (let d = new Date(from); d <= to; d.setUTCDate(d.getUTCDate() + 1)) {
    res.push(new Date(d).toISOString().slice(0, 10));
  }
  return res;
}

const workScheduleController = {
  generate: async (req, res) => {
    try {
      let { theaterId, range, templateIds, skipExisting = true } = req.body;

      if (!Array.isArray(templateIds)) {
        if (typeof templateIds === "object") {
          templateIds = Object.values(templateIds);
        } else if (typeof templateIds === "string") {
          templateIds = [templateIds];
        } else {
          return errorResponse(res, "templateIds format invalid", 400);
        }
      }

      if (!theaterId || !range || !range.from || !range.to || !Array.isArray(templateIds)) {
        return errorResponse(res, "Invalid payload", 400);
      }

      if (templateIds.length === 0) {
        return errorResponse(res, "templateIds cannot be empty", 400);
      }

      // fetch templates
      const templates = await ShiftTemplate.find({ _id: { $in: templateIds }, isActive: true }).lean();
      const created = [];
      const skipped = [];

      const dates = dateRange(range.from, range.to);

      for (const date of dates) {
        for (const tpl of templates) {
          const startDateTime = combineDateAndTime(date, tpl.startTime);
          let endDateTime = combineDateAndTime(date, tpl.endTime);
          if (endDateTime <= startDateTime) {
            // overnight shift -> add 1 day
            endDateTime = new Date(endDateTime.getTime() + 24 * 60 * 60 * 1000);
          }

          if (skipExisting) {
            const existing = await WorkSchedule.findOne({ theaterId, date, shiftTemplateId: tpl._id }).lean();
            if (existing) {
              skipped.push({ date, templateId: tpl._id });
              continue;
            }
          }

          const doc = {
            date,
            theaterId,
            shiftTemplateId: tpl._id,
            // Snapshot dữ liệu từ template
            shiftCode: tpl.code,
            shiftName: tpl.name,
            startTime: tpl.startTime,
            endTime: tpl.endTime,
            startDateTime,
            endDateTime,
            createdBy: req.userId,
          };

          const createdDoc = await WorkSchedule.create(doc);
          created.push(createdDoc._id.toString());
        }
      }

      return successResponse(res, { created, skipped }, "Schedules generated", 201);
    } catch (err) {
      console.error("Generate schedules error:", err);
      return errorResponse(res, err.message || "Lỗi server", 500);
    }
  },

  list: async (req, res) => {
    try {
      const { theaterId, from, to } = req.query;
      const q = {
        ...getDeleteFilter(req.query),
      };

      if (theaterId) q.theaterId = new mongoose.Types.ObjectId(theaterId);

      if (from && to) {
        q.date = { $gte: from, $lte: to };
      }

      const schedules = await WorkSchedule.find(q)
        .populate("theaterId", "name")
        .populate("shiftTemplateId", "name startTime endTime color")
        .sort({ startDateTime: 1 }) // Vẫn sort theo thời gian thực để ca sáng lên trước
        .lean();

      schedules.forEach((s) => {
        if (!s.shiftName && s.shiftTemplateId) {
          s.shiftName = s.shiftTemplateId.name;
          s.shiftCode = s.shiftTemplateId.code;
          s.startTime = s.shiftTemplateId.startTime;
          s.endTime = s.shiftTemplateId.endTime;
        }
      });

      const grouped = schedules.reduce((acc, item) => {
        if (!acc[item.date]) acc[item.date] = [];
        acc[item.date].push(item);
        return acc;
      }, {});

      const result = Object.keys(grouped).map((date) => ({
        date,
        shifts: grouped[date],
      }));

      return successResponse(res, result);
    } catch (err) {
      console.error("List schedules error:", err);
      return errorResponse(res, "Lỗi server", 500);
    }
  },

  roster: async (req, res) => {
    try {
      const { theaterId } = req.params;
      const { from, to } = req.query;
      if (!from || !to) return errorResponse(res, "from/to required", 400);

      const schedules = await WorkSchedule.find({
        theaterId,
        date: { $gte: from, $lte: to },
        ...getDeleteFilter(req.query),
      })
        .populate("theaterId", "name")
        .populate("shiftTemplateId", "color") // Chỉ lấy color
        .lean();

      // group by date then templates
      const dates = Array.from(new Set(schedules.map((s) => s.date))).sort();
      const shiftsByDate = dates.map((date) => ({ date, templates: [] }));

      for (const it of items) {
        const tplRef = it.shiftTemplateId || {};
        // Construct lại object template: Ưu tiên Snapshot -> Fallback về Reference
        const snapshotTemplate = {
          _id: tplRef._id,
          code: it.shiftCode || tplRef.code,
          name: it.shiftName || tplRef.name,
          startTime: it.startTime || tplRef.startTime,
          endTime: it.endTime || tplRef.endTime,
          color: tplRef.color || "#2b6cb0",
        };

        dateEntry.templates.push({
          id: it._id,
          template: snapshotTemplate, // Dùng snapshot
          assignments: [], // assignments fetched separately if needed
          startDateTime: it.startDateTime,
          endDateTime: it.endDateTime,
          status: it.status,
        });
      }

      return successResponse(res, { dates, shifts: shiftsByDate });
    } catch (err) {
      console.error("Roster error:", err);
      return errorResponse(res, "Lỗi server", 500);
    }
  },

  dailyRoster: async (req, res) => {
    try {
      const { theaterId, date, shiftCode } = req.query;

      if (!theaterId || !date) {
        return errorResponse(res, "theaterId và date là bắt buộc", 400);
      }

      // 1. Lấy tất cả schedules của ngày đó
      const query = { theaterId, date, ...getDeleteFilter(req.query) };

      const schedules = await WorkSchedule.find(query)
        .populate("shiftTemplateId", "color")
        .sort({ startDateTime: 1 })
        .lean();

      if (schedules.length === 0) {
        return successResponse(res, {
          date,
          shifts: [],
          summary: {
            totalSchedules: 0,
            totalAssignments: 0,
            activeNow: 0,
            completed: 0,
            pending: 0,
          },
        });
      }

      // 2. Lấy tất cả assignments cho các schedules này
      const scheduleIds = schedules.map((s) => s._id);
      const allAssignments = await ShiftAssignment.find({
        workScheduleId: { $in: scheduleIds },
      })
        .populate("userId", "fullName email profilePicture phoneNumber")
        .lean();

      // 3. Group assignments theo scheduleId
      const assignmentsBySchedule = allAssignments.reduce((acc, assignment) => {
        const scheduleId = assignment.workScheduleId.toString();
        if (!acc[scheduleId]) acc[scheduleId] = [];
        acc[scheduleId].push(assignment);
        return acc;
      }, {});

      // 4. Combine data
      let result = schedules.map((schedule) => {
        const assignments = assignmentsBySchedule[schedule._id.toString()] || [];

        const tpl = schedule.shiftTemplateId || {};

        return {
          scheduleId: schedule._id,
          date: schedule.date,
          shift: {
            id: tpl._id,
            // Ưu tiên lấy từ Snapshot (schedule), nếu không có thì lấy từ Template (tpl)
            code: schedule.shiftCode || tpl.code,
            name: schedule.shiftName || tpl.name,
            startTime: schedule.startTime || tpl.startTime,
            endTime: schedule.endTime || tpl.endTime,
            color: tpl.color || "#2b6cb0",
          },
          startDateTime: schedule.startDateTime,
          endDateTime: schedule.endDateTime,
          status: schedule.status,
          employees: assignments.map((a) => ({
            assignmentId: a._id,
            userId: a.userId._id,
            fullName: a.userId.fullName,
            email: a.userId.email,
            phoneNumber: a.userId.phoneNumber,
            avatar: a.userId.profilePicture,
            role: a.role,
            status: a.status,
            checkInTime: a.checkInTime,
            checkOutTime: a.checkOutTime,
            assignedAt: a.assignedAt,
          })),
          totalEmployees: assignments.length,
        };
      });

      // 5. Filter theo shiftCode nếu có
      if (shiftCode) {
        result = result.filter((item) => item.shift.code === shiftCode);
      }

      // 6. Tính summary
      const summary = {
        totalSchedules: result.length,
        totalAssignments: allAssignments.length,
        activeNow: allAssignments.filter((a) => a.status === "active").length,
        completed: allAssignments.filter((a) => a.status === "completed").length,
        pending: allAssignments.filter((a) => a.status === "pending").length,
        noShow: allAssignments.filter((a) => a.status === "no_show").length,
      };

      return successResponse(res, {
        date,
        shifts: result,
        summary,
      });
    } catch (err) {
      console.error("Daily roster error:", err);
      return errorResponse(res, err.message || "Lỗi server", 500);
    }
  },

  remove: async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const { workScheduleId: id } = req.params;

      // 1. Tìm lịch làm việc
      const schedule = await WorkSchedule.findById(id).session(session);
      if (!schedule) {
        await session.abortTransaction();
        session.endSession();
        return errorResponse(res, "Không tìm thấy lịch làm việc", 404);
      }

      // 2. Kiểm tra ràng buộc dữ liệu (Data Integrity)
      // Không được xóa nếu đã có người check-in hoặc hoàn thành
      const activeAssignments = await ShiftAssignment.countDocuments({
        workScheduleId: id,
        $or: [
          { status: "active" },
          { status: "completed" },
          { checkInTime: { $ne: null } }, // Đã từng check-in
        ],
      }).session(session);

      if (activeAssignments > 0) {
        await session.abortTransaction();
        session.endSession();
        return errorResponse(
          res,
          "Không thể xóa lịch này vì đã có nhân viên đang làm việc hoặc đã hoàn thành ca.",
          400
        );
      }

      // 3. Xóa các phân công ở trạng thái 'pending' (nếu có)
      // Vì lịch bị xóa thì phân công chờ cũng vô nghĩa
      await ShiftAssignment.deleteMany({ workScheduleId: id }).session(session);

      // 4. Xóa lịch làm việc (Soft delete)
      schedule.isDeleted = true;
      schedule.updatedBy = req.userId;
      await schedule.save({ session });
      // await WorkSchedule.findByIdAndDelete(id).session(session);

      await session.commitTransaction();
      session.endSession();

      return successResponse(res, null, "Đã xóa lịch làm việc và các phân công chờ liên quan");
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      console.error("Remove schedule error:", err);
      return errorResponse(res, err.message || "Lỗi server", 500);
    }
  },
};

export default workScheduleController;
