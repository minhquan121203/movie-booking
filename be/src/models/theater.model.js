import mongoose from "mongoose";
import { VIETNAM_CITIES } from "../constants/location.js";
import { generateSlug } from "../utils/slug.js";
const { Schema } = mongoose;

const seatSchema = new Schema({
  seatNumber: {
    type: String,
    required: true,
    match: [/^[A-Z]\d+$/, "Số ghế không hợp lệ (VD: A1, B5)"],
  },
  seatType: {
    type: String,
    enum: ["Thường", "VIP", "Ghế đôi"],
    default: "Thường",
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
  row: {
    type: String,
    required: true,
  },
  column: {
    type: Number,
    required: true,
  },
  _id: false,
});

const roomSchema = new Schema({
  roomName: {
    type: String,
    required: [true, "Tên phòng là bắt buộc"],
    trim: true,
  },
  roomType: {
    type: String,
    enum: {
      values: ["2D", "3D", "IMAX", "4DX"],
      message: "{VALUE} không phải là loại phòng hợp lệ",
    },
    required: true,
  },
  totalSeats: {
    type: Number,
    required: true,
    min: [1, "Số ghế phải lớn hơn 0"],
  },
  rows: {
    type: Number,
    required: true,
    min: 1,
    max: 26,
  },
  seatsPerRow: {
    type: Number,
    required: true,
    min: 1,
  },
  seatMap: {
    type: [seatSchema],
    required: [true, "Sơ đồ ghế là bắt buộc"],
    validate: {
      validator: function (seatMap) {
        // Không phải array => fail luôn
        if (!Array.isArray(seatMap)) return false;

        // Nếu vì lý do gì đó totalSeats chưa có, bỏ qua validate để không crash
        if (typeof this.totalSeats !== "number") return true;

        // Check chính
        return seatMap.length === this.totalSeats;
      },
      message: "Số ghế trong seatMap phải khớp với totalSeats",
    },
  },

  screenType: {
    type: String,
    enum: ["Standard", "IMAX", "Dolby Atmos"],
    default: "Standard",
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
});

const theaterSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Tên rạp là bắt buộc"],
      trim: true,
      index: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      index: true,
    },
    address: {
      type: String,
      required: [true, "Địa chỉ là bắt buộc"],
      trim: true,
    },
    city: {
      type: String,
      required: [true, "Thành phố là bắt buộc"],
      trim: true,
      index: true,
      enum: {
        values: VIETNAM_CITIES,
        message: "{VALUE} không phải là thành phố hợp lệ",
      },
    },
    district: {
      type: String,
      trim: true,
    },
    phoneNumber: {
      type: String,
      match: [/^[0-9]{10,11}$/, "Số điện thoại không hợp lệ"],
    },
    email: {
      type: String,
      match: [/^\S+@\S+\.\S+$/, "Email không hợp lệ"],
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        validate: {
          validator: function (coords) {
            return coords.length === 2 && coords[0] >= -180 && coords[0] <= 180 && coords[1] >= -90 && coords[1] <= 90;
          },
          message: "Tọa độ không hợp lệ",
        },
      },
    },
    rooms: {
      type: [roomSchema],
      default: [],
      // Removed validation to allow creating theater without rooms initially
      // Rooms can be added later via update endpoint
    },
    amenities: {
      type: [String],
      default: [],
    },
    images: [
      {
        url: String,
        publicId: String,
        caption: String,
      },
    ],
    openingHours: {
      type: String,
      default: "08:00 - 23:00",
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
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
theaterSchema.index({ location: "2dsphere" });
theaterSchema.index({ city: 1, isActive: 1 });
theaterSchema.index({ name: "text", address: "text" });

// === VIRTUAL FIELDS ===
theaterSchema.virtual("totalRooms").get(function () {
  return this.rooms?.length || 0;
});

theaterSchema.virtual("totalCapacity").get(function () {
  return this.rooms?.reduce((sum, room) => sum + room.totalSeats, 0) || 0;
});

// === PRE-SAVE MIDDLEWARE ===
theaterSchema.pre("save", function (next) {
  if (this.isModified("name") && !this.slug) {
    this.slug = generateSlug(this.name);
  }
  next();
});

// === INSTANCE METHODS ===
theaterSchema.methods.getRoomById = function (roomId) {
  return this.rooms.id(roomId);
};

theaterSchema.methods.getAvailableRooms = function () {
  return this.rooms.filter((room) => room.isActive);
};

// === STATIC METHODS ===
theaterSchema.statics.findNearby = function (longitude, latitude, maxDistance = 10000) {
  return this.find({
    location: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [longitude, latitude],
        },
        $maxDistance: maxDistance,
      },
    },
    isActive: true,
  });
};

theaterSchema.statics.findByCity = function (city) {
  return this.find({
    city: new RegExp(city, "i"),
    isActive: true,
  }).sort({ name: 1 });
};

export default mongoose.model("Theater", theaterSchema);
