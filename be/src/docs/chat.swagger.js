/**
 * @swagger
 * /chat:
 *   post:
 *     summary: Chat với trợ lý ảo AI (Gemini)
 *     tags: [AI Chat]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userMessage:
 *                 type: string
 *                 example: "Nay có phim nào hay không fen?"
 *     responses:
 *       200:
 *         description: Trả lời từ AI
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 botMessage:
 *                   type: string
 */