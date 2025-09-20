document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
    const chatbotButton = document.querySelector('.chatbot-toggle');
    const chatbotWindow = document.querySelector('.chatbot-window');
    const closeChatbot = document.querySelector('.close-chatbot');
    const sendButton = document.getElementById('send-button');
    const userInput = document.getElementById('user-input');
    const chatBody = document.getElementById('chatbot-body');
    
    // 1. Mostrar/Ocultar la ventana del chatbot
    function toggleChatbot() {
        chatbotWindow.classList.toggle('active');
        
        if (chatbotWindow.classList.contains('active')) {
            userInput.focus(); // Enfocar el input al abrir
        }
    }
    
    // Event listeners para abrir/cerrar
    chatbotButton.addEventListener('click', toggleChatbot);
    closeChatbot.addEventListener('click', toggleChatbot);
    
    // 2. Función para enviar mensajes
    async function sendMessage() {
        const message = userInput.value.trim();
        if (message === '') return;
        
        // Añadir mensaje del usuario
        addMessageToChat(message, 'user');
        userInput.value = '';
        
        // Simular respuesta mientras el chatbot no está activo
        simulateBotResponse(message);
        
        scrollToBottom();
    }
    
    // Enviar mensaje al hacer clic o presionar Enter
    sendButton.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
    // 3. Función mejorada para añadir mensajes con iconos
    function addMessageToChat(message, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', `${sender}-message`);
        
        // Contenedor del icono
        const iconContainer = document.createElement('div');
        iconContainer.classList.add('message-icon');
        
        // Icono según el remitente
        const icon = document.createElement('i');
        icon.classList.add('fas', 
            sender === 'user' ? 'fa-user' : 'fa-robot'
        );
        
        iconContainer.appendChild(icon);
        
        // Contenido del mensaje
        const text = document.createElement('div');
        text.classList.add('message-content');
        text.textContent = message;
        
        messageDiv.appendChild(iconContainer);
        messageDiv.appendChild(text);
        
        chatBody.appendChild(messageDiv);
        scrollToBottom();
    }
    
    // 4. Simular respuesta del bot (mientras no está activo)
    function simulateBotResponse(userMessage) {
        // Mostrar estado "escribiendo"
        const typingIndicator = document.createElement('div');
        typingIndicator.classList.add('message', 'bot-message', 'typing');
        typingIndicator.innerHTML = `
            <div class="message-icon">
                <i class="fas fa-robot"></i>
            </div>
            <div class="message-content typing-animation">
                <span></span><span></span><span></span>
            </div>
        `;
        chatBody.appendChild(typingIndicator);
        scrollToBottom();
        
        // Respuesta después de un retraso
        setTimeout(() => {
            chatBody.removeChild(typingIndicator);
            
            const lowerMessage = userMessage.toLowerCase();
            let response;
            
            if (lowerMessage.includes('hola') || lowerMessage.includes('hi')) {
                response = '¡Hola! Soy tu asistente IoT. Actualmente estoy en mantenimiento, pero pronto estaré disponible para ayudarte.';
            } else if (lowerMessage.includes('temperatura') || lowerMessage.includes('humedad')) {
                response = 'Puedes consultar los datos de los sensores en las secciones de Control o Tablero.';
            } else {
                response = 'El servicio de chatbot está temporalmente desactivado para mantenimiento. Por favor consulta los reportes o tableros para obtener información.';
            }
            
            addMessageToChat(response, 'bot');
        }, 1500);
    }
    
    // 5. Función para auto-scroll
    function scrollToBottom() {
        chatBody.scrollTo({
            top: chatBody.scrollHeight,
            behavior: 'smooth'
        });
    }
    
    // Mensaje inicial del bot
    setTimeout(() => {
        addMessageToChat('¡Hola! Soy tu asistente IoT. Actualmente estoy en mantenimiento, pero puedes dejar tus mensajes y los revisaré pronto.', 'bot');
    }, 1000);
});