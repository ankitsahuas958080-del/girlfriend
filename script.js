// ===== HELPER: Current Time =====
function getTime() {
  const now = new Date();
  let h = now.getHours();
  let m = now.getMinutes();
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  m = m < 10 ? "0" + m : m;
  return `${h}:${m} ${ampm}`;
}

// ===== Set Welcome Message Time =====
document.getElementById("welcomeTime").textContent = getTime();

// ===== Add Message to Chat =====
function addMessage(text, sender) {
  const chatBox = document.getElementById("chatBox");

  const msgDiv = document.createElement("div");
  msgDiv.classList.add("message", sender);

  const bubble = document.createElement("div");
  bubble.classList.add("bubble");
  bubble.textContent = text;

  const time = document.createElement("span");
  time.classList.add("time");
  time.textContent = getTime();

  msgDiv.appendChild(bubble);
  msgDiv.appendChild(time);
  chatBox.appendChild(msgDiv);

  chatBox.scrollTop = chatBox.scrollHeight;
}

// ===== Show/Hide Typing Indicator =====
function showTyping() {
  const indicator = document.getElementById("typingIndicator");
  indicator.style.display = "flex";
  const chatBox = document.getElementById("chatBox");
  chatBox.scrollTop = chatBox.scrollHeight;
}

function hideTyping() {
  document.getElementById("typingIndicator").style.display = "none";
}

// ===== Good Morning / First Visit Greeting =====
async function loadMorningGreeting() {
  try {
    const lastVisit = localStorage.getItem("arya_last_visit");
    const today = new Date().toDateString();

    if (lastVisit !== today) {
      // New day — fetch morning message
      await new Promise(r => setTimeout(r, 1200));
      showTyping();
      await new Promise(r => setTimeout(r, 1800));

      const res = await fetch("/morning");
      const data = await res.json();
      hideTyping();
      addMessage(data.message, "ai");

      localStorage.setItem("arya_last_visit", today);
    }
  } catch (e) {
    // silently fail
  }
}

// ===== Load Memory Badge =====
async function loadMemoryBadge() {
  try {
    const res = await fetch("/memory");
    const memory = await res.json();

    if (memory.name) {
      const statusEl = document.getElementById("aryaStatus");
      if (statusEl) {
        statusEl.textContent = `online • ${memory.name} ke liye yahan hoon 💕`;
      }
    }
  } catch (e) {}
}

// ===== Send Message =====
async function sendMessage() {
  const input = document.getElementById("userInput");
  const sendBtn = document.getElementById("sendBtn");
  const message = input.value.trim();

  if (!message) return;

  addMessage(message, "user");
  input.value = "";
  input.focus();

  sendBtn.disabled = true;
  sendBtn.style.opacity = "0.6";

  showTyping();

  // Realistic typing delay (1-2.5 seconds)
  const delay = 1000 + Math.random() * 1500;
  await new Promise(r => setTimeout(r, delay));

  try {
    const response = await fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message })
    });

    const data = await response.json();
    hideTyping();
    addMessage(data.reply, "ai");

    // Refresh memory badge after reply
    loadMemoryBadge();

  } catch (error) {
    hideTyping();
    addMessage("Arey kuch gadbad ho gayi 😵 thoda baad mein try karo", "ai");
    console.error("Error:", error);
  }

  sendBtn.disabled = false;
  sendBtn.style.opacity = "1";
}

// ===== Send on Enter Key =====
document.getElementById("userInput").addEventListener("keydown", function (e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});


// ===== On Page Load =====
window.addEventListener("load", async () => {
  await loadMemoryBadge();
  await loadMorningGreeting();
});
