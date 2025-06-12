const dotenv = require('dotenv');

// Antes: import { createClient } from '@supabase/supabase-js';
const { createClient } = require('@supabase/supabase-js');

dotenv.config();
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('ERROR: Las variables de entorno SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY no están definidas.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);




const express = require('express')
const app = express()

const session = require('express-session')
const mysql = require('mysql2');


const bcrypt = require('bcrypt');
const path = require('path');
const { PORT } = require('./config.js');
const { clave_sesion } = require('./config.js');

// // Configuración de express-session
app.use(
    session({
        secret: "Pzdb3Jc%V8pB},p8|$>4r%t'|cs;kzaq8=X",
        resave: false,
        saveUninitialized: true,
        cookie: {
            secure: false,
            maxAge: 30 * 60 * 1000, // 30 minutos en milisegundos 
        },
    })
);



app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'Views'));

//  permite que los archivos dentro de /Client sean accesibles desde el navegador
app.use(express.static(path.join(__dirname, '../Client')));

// Middleware para procesar JSON y datos de formularios
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/resources', express.static(path.join(__dirname, '../Client/Resources')));

// Conexión a la base de datos

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'BD',
    port: 3306
});

// Encender servidor
app.listen(PORT, () => {
    console.log(`PAGINA: localhost: ${PORT}`)
})


const isLogged = (req, res, next) => {
    if (req.session.user_sesion == '' || typeof req.session.user_sesion == 'undefined') {
        res.redirect('/')
    } else {
        next()
    }
}
app.get('/', (req, res) => {
    // Mientras este en produccion para ahorrar tiempo
    // res.redirect('/index');

    res.redirect('/login')

})

app.get('/login', (req, res) => {
    res.render('login', { session: req.session });
})

app.get('/administrador', (req, res) => {
    res.render('administrador', { session: req.session });
})

app.get('/register', (req, res) => {
    res.render('register', { session: req.session });
})
app.get('/index', async (req, res) => {

    res.render('index', { session: req.session });
})

app.post('/registrar', async (req, res) => {
    try {
        console.log('1. Solicitud de registro recibida.');
        const { nombre_us, apellido_us, nombre_usuario_us, email_us, password_us } = req.body;
        console.log('2. Datos del formulario:', { nombre_us, email_us });

        const hash = await hashPassword(password_us);
        console.log('3. Contraseña hasheada.');

        console.log('4. Intentando insertar en Supabase...');
        const { data: insert_users, error } = await supabase
            .from('Usuarios') // ¡Asegúrate de que es 'Usuario' o 'usuarios' según tu tabla real!
            .insert([
                {
                    nombre: nombre_us,
                    apellido: apellido_us,
                    nombre_usuario: nombre_usuario_us,
                    email: email_us,
                    contraseña: hash, // O 'contrasena' si cambiaste el nombre de la columna
                    rol: 'usuario'
                }
            ])
            .select();

        if (error) {
            console.error('❌ Error en Supabase:', error);
            // Intenta enviar más detalles si el error es {}
            if (Object.keys(error).length === 0) {
                console.error('El objeto de error de Supabase está vacío. Posiblemente un problema de RLS o permisos de API Key.');
            }
            return res.render('login.ejs', { error: 'Error al registrar el usuario.' });
        }

        console.log('5. Inserción exitosa en Supabase.');
        const nuevoUsuario = insert_users[0];
        // ... (resto del código de sesión)
        console.log('6. Sesión creada. Redirigiendo a /index.');
        return res.redirect('/index');
    } catch (err) {
        console.error('❌ Error general en /registrar:', err);
        res.render('register', { error: 'Ocurrió un error al registrarse.' });
    }
});

/* <---------------------------------------------------------------->*/
app.post('/iniciar_sesion', async (req, res) => {
    try {
        const { user_name, password } = req.body;

        if (!user_name?.trim() || !password?.trim()) {
            return res.render('login.ejs', { error: 'Por favor, completa todos los campos.' });
        }

        // Buscar usuario en Supabase
        const { data: userResults, error } = await supabase
            .from('Usuarios') // o 'usuario', depende cómo se llame realmente
            .select('*')
            .eq('nombre_usuario', user_name)

        if (error) {
            console.error('Error en consulta Supabase:', error)
            return res.render('login.ejs', { error: 'Error al verificar los datos.' });
        }

        if (!userResults || userResults.length === 0) {
            return res.render('login.ejs', { error: 'Usuario o contraseña incorrectos' });
        }

        const usuario = userResults[0]
        const hashedPassword = usuario.contraseña

        const isMatch = await verifyPassword(password, hashedPassword)

        if (!isMatch) {
            return res.render('login.ejs', { error: 'Usuario o contraseña incorrectos' });
        }

        // Iniciar sesión
        req.session.usuario_id = usuario.ID_usuario
        req.session.nombre_us = usuario.nombre
        req.session.apellido_us = usuario.apellido
        req.session.nombre_usuario_us = usuario.nombre_usuario
        req.session.email_us = usuario.email
        req.session.password_us = usuario.contraseña
        req.session.rol_us = usuario.rol
        req.session.user_sesion = true
        req.session.root = usuario.rol === 'root'

        return res.redirect(req.session.root ? '/dashboard' : '/index')

    } catch (err) {
        console.error('Error en inicio de sesión:', err);
        return res.render('login.ejs', { error: 'Error al verificar los datos' });
    }
})


// Función para comparar una contraseña con su hash
async function verifyPassword(plainPassword, hashedPassword) {
    try {
        const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
        return isMatch;
    } catch (error) {
        console.error('Error al verificar la contraseña:', error);
        throw error;
    }
}
// Funcion para hashear una contraseña
async function hashPassword(plainPassword) {
    try {
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);
        return hashedPassword;
    } catch (error) {
        console.error('Error al hashear la contraseña:', error);
        throw error;
    }
}
// Funcion para solicitar la fecha actual.
function Datatime() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

app.use('/Scripts', express.static(path.join(__dirname, '../Client/Scripts')));
app.use('/administrador', express.static(path.join(__dirname, '../Client')));