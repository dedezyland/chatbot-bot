const form = document.getElementById('chat-form');
const input = document.getElementById('user-input');
const chatBox = document.getElementById('chat-box');

const conversationHistory = [];

form.addEventListener('submit', async function (e) {
  e.preventDefault();

  const userMessage = input.value.trim();
  if (!userMessage) return;

  // Add user's message to the chat box and conversation history
  appendMessage('user', userMessage);
  conversationHistory.push({ role: 'user', text: userMessage });
  input.value = '';

  // Show a temporary "Thinking..." bot message
  const thinkingMessageElement = appendMessage('bot', 'Gemini is thinking...');

  try {
    // Send the conversation history to the backend
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ conversation: conversationHistory }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to get response from server.');
    }

    const data = await response.json();
    const botResponseText = data.result;

    // Replace the "Thinking..." message with the actual AI's reply
    clearInterval(thinkingMessageElement.interval);
    thinkingMessageElement.innerHTML = formatBotResponse(botResponseText);
    conversationHistory.push({ role: 'model', text: botResponseText });

  } catch (error) {
    console.error('Error:', error);
    // If an error occurs, update the "Thinking..." message with an error
    clearInterval(thinkingMessageElement.interval);
    thinkingMessageElement.textContent = `Error: ${error.message || 'Failed to get response from server.'}`;
  }
});

function formatBotResponse(text) {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  return escaped
    .split(/\r?\n+/)
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => `<p>${line}</p>`)
    .join('');
}

function appendMessage(sender, text) {
  const msg = document.createElement('div');
  msg.classList.add('message', sender);
  if (sender === 'bot' && text === 'Gemini is thinking...') {
    msg.textContent = 'Gemini is thinking';
    const dotsSpan = document.createElement('span');
    dotsSpan.textContent = '...';
    msg.appendChild(dotsSpan);
    let dots = 3;
    const interval = setInterval(() => {
      dots = dots % 3 + 1;
      dotsSpan.textContent = '.'.repeat(dots);
    }, 500);
    msg.interval = interval;
  } else if (sender === 'bot') {
    msg.innerHTML = formatBotResponse(text);
  } else {
    msg.textContent = text;
  }
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
  return msg; // Return the message element so it can be updated later
}
