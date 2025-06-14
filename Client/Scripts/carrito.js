async function agregarProducto() {
    console.log('🛒 Iniciando proceso de agregar producto...');
    
    try {
        // 1. Get package information from JSON script tag
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

        // 2. Get selected number of people
        const personasDisplay = document.getElementById('personas-display');
        if (!personasDisplay) {
            console.error('❌ Elemento #personas-display no encontrado');
            mostrarMensaje('Error: No se pudo obtener la cantidad de personas.', 'error');
            return;
        }
        
        const cantidadPersonas = parseInt(personasDisplay.textContent.trim());
        console.log('👥 Cantidad de personas:', cantidadPersonas);

        // Validate obtained information
        if (!paquete || !paquete.id_paquete || isNaN(cantidadPersonas) || cantidadPersonas < 1) {
            console.error('❌ Datos inválidos:', { paquete, cantidadPersonas });
            mostrarMensaje('Error: Información de paquete o cantidad de personas no válida.', 'error');
            return;
        }

        // Create product object to add to cart
        const productoParaCarrito = {
            id_paquete: paquete.id_paquete,
            nombre_paquete: paquete.nombre_paquete,
            precio_unitario: parseFloat(paquete.precio_total) || 0,
            cantidad: cantidadPersonas,
            descripcion_breve: paquete.descripcion || paquete.nombre_paquete,
        };

        console.log('📤 Producto a enviar al carrito:', productoParaCarrito);

        // Show loading message
        mostrarMensaje('Agregando producto al carrito...', 'info');

        // 3. Send data to server with better error handling
        const response = await fetch('/api/agregar_a_carrito', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(productoParaCarrito),
        });

        console.log('📡 Response status:', response.status);
        console.log('📡 Response headers:', Object.fromEntries(response.headers));
        
        // Check if response is actually JSON
        const contentType = response.headers.get('content-type');
        console.log('📡 Content-Type:', contentType);
        
        if (!contentType || !contentType.includes('application/json')) {
            // If it's not JSON, get the text to see what was returned
            const responseText = await response.text();
            console.error('❌ Response is not JSON. Received:', responseText.substring(0, 500));
            
            // Check if it's a redirect to login
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
            
            // Optional: Update cart counter or redirect
            setTimeout(() => {
                // window.location.href = '/carrito';
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

// Enhanced message display function
function mostrarMensaje(mensaje, tipo = 'info') {
    // Remove existing messages first
    const existingMessages = document.querySelectorAll('.message-box');
    existingMessages.forEach(msg => msg.remove());
    
    const messageBox = document.createElement('div');
    messageBox.classList.add('message-box', tipo);
    messageBox.textContent = mensaje;
    
    // Add inline styles if CSS classes don't exist
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

    // Force reflow and show message
    requestAnimationFrame(() => {
        messageBox.style.transform = 'translateX(0)';
    });

    // Remove message after delay
    setTimeout(() => {
        messageBox.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (messageBox.parentNode) {
                messageBox.remove();
            }
        }, 300);
    }, 4000);
}

// Debug function to check session and user data
function debugUserSession() {
    fetch('/api/debug_session')
        .then(response => response.json())
        .then(data => console.log('🔍 Session debug:', data))
        .catch(error => console.error('❌ Session debug error:', error));
}

// Add debug endpoint to server (optional)
app.get('/api/debug_session', isLogged, (req, res) => {
    res.json({
        session_exists: !!req.session,
        user_id: req.session.usuario_id,
        user_session: req.session.user_sesion,
        session_data: {
            nombre: req.session.nombre_us,
            email: req.session.email_us,
            rol: req.session.rol_us
        }
    });
});