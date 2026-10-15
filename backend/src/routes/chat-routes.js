import { Router } from "express";

import { asyncHandler } from "../middleware/async-handler.js";
import { generateChatReply } from "../services/chat-service.js";
import { chatRequestSchema } from "../validators.js";

export const chatRouter = Router();

chatRouter.post(
  "/chat",
  asyncHandler(async (req, res) => {
    const { messages } = chatRequestSchema.parse(req.body);
    const reply = await generateChatReply(messages);
    res.json({ data: { reply } });
  }),
);
