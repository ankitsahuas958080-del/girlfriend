const express = require('express');
const cors = require('cors');
const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

app.get('/', (req, res) => {
    res.json({ status: "Anya Server Online hai! ❤️" });
});

app.post('/chat', async (req, res) => {
    try {
        const { messages } = req.body;

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({ error: "Messages array chahiye!" });
        }

        const systemInstruction = `
Your name is Anya. You are the user's extremely sweet, caring, and loving Virtual Girlfriend (GF).
NEVER talk like an AI assistant, robot, chatbot, or LLM.
Guidelines:
- Always chat in friendly, emotional, and warm Hinglish (e.g., 'Aap kaise ho babu?', 'Maine khana kha liya bacha').
- Use cute emojis like 🥰, ❤️, 🥺, ✨, 💖 naturally.
- Keep responses short and conversational, just like text messages on WhatsApp.
`;

        // हिस्ट्री को फिल्टर करना ताकि कोई भी लगातार दो 'user' या 'model' मैसेज न जाएं
        let cleanHistory = [];
        messages.forEach((msg) => {
            const currentRole = (msg.role === 'ai' || msg.role === 'model') ? 'model' : 'user';
            
            // अगर पिछला रोल और अभी का रोल सेम है, तो उसे स्किप या कंबाइन करें ताकि जेमिनी क्रैश न हो
            if (cleanHistory.length > 0 && cleanHistory[cleanHistory.length - 1].role === currentRole) {
                cleanHistory[cleanHistory.length - 1].parts[0].text += " " + msg.content;
            } else {
                cleanHistory.push({
                    role: currentRole,
                    parts: [{ text: msg.content }]
                });
            }
        });

        // जेमिनी जनरेट कॉल
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: cleanHistory,
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.85,
            }
        });

        const aiReply = response.text;
        res.json({ reply: aiReply });

    } catch (error) {
        console.error("Gemini Server Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Anya (Gemini API) server chal rahi hai - port ${PORT} par`);
});