// Los datos del "manual" incrustados directamente en el JavaScript
const helpData = [
    {
        "id": "registro_cliente",
        "keywords": ["registro", "alta", "crear cuenta", "nuevo cliente", "registrarse"],
        "question_phrases": ["¿Cómo me registro como nuevo cliente?", "Quiero crear una cuenta", "Alta de clientes", "¿cómo registrarme?"],
        "answer": "Para registrarte como nuevo cliente, debes acceder a la opción 'Alta de nuevos clientes' en la aplicación y seguir los pasos indicados."
    },
    {
        "id": "seleccion_productos",
        "keywords": ["seleccionar productos", "carrito", "agregar", "comprar", "armar carrito"],
        "question_phrases": ["¿Cómo selecciono productos para el carrito de compras?", "Quiero agregar algo al carrito", "cómo armo mi carrito?"],
        "answer": "Los clientes pueden seleccionar productos de la lista para armar su carrito de compra."
    },
    {
        "id": "ver_pedidos_pendientes",
        "keywords": ["pedidos pendientes", "ver estado", "consultar", "modificar pedidos", "eliminar pedidos", "mis pedidos"],
        "question_phrases": ["¿Dónde puedo ver mis pedidos pendientes?", "Cómo modifico un pedido?", "¿puedo eliminar un pedido?"],
        "answer": "Una vez finalizada la compra, el cliente debe poder acceder a los pedidos pendientes, modificarlos y/o eliminarlos."
    },
    {
        "id": "carga_productos_ventas",
        "keywords": ["cargar productos", "jefe de ventas", "ingresar producto", "alta producto", "añadir producto"],
        "question_phrases": ["¿Cómo carga productos el jefe de ventas?", "Necesito ingresar un nuevo producto", "cómo añadir un producto?"],
        "answer": "El jefe de ventas o personal de ventas puede cargar productos, incluyendo el código de producto, descripción y precio unitario."
    },
    {
        "id": "entregar_pedidos_ventas",
        "keywords": ["entregar pedidos", "jefe de ventas", "realizar entrega"],
        "question_phrases": ["¿Cómo realizo la entrega de un pedido?", "Entregas de pedidos", "cómo entregar un pedido?"],
        "answer": "El jefe de ventas o personal de ventas puede realizar la entrega de pedidos."
    },
    {
        "id": "anular_pedido_ventas",
        "keywords": ["anular pedido", "cancelar pedido", "jefe de ventas", "borrar pedido"],
        "question_phrases": ["¿Cómo anulo un pedido?", "Cancelar un pedido", "cómo cancelar una orden?"],
        "answer": "El jefe de ventas o personal de ventas puede anular un pedido."
    },
    {
        "id": "consultar_productos",
        "keywords": ["consultar productos", "ver lista productos", "catalogo", "lista de productos"],
        "question_phrases": ["¿Cómo puedo consultar la lista de productos?", "Dónde veo los productos disponibles?"],
        "answer": "Puedes consultar la lista de productos disponibles en la sección 'Catálogo' o 'Productos'."
    },
    {
        "id": "validar_ingreso_cliente_server",
        "keywords": ["validar ingreso", "autenticar cliente", "capa servidor login", "validación de usuario"],
        "question_phrases": ["¿Cómo valida el sistema el ingreso de un cliente?", "Qué hace el servidor con mi login?"],
        "answer": "En la capa del servidor se valida el ingreso del cliente, ya sea mediante módulos genéricos de terceros o una implementación propia."
    },
    {
        "id": "armar_tabla_compra_server",
        "keywords": ["tabla compra", "pedido", "numero de pedido", "articulo pedido", "registro compra"],
        "question_phrases": ["¿Cómo se arma la tabla de compra en el servidor?", "¿Qué es el número de pedido?", "¿cómo se registra la compra?"],
        "answer": "En la capa del servidor se arma una tabla con la compra. Cada pedido debe tener un número de pedido, el cual se incluye en todos los artículos a adquirir."
    },
    {
        "id": "relacion_pedido_cliente_server",
        "keywords": ["relacionar pedido cliente", "asociar compra cliente"],
        "question_phrases": ["¿Cómo se relaciona un pedido con un cliente en el sistema?"],
        "answer": "La capa del servidor se encarga de relacionar el/los pedido/s con el cliente."
    },
    {
        "id": "eliminar_pedidos_pendientes_server",
        "keywords": ["eliminar pendientes", "pedidos entregados", "historial pedidos", "mover pedidos"],
        "question_phrases": ["¿Qué pasa con los pedidos pendientes una vez entregados?", "¿a dónde van los pedidos finalizados?"],
        "answer": "Una vez entregados, los pedidos se eliminan de la tabla de pendientes y se pasan a una tabla 'histórica' de pedidos entregados en la capa del servidor."
    },
    {
        "id": "cobrar_server",
        "keywords": ["cobrar", "total a cobrar", "medios de pago", "procesar pago"],
        "question_phrases": ["¿Cómo se calcula y realiza el cobro?", "qué métodos de pago hay?"],
        "answer": "La capa del servidor calcula el total a cobrar y realiza el cobro mediante herramientas de terceros."
    },
    {
        "id": "registrar_ventas_server",
        "keywords": ["registrar ventas", "tabla ventas", "informacion ventas", "historial de ventas"],
        "question_phrases": ["¿Dónde se registra la información de las ventas?", "¿cómo se guarda el historial de ventas?"],
        "answer": "Toda la información de las ventas se registra en una tabla de ventas en la capa del servidor."
    },
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
