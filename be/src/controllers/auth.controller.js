import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { generateAuthToken, generatePasswordResetToken, generateRefreshToken } from "../helpers/generateToken.js";
import User from "../models/user.model.js";
import { errorResponse, successResponse } from "../utils/response.js";

const authController = {
  // Đăng ký tài khoản mới
  register: async (req, res) => {
    try {
      const { username, email, password, fullName, phoneNumber } = req.body;

      // Helper function to set refresh token cookie
      const setRefreshTokenCookie = (res, refreshToken) => {
        const refreshTokenExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        res.cookie("refreshToken", refreshToken, {
          httpOnly: true,
          secure: true,
          sameSite: "none",
          expires: refreshTokenExpires,
        });
      };

      // Validate input
      if (!email || !password || !fullName) {
        return errorResponse(res, "Email, mật khẩu và họ tên là bắt buộc", 400);
      }

      // Validate password strength
      if (password.length < 6) {
        return errorResponse(res, "Mật khẩu phải có ít nhất 6 ký tự", 400);
      }

      // Kiểm tra email đã tồn tại
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return errorResponse(res, "Email đã được sử dụng", 400);
      }

      // Kiểm tra username đã tồn tại (nếu có)
      if (username) {
        const existingUsername = await User.findOne({ username: username.toLowerCase() });
        if (existingUsername) {
          return errorResponse(res, "Username đã được sử dụng", 400);
        }
      }

      // Không hash ở đây, để model pre-save hook xử lý
      // Tạo user mới
      const newUser = new User({
        username: username?.toLowerCase(),
        email: email.toLowerCase(),
        password: password, // Plain password, sẽ được hash trong pre-save hook
        fullName,
        phoneNumber,
        authProviders: ["local"],
        role: "customer",
      });

      // await newUser.save(); // Pre-save hook sẽ hash password

      // Tạo token
      // const token = jwt.sign({ userId: newUser._id, role: newUser.role }, process.env.JWT_SECRET, { expiresIn: "7d" });
      // const token = generateAuthToken(newUser);

      const accessToken = generateAuthToken(newUser);
      const refreshToken = generateRefreshToken(newUser);

      // Lưu refresh token
      newUser.refreshToken = refreshToken;
      newUser.refreshTokenExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      await newUser.save();

      // const data = {
      //   token,
      //   user: {
      //     // id: newUser._id,
      //     _id: newUser._id,
      //     email: newUser.email,
      //     fullName: newUser.fullName,
      //     role: newUser.role,
      //   },
      // };

      setRefreshTokenCookie(res, refreshToken);

      const data = {
        accessToken,
        // refreshToken, // No longer sending refresh token in body
        user: {
          _id: newUser._id,
          email: newUser.email,
          fullName: newUser.fullName,
          role: newUser.role,
        },
      };

      return successResponse(res, data, "Đăng ký thành công", 201);
    } catch (error) {
      console.error("Register error:", error);
      return errorResponse(res, "Lỗi server không xác định");
    }
  },

  // Đăng nhập
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      // Validate input
      if (!email || !password) {
        return errorResponse(res, "Email và mật khẩu là bắt buộc", 400);
      }

      // Tìm user
      const user = await User.findOne({ email: email.toLowerCase(), isDeleted: { $ne: true } });
      if (!user) {
        return errorResponse(res, "Email hoặc mật khẩu không đúng", 401);
      }

      if (!user.authProviders.includes("local")) {
        return errorResponse(res, "Tài khoản này chỉ hỗ trợ đăng nhập bằng Google", 400);
      }

      if (!user.password) {
        return errorResponse(
          res,
          "Tài khoản này được tạo bằng Google. Vui lòng nhấn nút 'Login with Google' phía trên để đăng nhập",
          400
        );
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return errorResponse(res, "Email hoặc mật khẩu không đúng", 401);
      }

      //Bật/tắt OTP
      const ENABLE_OTP_LOGIN = false;

      // Nếu là Admin, Super-admin hoặc Staff thì chặn lại đòi OTP
      if (ENABLE_OTP_LOGIN && ["admin", "super-admin", "staff"].includes(user.role)) {
        // 1. Tạo mã OTP 6 số ngẫu nhiên
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

        // 2. Lưu vào Database (cho sống 5 phút)
        user.otp = otpCode;
        user.otpExpires = new Date(Date.now() + 5 * 60 * 1000);
        await user.save();

        // 3. Gọi SendGrid gửi mail (Nhớ đảm bảo file email.service.js có hàm này hoặc tương tự nhé)
        try {
          const emailService = (await import("../services/email.service.js")).default;
          // Tạm thời log ra console để fen dễ test lúc dev
          console.log(`🚀 [DEV OTP] Mã OTP của Admin ${user.email} là: ${otpCode}`);

          // Gửi mail thực tế (fen có thể tự code thêm hàm sendOTP trong emailService)
          // await emailService.sendEmail(user.email, "Mã xác thực Admin", `Mã OTP của bạn là: ${otpCode}. Mã có hiệu lực 5 phút.`);
        } catch (err) {
          console.log("Lỗi gửi mail OTP:", err);
        }

        // 4. Báo về Frontend là phải nhập OTP
        return res.status(200).json({
          success: true,
          requireOTP: true,
          email: user.email,
          message: "Vui lòng kiểm tra email để lấy mã OTP xác thực."
        });
      }

      // Tạo token
      // const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });
      // const token = generateAuthToken(user);
      const accessToken = generateAuthToken(user);
      const refreshToken = generateRefreshToken(user);

      // Lưu refresh token vào database
      user.refreshToken = refreshToken;
      user.refreshTokenExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      await user.save();

      // Lưu refresh token
      // Note: Helper function setRefreshTokenCookie is not available in this scope effectively unless defined outside or repeated. 
      // Better to define it outside authController or just repeat logic for now to avoid large refactor, or define it at top of file. 
      // Actually, defining it inside each method is wet. Let's define it as a standalone helper or just repeat the 5 lines.
      // Repeating for simplicity and safety in this refactor.
      
      const refreshTokenExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        expires: refreshTokenExpires,
      });

      const data = {
        accessToken,
        // refreshToken,
        user: {
          // id: user._id,
          _id: user._id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          profilePicture: user.profilePicture,
          loyaltyPoints: user.loyaltyPoints,
          membershipLevel: user.membershipLevel,
        },
      };

      return successResponse(res, data, "Đăng nhập thành công");
    } catch (error) {
      console.error("Login error:", error);
      return errorResponse(res, "Lỗi server không xác định");
    }
  },

  // Đăng nhập bằng   ogle
  googleLogin: async (req, res) => {
    try {
      const { googleId, email, fullName, profilePicture } = req.body;

      if (!googleId || !email) {
        return errorResponse(res, "Thông tin Google không hợp lệ", 400);
      }

      // Tìm user theo googleId
      let user = await User.findOne({ googleId, isDeleted: { $ne: true } });

      if (!user) {
        // Tìm theo email
        user = await User.findOne({ email: email.toLowerCase(), isDeleted: { $ne: true } });

        if (user) {
          // GỘP TÀI KHOẢN: Thêm Google vào authProviders
          user.googleId = googleId;
          if (!user.authProviders.includes("google")) {
            user.authProviders.push("google");
          }

          // Cập nhật avatar nếu chưa có
          if (!user.profilePicture || user.profilePicture.includes("placeholder")) {
            user.profilePicture = profilePicture;
          }

          // await user.save();
        } else {
          // TẠO MỚI: Chỉ có Google
          user = new User({
            googleId,
            email: email.toLowerCase(),
            fullName,
            profilePicture:
              profilePicture || "https://ui-avatars.com/api/?name=User&background=0D8ABC&color=fff&size=200",
            authProviders: ["google"], // Chỉ Google
            role: "customer",
          });
          // await user.save();
        }
      }

      // const token = generateAuthToken(user);
      const accessToken = generateAuthToken(user);
      const refreshToken = generateRefreshToken(user);

      // Lưu refresh token vào database
      user.refreshToken = refreshToken;
      user.refreshTokenExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      await user.save();

      // Lưu refresh token cookie
      const refreshTokenExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        expires: refreshTokenExpires,
      });

      const data = {
        accessToken,
        // refreshToken,
        user: {
          // id: user._id,
          _id: user._id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          profilePicture: user.profilePicture,
          loyaltyPoints: user.loyaltyPoints,
          membershipLevel: user.membershipLevel,
        },
      };

      return successResponse(res, data, "Đăng nhập Google thành công");
    } catch (error) {
      console.error("Google login error:", error);
      return errorResponse(res, "Lỗi server không xác định");
    }
  },

  // Lấy thông tin user hiện tại
  getCurrentUser: async (req, res) => {
    try {
      const user = await User.findById(req.userId).select("-password");

      if (!user) {
        return errorResponse(res, "Không tìm thấy người dùng", 404);
      }

      return successResponse(res, user, "Lấy thông tin người dùng thành công");
    } catch (error) {
      console.error("Get current user error:", error);
      return errorResponse(res, "Lỗi server không xác định");
    }
  },

  // Đổi mật khẩu
  changePassword: async (req, res) => {
    try {
      const { oldPassword, newPassword } = req.body;

      if (!oldPassword || !newPassword) {
        return errorResponse(res, "Vui lòng nhập đầy đủ thông tin", 400);
      }

      if (newPassword.length < 6) {
        return errorResponse(res, "Mật khẩu mới phải có ít nhất 6 ký tự", 400);
      }

      const user = await User.findById(req.userId);

      if (!user.authProviders.includes("local")) {
        return errorResponse(res, "Tài khoản này không hỗ trợ đổi mật khẩu", 400);
      }

      // Kiểm tra mật khẩu cũ
      const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
      if (!isPasswordValid) {
        return errorResponse(res, "Mật khẩu cũ không đúng", 401);
      }

      //    Không hash ở đây, để pre-save hook xử lý
      user.password = newPassword; //  Plain password

      user.refreshToken = null;
      user.refreshTokenExpires = null;

      await user.save(); //  Pre-save hook sẽ hash

      // Clear cookie
      res.clearCookie("refreshToken");

      return successResponse(res, {}, "Đổi mật khẩu thành công");
    } catch (error) {
      console.error("Change password error:", error);
      return errorResponse(res, "Lỗi server không xác định");
    }
  },

  // Quên mật khẩu (gửi email reset)
  forgotPassword: async (req, res) => {
    try {
      const { email } = req.body;

      const user = await User.findOne({ email: email.toLowerCase(), isDeleted: { $ne: true } });
      if (!user) {
        return errorResponse(res, "Email không tồn tại trong hệ thống", 404);
      }

      if (!user.authProviders.includes("local")) {
        return errorResponse(res, "Tài khoản này chỉ hỗ trợ đăng nhập bằng Google. Không cần reset mật khẩu.", 400);
      }

      // Tạo reset token
      const resetToken = generatePasswordResetToken(user._id);

      //  : Gửi email với link reset
      const emailService = (await import("../services/email.service.js")).default;
      const emailResult = await emailService.sendPasswordResetEmail(user, resetToken);

      if (!emailResult.success) {
        console.error("Failed to send password reset email:", emailResult.error);
        // Không fail request nếu email gửi lỗi, chỉ log
      } else {
        console.log(` Password reset email sent successfully to ${user.email}`);
      }

      //  DEV ONLY: Log reset URL for testing
      if (process.env.NODE_ENV === "development") {
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
        console.log(`🔗 Reset URL (DEV ONLY): ${resetUrl}`);
      }

      // Trong production, không nên trả về token trong response
      // Chỉ trả về thông báo đã gửi email
      return successResponse(res, {}, "Đã gửi link reset mật khẩu đến email của bạn. Vui lòng kiểm tra hộp thư.");
    } catch (error) {
      console.error("Forgot password error:", error);
      return errorResponse(res, "Lỗi server không xác định");
    }
  },

  // Reset mật khẩu
  resetPassword: async (req, res) => {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return errorResponse(res, "Vui lòng nhập đầy đủ thông tin", 400);
      }

      if (newPassword.length < 6) {
        return errorResponse(res, "Mật khẩu mới phải có ít nhất 6 ký tự", 400);
      }

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded.purpose !== "reset-password") {
        return errorResponse(res, "Token không hợp lệ", 400);
      }

      const user = await User.findById(decoded.userId);
      if (!user) {
        return errorResponse(res, "Không tìm thấy người dùng", 404);
      }

      //    Không hash ở đây, để pre-save hook xử lý
      user.password = newPassword; //  Plain password
      await user.save(); //  Pre-save hook sẽ hash

      return successResponse(res, {}, "Reset mật khẩu thành công");
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        return errorResponse(res, "Reset token đã hết hạn", 401);
      }
      if (error.name === "JsonWebTokenError") {
        return errorResponse(res, "Reset token không hợp lệ", 401);
      }
      console.error("Reset password error:", error);
      return errorResponse(res, "Lỗi server không xác định", 500);
    }
  },

  // Thêm vào authController
  setPassword: async (req, res) => {
    try {
      const { newPassword } = req.body;

      if (!newPassword || newPassword.length < 6) {
        return errorResponse(res, "Mật khẩu phải có ít nhất 6 ký tự", 400);
      }

      const user = await User.findById(req.userId);

      // Nếu đã có local auth
      if (user.authProviders.includes("local")) {
        return errorResponse(res, "Tài khoản đã có mật khẩu. Vui lòng dùng chức năng đổi mật khẩu.", 400);
      }

      // Thêm local auth + set password
      user.password = newPassword;
      user.authProviders.push("local");
      await user.save();

      return successResponse(res, {}, "Thiết lập mật khẩu thành công. Bạn có thể đăng nhập bằng email/password.");
    } catch (error) {
      console.error("Set password error:", error);
      return errorResponse(res, "Lỗi server không xác định");
    }
  },

  refreshToken: async (req, res) => {
    try {
      // Lấy token từ cookie
      const refreshToken = req.cookies.refreshToken;

      if (!refreshToken) {
        return errorResponse(res, "Refresh token là bắt buộc", 400);
      }

      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      if (decoded.tokenType !== "refresh") {
        return errorResponse(res, "Token không hợp lệ", 401);
      }

      const user = await User.findOne({ _id: decoded.userId, isDeleted: { $ne: true } });
      if (!user || user.refreshToken !== refreshToken) {
        return errorResponse(res, "Refresh token không hợp lệ", 401);
      }

      if (user.refreshTokenExpires < new Date()) {
        return errorResponse(res, "Refresh token đã hết hạn", 401);
      }

      const newAccessToken = generateAuthToken(user);
      const newRefreshToken = generateRefreshToken(user);

      user.refreshToken = newRefreshToken;
      user.refreshTokenExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      await user.save();

      // Set new cookie
      const refreshTokenExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      res.cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        expires: refreshTokenExpires,
      });

      return successResponse(
        res,
        {
          accessToken: newAccessToken,
          // refreshToken: newRefreshToken, // Cookie only
        },
        "Refresh token thành công"
      );
    } catch (error) {
      return errorResponse(res, "Refresh token không hợp lệ", 401);
    }
  },

  // 🔥 HÀM MỚI: Kiểm tra OTP của Admin
  verifyAdminOTP: async (req, res) => {
    try {
      const { email, otp } = req.body;

      if (!email || !otp) {
        return errorResponse(res, "Vui lòng nhập email và mã OTP", 400);
      }

      // Tìm user có email, đúng mã OTP, và thời gian chưa hết hạn ($gt: greater than now)
      const user = await User.findOne({
        email: email.toLowerCase(),
        otp: otp,
        otpExpires: { $gt: Date.now() },
        isDeleted: { $ne: true }
      });

      if (!user) {
        return errorResponse(res, "Mã OTP không đúng hoặc đã hết hạn!", 401);
      }

      // Xác thực thành công -> Xóa OTP đi cho sạch sẽ
      user.otp = undefined;
      user.otpExpires = undefined;

      // Tạo Token xịn cấp quyền cho vào
      const accessToken = generateAuthToken(user);
      const refreshToken = generateRefreshToken(user);

      user.refreshToken = refreshToken;
      user.refreshTokenExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      await user.save();

      const refreshTokenExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        expires: refreshTokenExpires,
      });

      const data = {
        accessToken,
        user: {
          _id: user._id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          profilePicture: user.profilePicture,
        },
      };

      return successResponse(res, data, "Xác thực OTP thành công! Chào mừng sếp.");
    } catch (error) {
      console.error("Verify OTP error:", error);
      return errorResponse(res, "Lỗi server không xác định");
    }
  },
};

export default authController;
