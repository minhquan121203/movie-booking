import mongoose from "mongoose";
import { generateSlug } from "../utils/slug.js";
const { Schema } = mongoose;

const productSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Tên sản phẩm là bắt buộc"],
      unique: true,
      trim: true,
      minlength: [2, "Tên sản phẩm phải có ít nhất 2 ký tự"],
      maxlength: [100, "Tên sản phẩm không được quá 100 ký tự"],
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
    category: {
      type: String,
      enum: {
        values: ["Popcorn", "Drink", "Combo", "Snack"],
        message: "{VALUE} không phải là danh mục hợp lệ",
      },
      required: [true, "Danh mục là bắt buộc"],
      index: true,
    },
    price: {
      type: Number,
      required: [true, "Giá là bắt buộc"],
      min: [0, "Giá không thể âm"],
    },
    originalPrice: {
      type: Number,
      min: [0, "Giá gốc không thể âm"],
    },
    imageUrl: {
      type: String,
      validate: {
        validator: function (url) {
          return !url || /^https?:\/\/.+/.test(url);
        },
        message: "URL hình ảnh không hợp lệ",
      },
    },
    imagePublicId: {
      type: String, // Cloudinary public ID
    },
    size: {
      type: String,
      enum: {
        values: ["S", "M", "L", "XL", "N/A"],
        message: "{VALUE} không phải là size hợp lệ",
      },
      default: "N/A",
    },
    // Inventory
    inStock: {
      type: Boolean,
      default: true,
      index: true,
    },
    stockQuantity: {
      type: Number,
      default: 999,
      min: [0, "Số lượng không thể âm"],
    },
    lowStockThreshold: {
      type: Number,
      default: 10,
    },
    // Combo items (if category is 'Combo')
    comboItems: [
      {
        product: {
          type: Schema.Types.ObjectId,
          ref: "Product",
        },
        quantity: {
          type: Number,
          default: 1,
          min: 1,
        },
      },
    ],
    // Nutrition info
    calories: Number,
    allergens: [String],
    // Sales statistics
    totalSold: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalRevenue: {
      type: Number,
      default: 0,
      min: 0,
    },
    // SEO & Marketing
    featured: {
      type: Boolean,
      default: false,
      index: true,
    },
    discount: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    tags: [String],
    // Audit
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
    //  FIX #8: Enable optimistic locking cho Product
    versionKey: "__v",
    optimisticConcurrency: true,
  }
);

// === INDEXES ===
productSchema.index({ name: "text", description: "text" });
productSchema.index({ category: 1, inStock: 1 });
productSchema.index({ price: 1 });
productSchema.index({ featured: -1, totalSold: -1 });

// === VIRTUAL FIELDS ===
productSchema.virtual("discountedPrice").get(function () {
  if (this.discount > 0) {
    return this.price * (1 - this.discount / 100);
  }
  return this.price;
});

productSchema.virtual("isLowStock").get(function () {
  return this.stockQuantity <= this.lowStockThreshold;
});

productSchema.virtual("discountAmount").get(function () {
  if (this.discount > 0) {
    return this.price * (this.discount / 100);
  }
  return 0;
});

// === PRE-SAVE MIDDLEWARE ===
productSchema.pre("save", function (next) {
  // Auto-generate slug using slugify package
  if (this.isModified("name") && !this.slug) {
    this.slug = generateSlug(this.name);
  }

  // Auto-set inStock based on quantity
  if (this.stockQuantity === 0) {
    this.inStock = false;
  }

  next();
});

// === INSTANCE METHODS ===
productSchema.methods.decreaseStock = function (quantity) {
  if (this.stockQuantity < quantity) {
    throw new Error("Không đủ hàng trong kho");
  }
  this.stockQuantity -= quantity;
  this.totalSold += quantity;
  if (this.stockQuantity === 0) {
    this.inStock = false;
  }
  return this.save();
};

productSchema.methods.increaseStock = function (quantity) {
  this.stockQuantity += quantity;
  if (this.stockQuantity > 0) {
    this.inStock = true;
  }
  return this.save();
};

// === STATIC METHODS ===
productSchema.statics.findInStock = function () {
  return this.find({ inStock: true, isActive: true });
};

productSchema.statics.findByCategory = function (category) {
  return this.find({ category, inStock: true, isActive: true });
};

productSchema.statics.getBestSellers = function (limit = 10) {
  return this.find({ isActive: true }).sort({ totalSold: -1 }).limit(limit);
};

export default mongoose.model("Product", productSchema);
