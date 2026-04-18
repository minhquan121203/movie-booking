import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";

class CloudinaryService {
  constructor() {
    if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
      });

      console.log("Cloudinary initialized");
    } else {
      console.warn("Cloudinary credentials not found");
    }
  }

  // Upload image from buffer (for multer)
  uploadFromBuffer(buffer, options = {}) {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: options.folder || "cinema",
          resource_type: options.resourceType || "image",
          transformation: options.transformation,
          ...options,
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      );

      streamifier.createReadStream(buffer).pipe(uploadStream);
    });
  }

  // Upload image from URL
  async uploadFromUrl(url, options = {}) {
    try {
      const result = await cloudinary.uploader.upload(url, {
        folder: options.folder || "cinema",
        resource_type: options.resourceType || "image",
        transformation: options.transformation,
        ...options,
      });

      console.log(`Uploaded from URL: ${result.secure_url}`);
      return {
        success: true,
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        width: result.width,
        height: result.height,
      };
    } catch (error) {
      console.error("Upload from URL error:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Upload movie poster
  async uploadMoviePoster(buffer, movieTitle) {
    try {
      const result = await this.uploadFromBuffer(buffer, {
        folder: "cinema/posters",
        public_id: `poster_${Date.now()}`,
        transformation: [{ width: 300, height: 450, crop: "fill", quality: "auto" }, { fetch_format: "auto" }],
      });

      console.log(`Uploaded movie poster: ${result.secure_url}`);
      return {
        success: true,
        url: result.secure_url,
        publicId: result.public_id,
      };
    } catch (error) {
      console.error("Upload movie poster error:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Upload user avatar
  async uploadAvatar(buffer, userId) {
    try {
      const result = await this.uploadFromBuffer(buffer, {
        folder: "cinema/avatars",
        public_id: `avatar_${userId}`,
        transformation: [
          { width: 200, height: 200, crop: "fill", gravity: "face", quality: "auto" },
          { radius: "max" },
          { fetch_format: "auto" },
        ],
        overwrite: true,
      });

      console.log(`Uploaded avatar: ${result.secure_url}`);
      return {
        success: true,
        url: result.secure_url,
        publicId: result.public_id,
      };
    } catch (error) {
      console.error("Upload avatar error:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Upload product image
  async uploadProductImage(buffer, productName) {
    try {
      const result = await this.uploadFromBuffer(buffer, {
        folder: "cinema/products",
        public_id: `product_${Date.now()}`,
        transformation: [{ width: 400, height: 400, crop: "fill", quality: "auto" }, { fetch_format: "auto" }],
      });

      console.log(`Uploaded product image: ${result.secure_url}`);
      return {
        success: true,
        url: result.secure_url,
        publicId: result.public_id,
      };
    } catch (error) {
      console.error("Upload product image error:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Upload banner
  async uploadBanner(buffer) {
    try {
      const result = await this.uploadFromBuffer(buffer, {
        folder: "cinema/banners",
        public_id: `banner_${Date.now()}`,
        transformation: [{ width: 1920, height: 600, crop: "fill", quality: "auto" }, { fetch_format: "auto" }],
      });

      console.log(`Uploaded banner: ${result.secure_url}`);
      return {
        success: true,
        url: result.secure_url,
        publicId: result.public_id,
      };
    } catch (error) {
      console.error("Upload banner error:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Delete image
  async deleteImage(publicId) {
    try {
      const result = await cloudinary.uploader.destroy(publicId);

      if (result.result === "ok") {
        console.log(`Deleted image: ${publicId}`);
        return { success: true };
      } else {
        console.warn(`Delete failed: ${publicId}`);
        return { success: false, error: "Delete failed" };
      }
    } catch (error) {
      console.error("Delete image error:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Delete multiple images
  async deleteMultiple(publicIds) {
    try {
      const result = await cloudinary.api.delete_resources(publicIds);

      console.log(`Deleted ${Object.keys(result.deleted).length} images`);
      return {
        success: true,
        deleted: result.deleted,
        failed: result.deleted_counts,
      };
    } catch (error) {
      console.error("Delete multiple images error:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Get image details
  async getImageDetails(publicId) {
    try {
      const result = await cloudinary.api.resource(publicId);

      return {
        success: true,
        data: {
          url: result.secure_url,
          format: result.format,
          width: result.width,
          height: result.height,
          bytes: result.bytes,
          createdAt: result.created_at,
        },
      };
    } catch (error) {
      console.error("Get image details error:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Generate optimized URL
  generateOptimizedUrl(publicId, options = {}) {
    return cloudinary.url(publicId, {
      transformation: [{ quality: "auto", fetch_format: "auto" }, ...(options.transformation || [])],
      secure: true,
    });
  }

  // Generate thumbnail URL
  generateThumbnail(publicId, width = 150, height = 150) {
    return cloudinary.url(publicId, {
      transformation: [{ width, height, crop: "fill", quality: "auto" }, { fetch_format: "auto" }],
      secure: true,
    });
  }

  // List images in folder
  async listImages(folder, maxResults = 100) {
    try {
      const result = await cloudinary.api.resources({
        type: "upload",
        prefix: folder,
        max_results: maxResults,
      });

      return {
        success: true,
        images: result.resources.map((r) => ({
          publicId: r.public_id,
          url: r.secure_url,
          format: r.format,
          width: r.width,
          height: r.height,
          createdAt: r.created_at,
        })),
        total: result.resources.length,
      };
    } catch (error) {
      console.error("List images error:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Create archive (zip of images)
  async createArchive(publicIds, targetFormat = "zip") {
    try {
      const result = await cloudinary.uploader.create_archive({
        public_ids: publicIds,
        target_format: targetFormat,
        target_public_id: `archive_${Date.now()}`,
      });

      console.log(`Created archive: ${result.secure_url}`);
      return {
        success: true,
        url: result.secure_url,
        publicId: result.public_id,
      };
    } catch (error) {
      console.error("Create archive error:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

const cloudinaryService = new CloudinaryService();
export default cloudinaryService;
