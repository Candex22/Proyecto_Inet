const helpData = [
    {
        "id": "registro_cliente",
        "keywords": ["registro", "alta", "crear cuenta", "nuevo cliente", "registrarse"],
        "question_phrases": ["¿Cómo me registro como nuevo cliente?", "Quiero crear una cuenta", "Alta de clientes", "¿cómo registrarme?"],
        "answer": "Para registrarte como nuevo cliente en TravelPortal, debes acceder a la opción 'Registro' y completar tus datos personales. El proceso es rápido y sencillo."
    },
    {
        "id": "seleccion_paquetes",
        "keywords": ["seleccionar paquetes", "paquetes", "viajes", "destinos", "reservar"],
        "question_phrases": ["¿Cómo selecciono paquetes turísticos?", "Quiero reservar un viaje", "¿cómo reservo un paquete?"],
        "answer": "Puedes explorar nuestros paquetes turísticos desde la página principal, seleccionar el que más te guste y seguir el proceso de reserva."
    },
    {
        "id": "ver_reservas",
        "keywords": ["reservas", "mis viajes", "consultar", "modificar reservas", "eliminar reservas"],
        "question_phrases": ["¿Dónde puedo ver mis reservas?", "¿Cómo modifico una reserva?", "¿puedo cancelar una reserva?"],
        "answer": "Puedes acceder a tus reservas desde tu perfil de usuario. Allí podrás ver, modificar o cancelar tus paquetes turísticos reservados."
    },
    {
        "id": "destinos_populares",
        "keywords": ["destinos populares", "lugares", "recomendaciones", "mejores destinos"],
        "question_phrases": ["¿Cuáles son los destinos más populares?", "¿Qué lugares recomiendan?"],
        "answer": "Ofrecemos una gran variedad de destinos nacionales e internacionales. Puedes ver los destinos más populares en nuestra sección principal."
    },
    {
        "id": "formas_pago",
        "keywords": ["pago", "formas de pago", "tarjeta", "efectivo", "financiación"],
        "question_phrases": ["¿Qué formas de pago aceptan?", "¿Puedo pagar en cuotas?"],
        "answer": "Aceptamos diversas formas de pago: tarjetas de crédito, débito, transferencias bancarias y opciones de financiación. Consulta las opciones disponibles al momento de la reserva."
    },
    {
        "id": "contacto",
        "keywords": ["contacto", "teléfono", "email", "consultas", "ayuda"],
        "question_phrases": ["¿Cómo puedo contactarlos?", "Necesito ayuda", "¿tienen teléfono de contacto?"],
        "answer": "Puedes contactarnos a través de este chat, por email o teléfono. También puedes visitar nuestra sección de 'Contacto' para más información."
    }
];

// Variables globales para los elementos del DOM
let chatToggle, chatWindow, chatClose, chatInput, sendBtn, chatMessages;

// Función para inicializar el bot cuando el DOM esté listo
function initializeBot() {
    // Obtener referencias a los elementos del DOM con los IDs correctos
    chatToggle = document.getElementById('chatToggle');
    chatWindow = document.getElementById('chatWindow');
    chatClose = document.getElementById('chatClose');
    chatInput = document.getElementById('chatInput');
    sendBtn = document.getElementById('sendBtn');
    chatMessages = document.getElementById('chatMessages');

    // Verificar que todos los elementos existan
    if (!chatToggle || !chatWindow || !chatClose || !chatInput || !sendBtn || !chatMessages) {
        console.error('Error: No se encontraron todos los elementos del chat');
        return;
    }

    // Event listeners para abrir/cerrar el chat
    chatToggle.addEventListener('click', toggleChat);
    chatClose.addEventListener('click', closeChat);

    // Event listeners para enviar mensajes
    sendBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', handleKeyPress);

    // Mensaje de bienvenida
    addMessage("¡Hola! Soy tu asistente de TravelPortal. ¿En qué puedo ayudarte hoy?", "bot");
}

// Función para alternar la visibilidad del chat
function toggleChat() {
    if (chatWindow.classList.contains('active')) {
        closeChat();
    } else {
        openChat();
    }
}

// Función para abrir el chat
function openChat() {
    chatWindow.classList.add('active');
    chatInput.focus();
}

// Función para cerrar el chat
function closeChat() {
    chatWindow.classList.remove('active');
}

// Función para manejar la tecla Enter
function handleKeyPress(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}

// Función para agregar mensajes al chat
function addMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', `${sender}-message`);
    messageDiv.textContent = text;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight; // Auto-scroll
}

// Función para obtener la respuesta del bot
function getBotResponse(userQuery) {
    const lowerCaseQuery = userQuery.toLowerCase();

    for (const topic of helpData) {
        // Prioriza la coincidencia de frases de pregunta completas
        for (const phrase of topic.question_phrases) {
            if (lowerCaseQuery.includes(phrase.toLowerCase())) {
                return topic.answer;
            }
        }
        // Luego revisa las palabras clave individuales
        for (const keyword of topic.keywords) {
            if (lowerCaseQuery.includes(keyword.toLowerCase())) {
                return topic.answer;
            }
        }
    }

    // Mensaje de respuesta por defecto si no se encuentra nada
    return "Disculpa, no pude encontrar una respuesta específica para tu pregunta. Por favor, intenta reformularla o sé más preciso. Puedes preguntar sobre: registro de clientes, selección de paquetes, reservas, destinos populares, formas de pago y contacto.";
}

// Función para enviar mensajes
function sendMessage() {
    const query = chatInput.value.trim();
    if (query === '') return;

    // Deshabilitar el botón mientras se procesa
    sendBtn.disabled = true;

    addMessage(query, 'user'); // Muestra el mensaje del usuario
    chatInput.value = ''; // Limpia el input

    // Simular un pequeño delay para que parezca más natural
    setTimeout(() => {
        const botAnswer = getBotResponse(query);
        addMessage(botAnswer, 'bot'); // Muestra la respuesta del bot
        sendBtn.disabled = false; // Rehabilitar el botón
        chatInput.focus(); // Volver a enfocar el input
    }, 500);
}

// Inicializar el bot cuando el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', initializeBot);

// También inicializar cuando la ventana se carga completamente (por si acaso)
window.addEventListener('load', () => {
    if (!chatMessages.hasChildNodes()) {
        initializeBot();
    }
});