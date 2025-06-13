async function agregarProducto() {
    try {
        // 1. Obtener la información del paquete desde el script tag JSON
        // Esto es una forma segura de pasar datos del servidor (EJS) al cliente (JS)
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
            // Aquí podrías mostrar un mensaje al usuario.
            // Por ejemplo, usando un modal en lugar de alert
            mostrarMensaje('Error: Información de paquete o cantidad de personas no válida.', 'error');
            return;
        }

        // Crear el objeto del producto a agregar al carrito
        const productoParaCarrito = {
            id_paquete: paquete.id_paquete,
            nombre_paquete: paquete.nombre_paquete,
            precio_unitario: paquete.precio_total, // Precio base del paquete
            cantidad: cantidadPersonas,
            // Puedes agregar más detalles si los necesitas en el carrito, como la descripción, imagen, etc.
            descripcion_breve: paquete.descripcion,
            // Si tienes una imagen principal para el paquete, inclúyela aquí.
            // Por ejemplo: imagen_url: paquete.imagen_principal
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
            // Opcional: Redirigir al carrito después de agregar
            // window.location.href = '/carrito';
        } else {
            console.error('Error al agregar al carrito:', result.error);
            mostrarMensaje(result.error || 'Hubo un error al agregar el producto al carrito.', 'error');
        }

    } catch (error) {
        console.error('Error inesperado en agregarProducto:', error);
        mostrarMensaje('Ocurrió un error inesperado. Inténtalo de nuevo.', 'error');
    }
}

// Función auxiliar para mostrar mensajes al usuario (simulando un modal o Toast)
function mostrarMensaje(mensaje, tipo = 'info') {
    const messageBox = document.createElement('div');
    messageBox.classList.add('message-box', tipo); // Agrega clases para estilos CSS
    messageBox.textContent = mensaje;
    document.body.appendChild(messageBox);

    // Eliminar el mensaje después de unos segundos
    setTimeout(() => {
        messageBox.remove();
    }, 3000); // 3 segundos

    // Puedes estilizar .message-box y .message-box.error/.message-box.success en tu CSS
}



