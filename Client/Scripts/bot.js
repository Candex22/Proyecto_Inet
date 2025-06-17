const helpData = [
  {
    "id": "registro_cliente",
    "keywords": ["registro", "alta", "crear cuenta", "nuevo cliente", "registrarse", "crear usuario", "nueva cuenta"],
    "question_phrases": ["¿Cómo me registro como nuevo cliente?", "Quiero crear una cuenta", "Alta de clientes", "¿cómo registrarme?", "¿cómo creo un usuario?", "¿puedo registrarme?"],
    "answer": "Para registrarte como nuevo cliente en TravelPortal, debes acceder a la opción 'Registrarse' y completar tus datos personales. Luego podrás iniciar sesión y comenzar a reservar tus viajes."
  },
  {
    "id": "iniciar_sesion",
    "keywords": ["iniciar sesión", "login", "acceder", "entrar", "cuenta"],
    "question_phrases": ["¿Cómo inicio sesión?", "¿Dónde ingreso a mi cuenta?", "No puedo acceder a mi cuenta", "¿cómo entrar a mi perfil?"],
    "answer": "Puedes iniciar sesión desde la página de 'Iniciar sesión', ingresando tu nombre de usuario y contraseña. Si aún no tienes cuenta, selecciona '¿No tienes cuenta todavía?' para registrarte."
  },
  {
    "id": "seleccion_paquetes",
    "keywords": ["seleccionar paquetes", "paquetes", "viajes", "destinos", "reservar", "buscar", "filtrar", "ver"],
    "question_phrases": ["¿Cómo selecciono paquetes turísticos?", "Quiero reservar un viaje", "¿cómo reservo un paquete?", "¿cómo veo los destinos?", "¿cómo uso los filtros?", "¿cómo buscar un viaje?"],
    "answer": "Desde la sección de 'Paquetes', puedes explorar todos los destinos disponibles, aplicar filtros por categoría o precio, y acceder a los detalles de cada paquete para reservar el que más te guste."
  },
  {
    "id": "detalle_paquete",
    "keywords": ["detalles", "información", "vuelos", "hotel", "reseñas", "opiniones", "paquete"],
    "question_phrases": ["¿Qué incluye un paquete?", "¿Dónde veo los detalles del viaje?", "¿tiene opiniones?", "¿cómo son los hoteles?", "¿cómo son los vuelos incluidos?"],
    "answer": "Cada paquete turístico incluye información detallada sobre vuelos, alojamiento, duración, precio por persona y opiniones de otros usuarios. Haz clic en 'Ver Detalles' para acceder a toda esta información."
  },
  {
    "id": "carrito",
    "keywords": ["carrito", "compras", "eliminar", "cantidad", "resumen", "ver carrito"],
    "question_phrases": ["¿Cómo veo mi carrito?", "¿Cómo modifico la cantidad?", "¿Puedo eliminar un paquete del carrito?", "¿Cómo veo el resumen de compra?"],
    "answer": "Desde la sección 'Carrito', puedes ver todos los paquetes agregados, modificar la cantidad de personas, eliminar paquetes y ver el resumen del total con impuestos incluidos."
  },
  {
    "id": "procesar_pago",
    "keywords": ["pago", "facturación", "confirmar", "pagar", "datos de pago", "finalizar compra"],
    "question_phrases": ["¿Cómo confirmo el pago?", "¿Qué datos se requieren para pagar?", "¿Dónde ingreso mi DNI?", "¿Es seguro el pago?", "¿cómo finalizo la compra?"],
    "answer": "En la sección de 'Pago', debes ingresar tus datos de facturación y confirmar la compra. El proceso es seguro y recibirás la factura por correo electrónico."
  },
  {
    "id": "confirmacion_pago",
    "keywords": ["confirmación", "pago exitoso", "factura", "pedido procesado", "compra", "correo"],
    "question_phrases": ["¿Cómo sé que se procesó mi compra?", "¿Dónde está mi factura?", "¿me envían el comprobante?", "¿ya se pagó el paquete?"],
    "answer": "Luego de confirmar tu pago, verás una pantalla de éxito con los detalles de tu pedido. También recibirás la factura por correo electrónico registrado."
  },
  {
    "id": "reseñas_opiniones",
    "keywords": ["reseñas", "opiniones", "comentarios", "puntajes", "calificaciones"],
    "question_phrases": ["¿Dónde veo las opiniones de otros usuarios?", "¿Puedo dejar una reseña?", "¿Cómo se califica un paquete?", "¿Hay comentarios de otros viajeros?"],
    "answer": "Cada paquete incluye una sección con opiniones y puntuaciones de otros usuarios. También podés dejar tu propia reseña luego de viajar."
  },
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
    if (!chatMessages || !chatMessages.hasChildNodes()) {
        initializeBot();
    }
});