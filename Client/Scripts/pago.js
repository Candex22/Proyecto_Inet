document.addEventListener('DOMContentLoaded', function() {
    // Inicializar validaciones
    initializeValidations();
});

function initializeValidations() {
    const dniInput = document.getElementById('dni');
    const phoneInput = document.getElementById('phone');
    
    // Validación en tiempo real para DNI (solo números, 7-8 dígitos)
    if (dniInput) {
        dniInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, ''); // Solo números
            if (value.length > 8) {
                value = value.substring(0, 8);
            }
            e.target.value = value;
            validateDNI(value);
        });
    }
    
    // Validación en tiempo real para teléfono (solo números, mínimo 10 dígitos)
    if (phoneInput) {
        phoneInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, ''); // Solo números
            if (value.length > 15) { // Máximo 15 dígitos
                value = value.substring(0, 15);
            }
            e.target.value = value;
            validatePhone(value);
        });
    }
}

function validateDNI(dni) {
    const errorElement = document.getElementById('dni-error');
    const isValid = /^\d{7,8}$/.test(dni);
    
    if (dni.length === 0) {
        showError(errorElement, '');
        return false;
    } else if (!isValid) {
        showError(errorElement, 'El DNI debe contener 7 u 8 dígitos numéricos.');
        return false;
    } else {
        hideError(errorElement);
        return true;
    }
}

function validatePhone(phone) {
    const errorElement = document.getElementById('phone-error');
    const isValid = /^\d{10,}$/.test(phone);
    
    if (phone.length === 0) {
        showError(errorElement, '');
        return false;
    } else if (!isValid) {
        showError(errorElement, 'El teléfono debe contener al menos 10 dígitos numéricos.');
        return false;
    } else {
        hideError(errorElement);
        return true;
    }
}

function validateAddress(address) {
    const errorElement = document.getElementById('address-error');
    
    if (!address || address.trim().length < 5) {
        showError(errorElement, 'La dirección debe tener al menos 5 caracteres.');
        return false;
    } else {
        hideError(errorElement);
        return true;
    }
}

function showError(element, message) {
    if (element) {
        element.textContent = message;
        element.style.display = message ? 'block' : 'none';
    }
}

function hideError(element) {
    if (element) {
        element.textContent = '';
        element.style.display = 'none';
    }
}

function procesarPago() {
    const dni = document.getElementById('dni').value.trim();
    const address = document.getElementById('address').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const submitButton = document.getElementById('submit-payment');
    const loadingElement = document.getElementById('loading');
    
    // Validar todos los campos
    const isDNIValid = validateDNI(dni);
    const isPhoneValid = validatePhone(phone);
    const isAddressValid = validateAddress(address);
    
    if (!isDNIValid || !isPhoneValid || !isAddressValid) {
        showNotification('Por favor, complete todos los campos correctamente.', 'error');
        return;
    }
    
    // Mostrar loading y deshabilitar botón
    if (submitButton) {
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
    }
    
    if (loadingElement) {
        loadingElement.style.display = 'block';
    }
    
    // Datos a enviar
    const paymentData = {
        dni: dni,
        address: address,
        phone: phone
    };
    
    // Realizar petición al servidor
    fetch('/api/procesar_pago', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(paymentData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification(data.message || 'Pago procesado exitosamente. Recibirá la factura en su correo.', 'success');
            
            // Redirigir a página de confirmación después de 2 segundos
            setTimeout(() => {
                window.location.href = '/confirmacion_pago';
            }, 2000);
        } else {
            showNotification(data.error || 'Error al procesar el pago. Intente nuevamente.', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('Error de conexión. Verifique su conexión a internet e intente nuevamente.', 'error');
    })
    .finally(() => {
        // Restaurar botón y ocultar loading
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.innerHTML = '<i class="fas fa-credit-card"></i> Confirmar Pago';
        }
        
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
    });
}

function showNotification(message, type = 'info') {
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close" onclick="closeNotification(this)">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Agregar al DOM
    document.body.appendChild(notification);
    
    // Mostrar con animación
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Auto-ocultar después de 5 segundos (excepto errores)
    if (type !== 'error') {
        setTimeout(() => {
            closeNotification(notification.querySelector('.notification-close'));
        }, 5000);
    }
}

function closeNotification(button) {
    const notification = button.closest('.notification');
    notification.classList.remove('show');
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 300);
}

// Función para formatear números como moneda
function formatCurrency(amount) {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS'
    }).format(amount);
}

// Función para validar formulario completo
function validateForm() {
    const dni = document.getElementById('dni').value.trim();
    const address = document.getElementById('address').value.trim();
    const phone = document.getElementById('phone').value.trim();
    
    return validateDNI(dni) && validateAddress(address) && validatePhone(phone);
}

// Event listeners adicionales
document.addEventListener('DOMContentLoaded', function() {
    // Validar formulario en tiempo real
    const form = document.getElementById('payment-form');
    if (form) {
        const inputs = form.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('blur', validateForm);
        });
    }
    
    // Prevenir envío del formulario con Enter
    document.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && e.target.tagName === 'INPUT') {
            e.preventDefault();
            procesarPago();
        }
    });
});