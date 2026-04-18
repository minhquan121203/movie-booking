import Complaint from "../models/complaint.model.js";
import Incident from "../models/incident.model.js";
import User from "../models/user.model.js";
import { AuthorizationError, NotFoundError } from "../utils/errors.js";
import { errorResponse, successResponse } from "../utils/response.js";

// Hàm hỗ trợ tạo ID
const generateComplaintId = () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `CP${dateStr}${randomStr}`;
};

const customerSupportController = {
  // Create complaint
  createComplaint: async (req, res) => {
    try {
      const staff = await User.findById(req.userId).populate("staffInfo.assignedTheater");
      if (!staff || staff.role !== "staff") {
        throw new AuthorizationError("Chỉ nhân viên mới có thể tạo khiếu nại");
      }
      const { customerName, customerPhone, customerEmail, bookingCode, category, title, description, priority } =
        req.body;

      const finalCustomerName = customerName || "Nội bộ (Nhân viên báo cáo)";
      const finalCustomerPhone = customerPhone || "N/A";
      const finalTitle = title || `Báo cáo ${category} bởi ${staff.fullName}`;

      const newComplaintId = generateComplaintId();

      const complaint = new Complaint({
        complaintId: newComplaintId,
        customerName: finalCustomerName, // Dùng biến đã xử lý
        customerPhone: finalCustomerPhone, // Dùng biến đã xử lý
        customerEmail: customerEmail || "",
        bookingCode,
        category,
        title: finalTitle,
        description,
        priority: priority || "medium",

        theater: staff.staffInfo?.assignedTheater?._id,
        theaterName: staff.staffInfo?.assignedTheater?.name || "Unknown",

        receivedBy: staff._id,
        receivedByName: staff.fullName,
        status: "pending",
      });

      // ... (Phần timeline và save giữ nguyên)
      complaint.timeline.push({
        action: "created",
        performedBy: staff._id,
        performedByName: staff.fullName,
        note: "Tạo mới",
        timestamp: new Date(),
      });

      await complaint.save();
      return successResponse(res, { complaint }, "Tạo báo cáo thành công", 201);
    } catch (error) {
      // ... (xử lý lỗi giữ nguyên)
      console.error(error);
      return errorResponse(res, error.message, 500);
    }
  },

  // Get complaints
  getComplaints: async (req, res) => {
    try {
      const staff = await User.findById(req.userId);
      if (!staff || !["staff", "admin", "super-admin"].includes(staff.role)) {
        throw new AuthorizationError("Chỉ nhân viên và admin mới có thể xem khiếu nại");
      }
      const { status, category, priority } = req.query;
      const query = {};

      if (["admin", "super-admin"].includes(staff.role)) {
        // Admin xem tất cả
      } else if (["supervisor", "manager"].includes(staff.staffInfo?.position)) {
        query.theater = staff.staffInfo.assignedTheater;
      } else {
        query.$or = [{ receivedBy: staff._id }, { assignedTo: staff._id }];
      }

      if (status) query.status = status;
      if (category) query.category = category;
      if (priority) query.priority = priority;

      const complaints = await Complaint.find(query)
        .populate("customer", "fullName phoneNumber email")
        .populate("booking", "bookingCode movieTitle")
        .sort({ priority: -1, createdAt: -1 })
        .limit(100);

      return successResponse(res, { complaints }, "Lấy danh sách khiếu nại thành công");
    } catch (error) {
      console.error("Get complaints error:", error);
      return errorResponse(res, error.message || "Lỗi server", error.statusCode || 500);
    }
  },

  // Get complaint by ID
  getComplaintById: async (req, res) => {
    try {
      const { id } = req.params;

      const complaint = await Complaint.findById(id)
        .populate("customer", "fullName phoneNumber email")
        .populate("booking", "bookingCode movieTitle showTime")
        .populate("receivedBy", "fullName")
        .populate("assignedTo", "fullName")
        .populate("resolvedBy", "fullName");

      if (!complaint) {
        throw new NotFoundError("Không tìm thấy khiếu nại");
      }

      return successResponse(res, { complaint }, "Lấy thông tin khiếu nại thành công");
    } catch (error) {
      console.error("Get complaint error:", error);
      return errorResponse(res, error.message || "Lỗi server", error.statusCode || 500);
    }
  },

  // Update complaint status
  updateComplaintStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status, note } = req.body;

      const staff = await User.findById(req.userId);
      const complaint = await Complaint.findById(id);

      if (!complaint) {
        throw new NotFoundError("Không tìm thấy khiếu nại");
      }

      complaint.status = status;
      await complaint.addTimelineEntry(`Status changed to ${status}`, staff._id, staff.fullName, note);

      return successResponse(res, { complaint }, "Cập nhật trạng thái thành công");
    } catch (error) {
      console.error("Update complaint status error:", error);
      return errorResponse(res, error.message || "Lỗi server", error.statusCode || 500);
    }
  },

  // Resolve complaint
  resolveComplaint: async (req, res) => {
    try {
      const { id } = req.params;
      const { resolution, compensationType, compensationAmount, compensationDetails } = req.body;

      const staff = await User.findById(req.userId);
      const complaint = await Complaint.findById(id);

      if (!complaint) {
        throw new NotFoundError("Không tìm thấy khiếu nại");
      }

      if (compensationType) complaint.compensationType = compensationType;
      if (compensationAmount) complaint.compensationAmount = compensationAmount;
      if (compensationDetails) complaint.compensationDetails = compensationDetails;

      await complaint.resolve(resolution, staff._id, staff.fullName);

      return successResponse(res, { complaint }, "Giải quyết khiếu nại thành công");
    } catch (error) {
      console.error("Resolve complaint error:", error);
      return errorResponse(res, error.message || "Lỗi server", error.statusCode || 500);
    }
  },

  // ============================================
  // INCIDENT MANAGEMENT
  // ============================================

  // Report incident
  reportIncident: async (req, res) => {
    try {
      const staff = await User.findById(req.userId);
      if (!staff || staff.role !== "staff") {
        throw new AuthorizationError("Chỉ nhân viên mới có thể báo cáo sự cố");
      }

      const { type, severity, title, description, location, roomNumber, affectedCustomers } = req.body;

      const incident = new Incident({
        type,
        severity,
        title,
        description,
        location,
        roomNumber,
        affectedCustomers: affectedCustomers || 0,
        theater: staff.staffInfo?.assignedTheater,
        theaterName: staff.staffInfo?.assignedTheater?.name || "Unknown",
        reportedBy: staff._id,
        reportedByName: staff.fullName,
        status: "reported",
      });

      // Auto-escalate critical incidents
      if (severity === "critical") {
        incident.isEscalated = true;
        incident.escalatedTo = "manager";
        incident.escalatedAt = new Date();
      }

      await incident.save();

      return successResponse(res, { incident }, "Báo cáo sự cố thành công", 201);
    } catch (error) {
      console.error("Report incident error:", error);
      return errorResponse(res, error.message || "Lỗi server", error.statusCode || 500);
    }
  },

  // Get incidents
  getIncidents: async (req, res) => {
    try {
      const staff = await User.findById(req.userId);
      if (!staff || staff.role !== "staff") {
        throw new AuthorizationError("Chỉ nhân viên mới có thể xem sự cố");
      }

      const { status, type, severity } = req.query;
      const query = {
        theater: staff.staffInfo?.assignedTheater,
      };

      if (status) query.status = status;
      if (type) query.type = type;
      if (severity) query.severity = severity;

      const incidents = await Incident.find(query)
        .populate("reportedBy", "fullName")
        .populate("acknowledgedBy", "fullName")
        .populate("resolvedBy", "fullName")
        .sort({ severity: -1, reportedAt: -1 })
        .limit(100);

      return successResponse(res, { incidents }, "Lấy danh sách sự cố thành công");
    } catch (error) {
      console.error("Get incidents error:", error);
      return errorResponse(res, error.message || "Lỗi server", error.statusCode || 500);
    }
  },

  // Get incident by ID
  getIncidentById: async (req, res) => {
    try {
      const { id } = req.params;

      const incident = await Incident.findById(id)
        .populate("reportedBy", "fullName")
        .populate("acknowledgedBy", "fullName")
        .populate("resolvedBy", "fullName")
        .populate("affectedSchedules");

      if (!incident) {
        throw new NotFoundError("Không tìm thấy sự cố");
      }

      return successResponse(res, { incident }, "Lấy thông tin sự cố thành công");
    } catch (error) {
      console.error("Get incident error:", error);
      return errorResponse(res, error.message || "Lỗi server", error.statusCode || 500);
    }
  },

  // Acknowledge incident
  acknowledgeIncident: async (req, res) => {
    try {
      const { id } = req.params;

      const staff = await User.findById(req.userId);
      const incident = await Incident.findById(id);

      if (!incident) {
        throw new NotFoundError("Không tìm thấy sự cố");
      }

      await incident.acknowledge(staff._id, staff.fullName);

      return successResponse(res, { incident }, "Xác nhận sự cố thành công");
    } catch (error) {
      console.error("Acknowledge incident error:", error);
      return errorResponse(res, error.message || "Lỗi server", error.statusCode || 500);
    }
  },

  // Resolve incident
  resolveIncident: async (req, res) => {
    try {
      const { id } = req.params;
      const { resolution, preventiveMeasures, rootCause } = req.body;

      const staff = await User.findById(req.userId);
      const incident = await Incident.findById(id);

      if (!incident) {
        throw new NotFoundError("Không tìm thấy sự cố");
      }

      if (preventiveMeasures) incident.preventiveMeasures = preventiveMeasures;
      if (rootCause) incident.rootCause = rootCause;

      await incident.resolve(resolution, staff._id, staff.fullName);

      return successResponse(res, { incident }, "Giải quyết sự cố thành công");
    } catch (error) {
      console.error("Resolve incident error:", error);
      return errorResponse(res, error.message || "Lỗi server", error.statusCode || 500);
    }
  },

  // Add action to incident
  addIncidentAction: async (req, res) => {
    try {
      const { id } = req.params;
      const { action } = req.body;

      const staff = await User.findById(req.userId);
      const incident = await Incident.findById(id);

      if (!incident) {
        throw new NotFoundError("Không tìm thấy sự cố");
      }

      await incident.addAction(action, staff._id, staff.fullName);

      return successResponse(res, { incident }, "Thêm hành động thành công");
    } catch (error) {
      console.error("Add incident action error:", error);
      return errorResponse(res, error.message || "Lỗi server", error.statusCode || 500);
    }
  },
};

export default customerSupportController;
