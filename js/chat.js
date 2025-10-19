document.addEventListener('DOMContentLoaded', () => {
  const chatbotButton = document.querySelector('.chatbot-toggle');
  const chatbotWindow = document.querySelector('.chatbot-window');
  const closeChatbot = document.querySelector('.close-chatbot');
  const sendButton = document.getElementById('send-button');
  const userInput = document.getElementById('user-input');
  const chatBody = document.getElementById('chatbot-body');

  if (!chatbotButton || !chatbotWindow || !closeChatbot || !sendButton || !userInput || !chatBody) {
    return;
  }

  function scrollToBottom() {
    chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: 'smooth' });
  }

  function addMessage(message, sender) {
    const wrapper = document.createElement('div');
    wrapper.classList.add('message', `${sender}-message`);

    const iconContainer = document.createElement('div');
    iconContainer.classList.add('message-icon');
    const icon = document.createElement('i');
    icon.classList.add('fas', sender === 'user' ? 'fa-user' : 'fa-robot');
    iconContainer.appendChild(icon);

    const text = document.createElement('div');
    text.classList.add('message-content');
    text.textContent = message;

    wrapper.append(iconContainer, text);
    chatBody.appendChild(wrapper);
    scrollToBottom();
  }

  function simulateBotResponse(message) {
    const typing = document.createElement('div');
    typing.classList.add('message', 'bot-message', 'typing');
    typing.innerHTML = `
      <div class="message-icon"><i class="fas fa-robot"></i></div>
      <div class="message-content typing-animation"><span></span><span></span><span></span></div>`;
    chatBody.appendChild(typing);
    scrollToBottom();

    setTimeout(() => {
      typing.remove();
      const lowerMessage = message.toLowerCase();
      let response = 'El asistente se encuentra en mantenimiento. Por favor consulta los reportes para más detalle.';
      if (lowerMessage.includes('hola') || lowerMessage.includes('buenas')) {
        response = 'Hola, estoy aquí para ayudarte con tus dispositivos InfoIoT.';
      } else if (lowerMessage.includes('temperatura') || lowerMessage.includes('sensor')) {
        response = 'Puedes revisar el panel de control para ver lecturas en tiempo real.';
      }
      addMessage(response, 'bot');
    }, 1500);
  }

  function sendMessage() {
    const message = userInput.value.trim();
    if (!message) return;
    addMessage(message, 'user');
    userInput.value = '';
    simulateBotResponse(message);
  }

  function toggleChatbot() {
    chatbotWindow.classList.toggle('active');
    if (chatbotWindow.classList.contains('active')) {
      userInput.focus();
    }
  }

  chatbotButton.addEventListener('click', toggleChatbot);
  closeChatbot.addEventListener('click', toggleChatbot);
  sendButton.addEventListener('click', sendMessage);
  userInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      sendMessage();
    }
  });

  setTimeout(() => {
    addMessage('Hola, soy tu asistente InfoIoT. Déjame un mensaje y te contactaré pronto.', 'bot');
  }, 1000);
});
