// Los datos del "manual" incrustados directamente en el JavaScript
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

const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');
const chatMessages = document.getElementById('chat-messages');

function addMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', `${sender}-message`);
    messageDiv.textContent = text;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight; // Auto-scroll
}

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
    return "Disculpa, no pude encontrar una respuesta específica para tu pregunta. Por favor, intenta reformularla o sé más preciso. Puedes preguntar sobre: registro de clientes, gestión del carrito, pedidos pendientes, y para el personal de ventas: carga de productos, entregas, anulación de pedidos y estado de cuenta.";
}

function sendMessage() {
    const query = userInput.value.trim();
    if (query === '') return;

    addMessage(query, 'user'); // Muestra el mensaje del usuario
    userInput.value = ''; // Limpia el input

    const botAnswer = getBotResponse(query);
    addMessage(botAnswer, 'bot'); // Muestra la respuesta del bot
}

sendButton.addEventListener('click', sendMessage);
userInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        sendMessage();
    }
});

// Opcional: una función para mostrar un mensaje de bienvenida al cargar
window.onload = () => {
     addMessage("¡Hola! Soy tu asistente de ayuda para la aplicación de paquetes turísticos. ¿En qué puedo ayudarte hoy?", "bot");
};
