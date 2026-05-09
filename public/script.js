const form = document.getElementById('chat-form');
const input = document.getElementById('user-input');
const chatBox = document.getElementById('chat-box');

const conversationHistory = [];

// Media upload elements
const uploadDocumentBtn = document.getElementById('upload-document');
const uploadImageBtn = document.getElementById('upload-image');
const uploadAudioBtn = document.getElementById('upload-audio');
const uploadVideoBtn = document.getElementById('upload-video');

const fileDocumentInput = document.getElementById('file-document');
const fileImageInput = document.getElementById('file-image');
const fileAudioInput = document.getElementById('file-audio');
const fileVideoInput = document.getElementById('file-video');

// Event listeners for media buttons
uploadDocumentBtn.addEventListener('click', () => fileDocumentInput.click());
uploadImageBtn.addEventListener('click', () => fileImageInput.click());
uploadAudioBtn.addEventListener('click', () => fileAudioInput.click());
uploadVideoBtn.addEventListener('click', () => fileVideoInput.click());

// Handle file selection
fileDocumentInput.addEventListener('change', (e) => handleFileUpload(e, 'Dokumen'));
fileImageInput.addEventListener('change', (e) => handleFileUpload(e, 'Gambar'));
fileAudioInput.addEventListener('change', (e) => handleFileUpload(e, 'Audio'));
fileVideoInput.addEventListener('change', (e) => handleFileUpload(e, 'Video'));

function handleFileUpload(event, type) {
  const file = event.target.files[0];
  if (file) {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = function(e) {
        const img = document.createElement('img');
        img.src = e.target.result;
        img.classList.add('media-preview');
        img.style.maxWidth = '200px';
        img.style.maxHeight = '200px';
        appendMessage('user', `📎 ${type}: ${file.name}`, img);
      };
      reader.readAsDataURL(file);
    } else if (file.type.startsWith('video/')) {
      const reader = new FileReader();
      reader.onload = function(e) {
        const video = document.createElement('video');
        video.src = e.target.result;
        video.classList.add('media-preview');
        video.controls = true;
        video.style.maxWidth = '200px';
        video.style.maxHeight = '200px';
        appendMessage('user', `📎 ${type}: ${file.name}`, video);
      };
      reader.readAsDataURL(file);
    } else {
      appendMessage('user', `📎 ${type}: ${file.name}`);
    }
    conversationHistory.push({ role: 'user', text: `Uploaded ${type}: ${file.name}`, file: file });
    // Here you can add logic to send the file to the backend if needed
  }
}

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

function appendMessage(sender, text, mediaElement = null) {
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
    if (mediaElement) {
      msg.appendChild(mediaElement);
    }
  }
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
  return msg; // Return the message element so it can be updated later
}
