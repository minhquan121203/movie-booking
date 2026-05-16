import bcrypt from "bcryptjs";
import mongoose from "mongoose";
const { Schema } = mongoose;

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: false, //  FIX: Username is optional, email is the primary identifier
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
      minlength: [3, "Username phải có ít nhất 3 ký tự"],
      maxlength: [30, "Username không được quá 30 ký tự"],
      match: [/^[a-zA-Z0-9_]+$/, "Username chỉ chứa chữ, số và dấu gạch dưới"],
    },
    email: {
      type: String,
      required: [true, "Email là bắt buộc"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Email không hợp lệ"],
      index: true,
    },
    password: {
      type: String,
      required: function () {
        return this.authProviders.includes("local");
      },
      minlength: [6, "Mật khẩu phải có ít nhất 6 ký tự"],
    },
    fullName: {
      type: String,
      required: [true, "Họ tên là bắt buộc"],
      trim: true,
      minlength: [2, "Họ tên phải có ít nhất 2 ký tự"],
      maxlength: [100, "Họ tên không được quá 100 ký tự"],
    },
    phoneNumber: {
      type: String,
      trim: true,
      match: [/^[0-9]{10,11}$/, "Số điện thoại không hợp lệ"],
      index: true,
    },
    profilePicture: {
      type: String,
      default: "https://via.placeholder.com/200x200?text=Avatar",
    },
    cloudinaryPublicId: {
      type: String, // For deleting old images
    },
    role: {
      type: String,
      enum: {
        values: ["customer", "admin", "super-admin", "staff"],
        message: "{VALUE} không phải là role hợp lệ",
      },
      default: "customer",
      index: true,
    },
    // 🔥QUẢN LÝ VÙNG (Hà Nội, Cần Thơ,...)
    assignedCity: {
      type: String,
      trim: true,
      default: null, // Super Admin và Customer sẽ để null
      index: true,
     },
    // Staff-specific information
    staffInfo: {
      staffId: {
        type: String,
        unique: true,
        sparse: true,
        index: true,
      },
      assignedTheater: {
        type: Schema.Types.ObjectId,
        ref: "Theater",
      },
      position: {
        type: String,
        enum: ["cashier", "usher", "supervisor", "manager"],
      },
      shift: {
        type: String,
        enum: ["morning", "afternoon", "evening", "night"],
      },
      hireDate: {
        type: Date,
      },
      salary: {
        type: Number,
        min: 0,
      },
      isActive: {
        type: Boolean,
        default: true,
      },
      permissions: {
        type: [String],
        default: [],
      },
    },
    authProviders: {
      type: [String],
      enum: ["local", "google", "facebook"],
      required: true,
      default: ["local"],
      validate: {
        validator: function (arr) {
          return Array.isArray(arr) && arr.length > 0;
        },
        message: "Phải có ít nhất một phương thức đăng nhập",
      },
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    facebookId: {
      type: String,
      unique: true,
      sparse: true,
    },
    loyaltyPoints: {
      type: Number,
      default: 0,
      min: [0, "Điểm không thể âm"],
    },
    membershipLevel: {
      type: String,
      enum: {
        values: ["Bạc", "Vàng", "Kim Cương"],
        message: "{VALUE} không phải là hạng thành viên hợp lệ",
      },
      default: "Bạc",
    },
    permissions: {
      type: [String],
      default: [],
      validate: {
        validator: function (permissions) {
          const validPermissions = [
            "manage_movies",
            "manage_schedules",
            "manage_bookings",
            "manage_users",
            "manage_theaters",
            "view_reports",
          ];
          return permissions.every((p) => validPermissions.includes(p));
        },
        message: "Permission không hợp lệ",
      },
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isPhoneVerified: {
      type: Boolean,
      default: false,
    },
    lastLogin: {
      type: Date,
    },
    passwordChangedAt: {
      type: Date,
    },
    resetPasswordToken: {
      type: String,
    },
    resetPasswordExpires: {
      type: Date,
    },
    emailVerificationToken: {
      type: String,
    },
    emailVerificationExpires: {
      type: Date,
    },

    otp: {
      type: String,
    },
    otpExpires: {
      type: Date,
    },
    verified_age_level: {
      type: Number,
      default: null,
    },
    age_verified_at: {
      type: Date,
      default: null,
    },

    refreshToken: {
      type: String,
    },
    refreshTokenExpires: {
      type: Date,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// === INDEXES ===
userSchema.index({ isDeleted: 1 });
userSchema.index({ email: 1, authProviders: 1 });
userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ loyaltyPoints: -1 });

// === VIRTUAL FIELDS ===
userSchema.virtual("bookings", {
  ref: "Booking",
  localField: "_id",
  foreignField: "customer",
});

userSchema.virtual("reviews", {
  ref: "Review",
  localField: "_id",
  foreignField: "customer",
});

userSchema.virtual("isAdmin").get(function () {
  return ["admin", "super-admin"].includes(this.role);
});

userSchema.virtual("isAgeVerified").get(function () {
  return this.verified_age_level !== null && this.verified_age_level !== undefined;
});

userSchema.virtual("nextMembershipLevel").get(function () {
  if (this.membershipLevel === "Bạc" && this.loyaltyPoints >= 500) return "Vàng";
  if (this.membershipLevel === "Vàng" && this.loyaltyPoints >= 1125) return "Kim Cương";
  return this.membershipLevel;
});

// === PRE-SAVE MIDDLEWARE ===
userSchema.pre("save", async function (next) {
  // Hash password nếu có local auth
  if (this.isModified("password") && this.authProviders.includes("local")) {
    try {
      const salt = await bcrypt.genSalt(12);
      this.password = await bcrypt.hash(this.password, salt);
      this.passwordChangedAt = new Date();
    } catch (error) {
      return next(error);
    }
  }

  // Auto-upgrade membership
  if (this.loyaltyPoints >= 1125 && this.membershipLevel !== "Kim Cương") {
    this.membershipLevel = "Kim Cương";
  } else if (this.loyaltyPoints >= 500 && this.membershipLevel === "Bạc") {
    this.membershipLevel = "Vàng";
  }

  next();
});

// === INSTANCE METHODS ===
userSchema.methods.hasPermission = function (permission) {
    if (this.role === "super-admin") return true;

    if (!this.isActive) return false;

    return this.permissions.includes(permission);
};

userSchema.methods.redeemLoyaltyPoints = function (points) {
  if (this.loyaltyPoints < points) {
    throw new Error("Không đủ điểm");
  }
  this.loyaltyPoints -= points;
  return this.save();
};

userSchema.methods.hasPermission = function (permission) {
  if (this.role === "super-admin") return true;
  return this.permissions.includes(permission);
};

// === STATIC METHODS ===
userSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase() });
};

userSchema.statics.getTopCustomers = function (limit = 10) {
  return this.find({ role: "customer", isActive: true })
    .sort({ loyaltyPoints: -1 })
    .limit(limit)
    .select("fullName email loyaltyPoints membershipLevel");
};

export default mongoose.model("User", userSchema);
