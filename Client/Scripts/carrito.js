async function agregarProducto() {
    try {
        // 1. Obtener la información del paquete desde el script tag JSON
        const paqueteDataElement = document.getElementById('data_paquete');
        if (!paqueteDataElement) {
            console.error('Elemento #data_paquete no encontrado. No se puede obtener la información del paquete.');
            return;
        }
        const paquete = JSON.parse(paqueteDataElement.textContent);

        // 2. Obtener la cantidad de personas seleccionadas por el usuario
        const personasDisplay = document.getElementById('personas-display');
        const cantidadPersonas = parseInt(personasDisplay.textContent.trim());

        // Validar que se haya obtenido la información
        if (!paquete || isNaN(cantidadPersonas) || cantidadPersonas < 1) {
            console.error('Datos del paquete o cantidad de personas inválidos.');
            mostrarMensaje('Error: Información de paquete o cantidad de personas no válida.', 'error');
            return;
        }

        // Crear el objeto del producto a agregar al carrito
        const productoParaCarrito = {
            id_paquete: paquete.id_paquete,
            nombre_paquete: paquete.nombre_paquete,
            precio_unitario: paquete.precio_total,
            cantidad: cantidadPersonas,
            descripcion_breve: paquete.descripcion,
        };

        console.log('Producto a enviar al carrito:', productoParaCarrito);

        // 3. Enviar los datos al servidor (ruta Express)
        const response = await fetch('/api/agregar_a_carrito', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(productoParaCarrito),
        });

        const result = await response.json();

        if (response.ok) {
            console.log('Respuesta del servidor:', result);
            mostrarMensaje(result.message || 'Producto agregado al carrito exitosamente!', 'success');
        } else {
            console.error('Error al agregar al carrito:', result.error);
            mostrarMensaje(result.error || 'Hubo un error al agregar el producto al carrito.', 'error');
        }

    } catch (error) {
        console.error('Error inesperado en agregarProducto:', error);
        mostrarMensaje('Ocurrió un error inesperado. Inténtalo de nuevo.', 'error');
    }
}

// Función auxiliar para mostrar mensajes al usuario (mejorada)
function mostrarMensaje(mensaje, tipo = 'info') {
    const messageBox = document.createElement('div');
    messageBox.classList.add('message-box', tipo);
    messageBox.textContent = mensaje;
    document.body.appendChild(messageBox);

    // Forzar reflow para que la animación funcione
    messageBox.offsetHeight;
    
    // Agregar clase show para la animación de entrada
    messageBox.classList.add('show');

    // Eliminar el mensaje después de unos segundos
    setTimeout(() => {
        messageBox.classList.remove('show');
        setTimeout(() => {
            if (messageBox.parentNode) {
                messageBox.remove();
            }
        }, 300); // Esperar a que termine la animación de salida
    }, 3000);
}

// Función para actualizar la cantidad de un item en el carrito
async function updateCartItemQuantity(id_detalle, change) {
    try {
        const response = await fetch('/api/actualizar_cantidad_carrito', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                id_detalle: id_detalle,
                cambio: change
            }),
        });

        const result = await response.json();

        if (response.ok) {
            // Recargar la página para mostrar los cambios
            window.location.reload();
        } else {
            mostrarMensaje(result.error || 'Error al actualizar la cantidad.', 'error');
        }
    } catch (error) {
        console.error('Error al actualizar cantidad:', error);
        mostrarMensaje('Error inesperado al actualizar la cantidad.', 'error');
    }
}

// Función para eliminar un item del carrito
async function removeCartItem(id_detalle) {
    if (!confirm('¿Estás seguro de que quieres eliminar este item del carrito?')) {
        return;
    }

    try {
        const response = await fetch('/api/eliminar_item_carrito', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                id_detalle: id_detalle
            }),
        });

        const result = await response.json();

        if (response.ok) {
            mostrarMensaje('Item eliminado del carrito exitosamente.', 'success');
            // Recargar la página para mostrar los cambios
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } else {
            mostrarMensaje(result.error || 'Error al eliminar el item.', 'error');
        }
    } catch (error) {
        console.error('Error al eliminar item:', error);
        mostrarMensaje('Error inesperado al eliminar el item.', 'error');
    }
}