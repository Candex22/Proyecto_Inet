document.addEventListener('DOMContentLoaded', function() {
    const userMenu = document.getElementById('userMenu');
    const dropdownMenu = userMenu?.querySelector('.dropdown-menu');

    if (userMenu && dropdownMenu) {
        // Toggle menu on click
        userMenu.addEventListener('click', function(e) {
            e.stopPropagation();
            userMenu.classList.toggle('active');
            dropdownMenu.classList.toggle('show');
        });

        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!userMenu.contains(e.target)) {
                userMenu.classList.remove('active');
                dropdownMenu.classList.remove('show');
            }
        });

        // Prevent menu from closing when clicking inside
        dropdownMenu.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    }

    // Manejar el clic en el botón de logout
    const logoutButton = document.querySelector('.logout');
    if (logoutButton) {
        logoutButton.addEventListener('click', function(e) {
            e.preventDefault();
            if (confirm('¿Estás seguro que deseas cerrar sesión?')) {
                window.location.href = '/logout';
            }
        });
    }

    // Manejar el clic en el nombre de usuario
    const userLink = document.querySelector('.user-menu .links:not(.logout)');
    if (userLink) {
        userLink.addEventListener('click', function(e) {
            e.preventDefault();
            // Aquí puedes agregar la lógica para mostrar un menú desplegable
            // o redirigir a la página de perfil
            window.location.href = '/perfil';
        });
    }
});

app.get('/logout', (req, res) => {
    console.log('🚪 Usuario cerrando sesión:', req.session.nombre_usuario_us);
    
    // Destruir la sesión inmediatamente
    req.session.destroy((err) => {
        if (err) {
            console.error('❌ Error al cerrar sesión:', err);
            // Aún así redirigir al login
            return res.redirect('/login');
        }
        
        console.log('✅ Sesión cerrada exitosamente');
        // Limpiar la cookie de sesión
        res.clearCookie('connect.sid'); // Nombre por defecto de la cookie de express-session
        
        // Redirigir al login
        res.redirect('/login');
    });
});