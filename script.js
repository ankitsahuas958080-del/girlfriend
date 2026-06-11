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

// ===== Prevent Duplicate Sending =====
let isSending = false;

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

// ===== Show Typing =====
function showTyping() {
  const indicator = document.getElementById("typingIndicator");

  indicator.style.display = "flex";

  const chatBox = document.getElementById("chatBox");
  chatBox.scrollTop = chatBox.scrollHeight;
}

// ===== Hide Typing =====
function hideTyping() {
  document.getElementById("typingIndicator").style.display = "none";
}

// ===== Good Morning Greeting =====
async function loadMorningGreeting() {
  try {
    const lastVisit = localStorage.getItem("arya_last_visit");
    const today = new Date().toDateString();

    if (lastVisit !== today) {

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
    console.log(e);
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
        statusEl.textContent =
          `online • ${memory.name} ke liye yahan hoon 💕`;
      }
    }

  } catch (e) {
    console.log(e);
  }
}

// ===== Send Message =====
async function sendMessage() {

  // Duplicate message stop
  if (isSending) return;

  const input = document.getElementById("userInput");
  const sendBtn = document.getElementById("sendBtn");

  const message = input.value.trim();

  if (!message) return;

  isSending = true;

  // User message show
  addMessage(message, "user");

  input.value = "";
  input.focus();

  // Disable button
  sendBtn.disabled = true;
  sendBtn.style.opacity = "0.6";

  // Show typing
  showTyping();

  // Fake typing delay
  const delay = 1000 + Math.random() * 1500;

  await new Promise(r => setTimeout(r, delay));

  try {

    const response = await fetch("/chat", {
      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        message: message
      })
    });

    const data = await response.json();

    hideTyping();

    // AI reply
    addMessage(data.reply, "ai");

    // Update memory badge
    loadMemoryBadge();

  } catch (error) {

    hideTyping();

    addMessage(
      "Arey 😵 kuch gadbad ho gayi, thoda baad mein try karo",
      "ai"
    );

    console.error("Error:", error);
  }

  // Enable button again
  sendBtn.disabled = false;
  sendBtn.style.opacity = "1";

  isSending = false;
}

// ===== Send Button Click =====
document
  .getElementById("sendBtn")
  .addEventListener("click", sendMessage);

// ===== Enter Key Send =====
document
  .getElementById("userInput")
  .addEventListener("keydown", function (e) {

    if (e.key === "Enter" && !e.shiftKey) {

      e.preventDefault();

      sendMessage();
    }
  });

// ===== Page Load =====
window.addEventListener("load", async () => {

  await loadMemoryBadge();

  await loadMorningGreeting();
});