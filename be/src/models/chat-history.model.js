import mongoose from "mongoose";

const ChatHistorySchema = new mongoose.Schema(
    {
        sessionId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        userName: {
            type: String,
            default: "Khách VIP",
        },
        messages: [
            {
                role: {
                    type: String,
                    enum: ["user", "bot"],
                    required: true,
                },
                content: {
                    type: String,
                    required: true,
                },
                type: {
                    type: String,
                    enum: ["text", "movie_list", "action_booking"],
                    default: "text",
                },
                data: mongoose.Schema.Types.Mixed,
                timestamp: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],
        lastActivity: {
            type: Date,
            default: Date.now,
            index: true,
        },
    },
    {
        timestamps: true,
    }
);

// TTL Index: Xóa tự động sau 30 ngày
ChatHistorySchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });

export default mongoose.model("ChatHistory", ChatHistorySchema);