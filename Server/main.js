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
     res.redirect('/index');

    //res.redirect('/login')

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
app.get('/index', (req, res) => {
    res.render('index', { session: req.session });
})

app.post('/registrar', async (req, res) => {
    try {
        const { nombre_us, apellido_us, nombre_usuario_us, email_us, password_us } = req.body;


        const hash = await hashPassword(password_us);
        const insert_usuario = "INSERT INTO usuarios ( nombre , apellido , nombre_usuario , email , contraseña, rol) VALUES (?,?,?,?,?,?)";

        connection.query(insert_usuario, [nombre_us, apellido_us, nombre_usuario_us, email_us, hash, "usuario"], (err, result) => {
            if (err) {
                console.error('Error al registrarse ', err);
                res.status(500).send('Error al registrarse ');
            } else {
                const info_us = "SELECT `usuario_id` FROM `usuarios` WHERE 1 ORDER BY `usuario_id` DESC";
                connection.query(info_us, [], (err, result_id) => {
                    if (err) {
                        console.error('Error al registrarse ', err);
                        res.status(500).send('Error al registrarse ');
                    } else {


                        req.session.usuario_id = result_id[0].usuario_id + 1;
                        req.session.nombre_us = nombre_us
                        req.session.apellido_us = apellido_us
                        req.session.nombre_usuario_us = nombre_usuario_us
                        req.session.email_us = email_us
                        req.session.password_us = password_us
                        req.session.rol_us = "usuario"
                        req.session.user_sesion = true;
                        res.redirect('/index');
                    }
                })

            }
        })

    } catch (err) {
        console.error('Error en la consulta:', err);
        res.render('register', { error: 'Ocurrio un error al monento de registrase' });
    }


})

/* <---------------------------------------------------------------->*/
app.post('/iniciar_sesion', async (req, res) => {
    try {
        const { user_name, password } = req.body;

        // Si no se envían credenciales,  renderiza la vista sin error
        if (!user_name?.trim() || !password?.trim()) {

            return res.render('login.ejs', { error: 'Por favor, completa todos los campos.' });
        }

        const query_ini = 'SELECT * FROM `usuarios` WHERE nombre_usuario =?';
        const [userResults] = await connection.promise().query(query_ini, [user_name]);

        if (userResults.length === 0) {
            return res.render('login.ejs', { error: 'Usuario o contraseña incorrectos' });
        }

        const hashedPassword = userResults[0].contraseña;
        const isMatch = await verifyPassword(password, hashedPassword);
        if (isMatch) {
            req.session.usuario_id = userResults[0].usuario_id;
            req.session.nombre_us = userResults[0].nombre;
            req.session.apellido_us = userResults[0].apellido;
            req.session.nombre_usuario_us = userResults[0].nombre_usuario;
            req.session.email_us = userResults[0].email;
            req.session.password_us = userResults[0].contraseña;
            req.session.rol_us = userResults[0].rol;
            req.session.user_sesion = true;
            if (req.session.rol_us == "root") {
                req.session.root = true;
                return res.redirect('/dashboard');

            } else {
                req.session.root = false;
                return res.redirect('/index');
            }

        } else {
            return res.render('login.ejs', { error: 'Usuario o contraseña incorrectos' });
        }
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