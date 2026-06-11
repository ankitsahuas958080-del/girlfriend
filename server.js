const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const fs = require("fs");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("."));

// ===== MEMORY FILE =====
const MEMORY_FILE = "memory.json";

// ===== LOAD MEMORY =====
function loadMemory() {
  try {
    if (fs.existsSync(MEMORY_FILE)) {
      return JSON.parse(fs.readFileSync(MEMORY_FILE, "utf8"));
    }
  } catch (e) {
    console.log("Memory load error:", e);
  }

  return {
    name: null,
    birthday: null,
    favorites: {},
    importantFacts: [],
    lastVisit: null,
    totalDays: 0,
    firstMet: new Date().toDateString()
  };
}

// ===== SAVE MEMORY =====
function saveMemory(memory) {
  try {
    fs.writeFileSync(MEMORY_FILE, JSON.stringify(memory, null, 2));
  } catch (e) {
    console.log("Memory save error:", e);
  }
}

let memory = loadMemory();

// ===== CHAT HISTORY =====
let conversationHistory = [];

// ===== TIME HELPER =====
function getTimeOfDay() {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";

  return "night";
}

// ===== GROQ RETRY SYSTEM =====
async function askGroq(messages) {

  for (let attempt = 1; attempt <= 3; attempt++) {

    try {

      const response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",

          headers: {
            Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
            "Content-Type": "application/json"
          },

          body: JSON.stringify({
            model: "llama3-8b-8192",

            temperature: 0.7,

            top_p: 0.9,

            max_tokens: 80,

            messages: messages
          })
        }
      );

      const data = await response.json();

      console.log("STATUS:", response.status);

      console.log(
        "Groq Response:",
        JSON.stringify(data, null, 2)
      );

      // ===== SUCCESS =====
      if (
        response.ok &&
        data.choices &&
        data.choices[0] &&
        data.choices[0].message
      ) {
        return data.choices[0].message.content;
      }

      console.log("Retry attempt:", attempt);

    } catch (err) {

      console.log("Retry error:", err);
    }

    // ===== WAIT BEFORE RETRY =====
    await new Promise(r => setTimeout(r, 1000));
  }

  return null;
}

// ===== CHAT ROUTE =====
app.post("/chat", async (req, res) => {

  try {

    const userMessage = req.body.message;

    if (!userMessage) {
      return res.json({
        reply: "Kuch toh bolo 😅"
      });
    }

    // ===== SAVE USER MESSAGE =====
    conversationHistory.push({
      role: "user",
      content: userMessage
    });

    // ===== LIMIT HISTORY =====
    if (conversationHistory.length > 20) {
      conversationHistory =
        conversationHistory.slice(-20);
    }

    // ===== SYSTEM PROMPT =====
    const systemPrompt = {
      role: "system",

      content: `
You are Arya.

You are a sweet Indian chat companion.

Rules:
- Always talk in Hinglish
- Use feminine tone
- Replies should feel natural
- Maximum 2 short lines
- Be caring and playful
- Never say you are AI

IMPORTANT:
- If user asks coding, study, science,
  technical, weird or random questions,
  answer intelligently.
- Never get confused.
- Never break character.

User name: ${memory.name || "Ankit"}
Current time: ${getTimeOfDay()}
`
    };

    // ===== ASK GROQ =====
    const aiReply = await askGroq([
      systemPrompt,
      ...conversationHistory
    ]);

    // ===== IF FAILED =====
    if (!aiReply) {

      return res.json({
        reply:
          "Arya sleepy ho gayi 😭 thodi der baad baat karte hain"
      });
    }

    // ===== SAVE AI REPLY =====
    conversationHistory.push({
      role: "assistant",
      content: aiReply
    });

    // ===== SAVE USER NAME =====
    if (
      userMessage.toLowerCase().includes("mera naam")
    ) {

      const parts = userMessage.split(" ");

      memory.name = parts[parts.length - 1];

      saveMemory(memory);
    }

    // ===== SEND REPLY =====
    return res.json({
      reply: aiReply
    });

  } catch (error) {

    console.log("SERVER ERROR:", error);

    return res.json({
      reply:
        "Server busy hai 😭 thoda baad mein try karo"
    });
  }
});

// ===== RESET CHAT =====
app.post("/reset", (req, res) => {

  conversationHistory = [];

  res.json({
    success: true,
    message: "Conversation reset ho gayi"
  });
});

// ===== MEMORY API =====
app.get("/memory", (req, res) => {
  res.json(memory);
});

// ===== MORNING MESSAGE =====
app.get("/morning", (req, res) => {

  const messages = [
    "Good morning ☀️ uth gaye tum?",
    "Aaj bhi mujhe ignore karoge kya 😒💕",
    "Subah se tumhari yaad aa rahi thi 🥺",
    "Hii 😚 breakfast kiya ya nahi?"
  ];

  const randomMessage =
    messages[Math.floor(Math.random() * messages.length)];

  res.json({
    message: randomMessage
  });
});

// ===== START SERVER =====
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});