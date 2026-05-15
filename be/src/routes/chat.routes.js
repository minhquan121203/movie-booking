import express from "express";
import { handleChat } from "../controllers/chat.controller.js";
import chatService from "../services/chat.service.js";

const router = express.Router();

router.post("/", handleChat);

// Health endpoint for ChatService (shows key count, no secrets)
router.get("/health", (req, res) => {
  try {
	const keys = chatService.apiKeys || [];
	const masked = keys.map(k => {
	  if (!k) return null;
	  const start = k.slice(0, 4);
	  const end = k.slice(-4);
	  return `${start}...${end}`;
	});
	return res.json({ ok: true, keys: keys.length, sample: masked.slice(0, 5) });
  } catch (err) {
	return res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;