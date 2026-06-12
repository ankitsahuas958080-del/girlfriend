let chatHistory = [];

function appendMessage(text, sender) {
    const chatBox = document.getElementById("chatBox");
    const wrapper = document.createElement("div");
    wrapper.classList.add("message-wrapper");
    if (sender === "user") {
        wrapper.classList.add("user");
    } else {
        wrapper.classList.add("ai");
    }
    
    const bubble = document.createElement("div");
    bubble.classList.add("message-bubble");
    bubble.innerText = text;
    
    const timeDiv = document.createElement("div");
    timeDiv.classList.add("message-time");
    const now = new Date();
    timeDiv.innerText = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    wrapper.appendChild(bubble);
    wrapper.appendChild(timeDiv);
    chatBox.appendChild(wrapper);
    chatBox.scrollTop = chatBox.scrollHeight;
}

async function sendMessage() {
    const inputField = document.getElementById("userInput");
    const messageText = inputField.value.trim();
    const typingStatus = document.getElementById("typingStatus");
    
    if (messageText === "") return;
    
    appendMessage(messageText, "user");
    inputField.value = ""; 
    
    // यूजर का मैसेज हिस्ट्री में पुश करें
    chatHistory.push({ role: "user", content: messageText });
    
    try {
        typingStatus.innerText = "Anya is typing...";
        typingStatus.style.color = "#ff4b72";
        
        const response = await fetch("http://localhost:3000/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ messages: chatHistory })
        });
        
        const data = await response.json();
        
        typingStatus.innerText = "Online";
        typingStatus.style.color = "#a1a1aa";
        
        if (data.reply) {
            appendMessage(data.reply, "ai");
            // अन्या के जवाब को 'model' रोल के साथ हिस्ट्री में रखें
            chatHistory.push({ role: "model", content: data.reply });
        } else {
            appendMessage("Aapki baat samajh nahi aayi, ek baar firse bolo na babu? 🥺", "ai");
        }
        
    } catch (error) {
        console.error("Connection Error:", error);
        typingStatus.innerText = "Online";
        appendMessage("Anya abhi thoda busy lag rahi hai, please thodi der baad try karo na... 💔", "ai");
    }
}

function handleKeyPress(event) {
    if (event.key === "Enter") {
        sendMessage();
    }
}

function triggerQuickMessage(text) {
    document.getElementById("userInput").value = text;
    sendMessage();
}

function clearChat() {
    if(confirm("Kya aap saari chat clear karna chahte hain?")) {
        const chatBox = document.getElementById("chatBox");
        chatBox.innerHTML = "";
        chatHistory = []; 
        appendMessage("Saari purani baatein bhool kar ek nayi shuruaat karein? 🥰", "ai");
    }
}