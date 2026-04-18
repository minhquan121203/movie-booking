import mongoose from "mongoose";
import { generateSlug } from "../utils/slug.js";
const { Schema } = mongoose;

const genreSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Tên thể loại là bắt buộc"],
      unique: true,
      trim: true,
      minlength: [2, "Tên thể loại phải có ít nhất 2 ký tự"],
      maxlength: [50, "Tên thể loại không được quá 50 ký tự"],
      index: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Mô tả không được quá 500 ký tự"],
    },
    icon: String,
    color: {
      type: String,
      match: [/^#[0-9A-F]{6}$/i, "Mã màu không hợp lệ"],
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
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

// === VIRTUAL FIELDS ===
genreSchema.virtual("movies", {
  ref: "Movie",
  localField: "_id",
  foreignField: "genres",
});

genreSchema.virtual("movieCount", {
  ref: "Movie",
  localField: "_id",
  foreignField: "genres",
  count: true,
});

// === PRE-SAVE MIDDLEWARE ===
genreSchema.pre("save", function (next) {
  if (this.isModified("name") && !this.slug) {
    this.slug = generateSlug(this.name);
  }
  next();
});

export default mongoose.model("Genre", genreSchema);
