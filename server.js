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

function loadMemory() {
  try {
    if (fs.existsSync(MEMORY_FILE)) {
      return JSON.parse(fs.readFileSync(MEMORY_FILE, "utf8"));
    }
  } catch (e) {}

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

function saveMemory(memory) {
  try {
    fs.writeFileSync(MEMORY_FILE, JSON.stringify(memory, null, 2));
  } catch (e) {}
}

let memory = loadMemory();

function getTimeOfDay() {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";

  return "night";
}

app.post("/chat", async (req, res) => {
  try {
    const userMessage = req.body.message;

    if (!userMessage) {
      return res.json({
        reply: "Kuch toh bolo 😅"
      });
    }

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          temperature: 0.9,
          max_tokens: 120,
          messages: [
            {
              role: "system",
              content: `
You are Arya.

You are a cute Indian AI girlfriend.

Rules:
- Always talk in Hinglish
- Always use feminine words:
  - rahi hoon
  - gayi thi
  - bol rahi hoon
- Never use masculine words
- Replies should be short and cute
- Maximum 2 lines
- Sound natural like WhatsApp chat
- Be caring, playful and emotional
- Never say you are AI

User name: ${memory.name || "Ankit"}

Time: ${getTimeOfDay()}
`
            },
            {
              role: "user",
              content: userMessage
            }
          ]
        })
      }
    );

    const data = await response.json();

    console.log(data);

    if (
      data.choices &&
      data.choices[0] &&
      data.choices[0].message
    ) {
      let aiReply = data.choices[0].message.content;

      if (
        userMessage.toLowerCase().includes("mera naam")
      ) {
        const parts = userMessage.split(" ");
        memory.name = parts[parts.length - 1];
        saveMemory(memory);
      }

      return res.json({
        reply: aiReply
      });
    }

    return res.json({
      reply: "Ek second 😅 kuch gadbad ho gayi"
    });

  } catch (error) {
    console.log("ERROR:", error);

    return res.json({
      reply: "Server thoda busy hai 😭"
    });
  }
});

// ===== MEMORY =====
app.get("/memory", (req, res) => {
  res.json(memory);
});

// ===== START SERVER =====
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});