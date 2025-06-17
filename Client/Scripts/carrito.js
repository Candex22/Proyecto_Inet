// Función para actualizar la cantidad de un item en el carrito
async function updateCartItemQuantity(id_detalle, cambio) {
    try {
        const quantityElement = document.querySelector(`[data-item-id="${id_detalle}"] .quantity-value`);
        if (!quantityElement) {
            console.error('Elemento de cantidad no encontrado');
            return;
        }

        const cantidadActual = parseInt(quantityElement.textContent);
        const nuevaCantidad = cantidadActual + cambio;

        if (nuevaCantidad < 1) {
            mostrarMensaje('La cantidad mínima es 1', 'warning');
            return;
        }

        // Mostrar loading
        mostrarMensaje('Actualizando cantidad...', 'info');

        const response = await fetch('/api/actualizar_cantidad_carrito', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                id_detalle: id_detalle,
                nueva_cantidad: nuevaCantidad
            }),
        });

        const result = await response.json();

        if (response.ok) {
            // Actualizar la cantidad en la interfaz
            quantityElement.textContent = nuevaCantidad;
            
            // Actualizar el precio del item
            const itemElement = document.querySelector(`[data-item-id="${id_detalle}"]`);
            const precioUnitario = parseFloat(itemElement.dataset.precioUnitario);
            const precioElement = itemElement.querySelector('.item-price');
            precioElement.textContent = `$${(nuevaCantidad * precioUnitario).toFixed(2)}`;

            // Recalcular total del carrito
            recalcularTotalCarrito();

            mostrarMensaje(result.message || 'Cantidad actualizada', 'success');
        } else {
            mostrarMensaje(result.error || 'Error al actualizar cantidad', 'error');
        }

    } catch (error) {
        console.error('Error al actualizar cantidad:', error);
        mostrarMensaje('Error inesperado al actualizar cantidad', 'error');
    }
}

// Función para eliminar un item del carrito
async function removeCartItem(id_detalle) {
    try {
        const confirmacion = confirm('¿Estás seguro de que quieres eliminar este item del carrito?');
        if (!confirmacion) return;

        // Mostrar loading
        mostrarMensaje('Eliminando item...', 'info');

        const response = await fetch(`/api/eliminar_item_carrito/${id_detalle}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        const result = await response.json();

        if (response.ok) {
            // Eliminar el elemento de la interfaz
            const itemElement = document.querySelector(`[data-item-id="${id_detalle}"]`);
            if (itemElement) {
                itemElement.remove();
            }

            // Recalcular total del carrito
            recalcularTotalCarrito();

            // Verificar si el carrito está vacío
            const remainingItems = document.querySelectorAll('.cart-item');
            if (remainingItems.length === 0) {
                // Mostrar mensaje de carrito vacío
                const cartContainer = document.querySelector('.cart-items');
                cartContainer.innerHTML = `
                    <div class="empty-cart-message">
                        <p>Tu carrito está vacío. ¡Explora nuestros paquetes y agrega algo increíble!</p>
                        <a href="/paquetes" class="checkout-button" style="text-decoration: none;">Ver Paquetes</a>
                    </div>
                `;
                
                // Ocultar resumen del carrito
                const cartSummary = document.querySelector('.cart-summary');
                if (cartSummary) {
                    cartSummary.style.display = 'none';
                }
            }

            mostrarMensaje(result.message || 'Item eliminado del carrito', 'success');
        } else {
            mostrarMensaje(result.error || 'Error al eliminar item', 'error');
        }

    } catch (error) {
        console.error('Error al eliminar item:', error);
        mostrarMensaje('Error inesperado al eliminar item', 'error');
    }
}

// Función para recalcular el total del carrito
function recalcularTotalCarrito() {
    const itemElements = document.querySelectorAll('.cart-item');
    let total = 0;

    itemElements.forEach(item => {
        const cantidad = parseInt(item.querySelector('.quantity-value').textContent);
        const precioUnitario = parseFloat(item.dataset.precioUnitario);
        total += cantidad * precioUnitario;
    });

    // Actualizar el total en la interfaz
    const totalElements = document.querySelectorAll('.cart-summary .summary-row span:last-child');
    totalElements.forEach(element => {
        element.textContent = `$${total.toFixed(2)}`;
    });
}

// Función existente para agregar producto (ya estaba en tu código)
async function agregarProducto() {
    console.log('🛒 Iniciando proceso de agregar producto...');
    
    try {
        const paqueteDataElement = document.getElementById('data_paquete');
        if (!paqueteDataElement) {
            console.error('❌ Elemento #data_paquete no encontrado');
            mostrarMensaje('Error: No se pudo obtener la información del paquete.', 'error');
            return;
        }

        let paquete;
        try {
            paquete = JSON.parse(paqueteDataElement.textContent);
            console.log('📦 Datos del paquete obtenidos:', paquete);
        } catch (parseError) {
            console.error('❌ Error al parsear datos del paquete:', parseError);
            mostrarMensaje('Error: Datos del paquete malformados.', 'error');
            return;
        }

        const personasDisplay = document.getElementById('personas-display');
        if (!personasDisplay) {
            console.error('❌ Elemento #personas-display no encontrado');
            mostrarMensaje('Error: No se pudo obtener la cantidad de personas.', 'error');
            return;
        }
        
        const cantidadPersonas = parseInt(personasDisplay.textContent.trim());
        console.log('👥 Cantidad de personas:', cantidadPersonas);

        if (!paquete || !paquete.id_paquete || isNaN(cantidadPersonas) || cantidadPersonas < 1) {
            console.error('❌ Datos inválidos:', { paquete, cantidadPersonas });
            mostrarMensaje('Error: Información de paquete o cantidad de personas no válida.', 'error');
            return;
        }

        const productoParaCarrito = {
            id_paquete: paquete.id_paquete,
            nombre_paquete: paquete.nombre_paquete,
            precio_unitario: parseFloat(paquete.precio_total) || 0,
            cantidad: cantidadPersonas,
            descripcion_breve: paquete.descripcion || paquete.nombre_paquete,
        };

        console.log('📤 Producto a enviar al carrito:', productoParaCarrito);

        mostrarMensaje('Agregando producto al carrito...', 'info');

        const response = await fetch('/api/agregar_a_carrito', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(productoParaCarrito),
        });

        console.log('📡 Response status:', response.status);
        
        const contentType = response.headers.get('content-type');
        console.log('📡 Content-Type:', contentType);
        
        if (!contentType || !contentType.includes('application/json')) {
            const responseText = await response.text();
            console.error('❌ Response is not JSON. Received:', responseText.substring(0, 500));
            
            if (responseText.includes('login') || responseText.includes('<!DOCTYPE')) {
                mostrarMensaje('Sesión expirada. Por favor, inicia sesión nuevamente.', 'error');
                setTimeout(() => {
                    window.location.href = '/login';
                }, 2000);
                return;
            }
            
            mostrarMensaje('Error del servidor: Respuesta inválida.', 'error');
            return;
        }
        
        let result;
        try {
            const responseText = await response.text();
            console.log('📡 Raw response:', responseText);
            result = JSON.parse(responseText);
            console.log('📡 Parsed response data:', result);
        } catch (jsonError) {
            console.error('❌ Error parsing response JSON:', jsonError);
            mostrarMensaje('Error: Respuesta del servidor inválida.', 'error');
            return;
        }

        if (response.ok) {
            console.log('✅ Producto agregado exitosamente');
            mostrarMensaje(result.message || 'Producto agregado al carrito exitosamente!', 'success');
            
            setTimeout(() => {
                window.location.href = '/carrito';
            }, 1500);
            
        } else {
            console.error('❌ Error del servidor:', result.error);
            mostrarMensaje(result.error || 'Hubo un error al agregar el producto al carrito.', 'error');
        }

    } catch (error) {
        console.error('💥 Error crítico en agregarProducto:', error);
        mostrarMensaje('Ocurrió un error inesperado. Por favor, inténtalo de nuevo.', 'error');
    }
}

function mostrarMensaje(mensaje, tipo = 'info') {
    const existingMessages = document.querySelectorAll('.message-box');
    existingMessages.forEach(msg => msg.remove());
    
    const messageBox = document.createElement('div');
    messageBox.classList.add('message-box', tipo);
    messageBox.textContent = mensaje;
    
    Object.assign(messageBox.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '15px 20px',
        borderRadius: '5px',
        color: 'white',
        fontWeight: 'bold',
        zIndex: '9999',
        maxWidth: '400px',
        transform: 'translateX(100%)',
        transition: 'transform 0.3s ease-in-out',
        backgroundColor: tipo === 'success' ? '#28a745' : 
                        tipo === 'error' ? '#dc3545' : 
                        tipo === 'warning' ? '#ffc107' : '#17a2b8'
    });
    
    document.body.appendChild(messageBox);

    requestAnimationFrame(() => {
        messageBox.style.transform = 'translateX(0)';
    });

    setTimeout(() => {
        messageBox.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (messageBox.parentNode) {
                messageBox.remove();
            }
        }, 300);
    }, 4000);
}