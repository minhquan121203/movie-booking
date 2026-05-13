import mongoose from "mongoose";

const ChatHistorySchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null, // Anonymous user
        },
        sessionId: {
            type: String,
            required: true,
            index: true,
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
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
        indexes: [
            { sessionId: 1, lastActivity: -1 },
            { userId: 1, createdAt: -1 },
        ],
    }
);

// TTL Index: Xóa tự động sau 30 ngày
ChatHistorySchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });

export default mongoose.model("ChatHistory", ChatHistorySchema);