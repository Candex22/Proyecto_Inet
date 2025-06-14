// config/supabase.js (o similar)
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY; // O SUPABASE_SERVICE_ROLE_KEY si es necesario

if (!supabaseUrl || !supabaseKey) {
    console.error("ERROR: Las variables de entorno SUPABASE_URL o SUPABASE_KEY no están definidas.");
    // Considera salir del proceso o manejar el error de otra forma
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;



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

// const connection = mysql.createConnection({
//     host: 'localhost',
//     user: 'root',
//     password: '',
//     database: 'BD',
//     port: 3306
// });

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

app.get('/paquetes', (req, res) => {
    res.render('paquetes', { session: req.session });
})


app.get('/index', async (req, res) => {


    try {
        let { data: reseñas, error: reseñasError } = await supabase // Usa supabase
            .from('reseñas')
            .select('*');

        if (reseñasError) {
            console.error('❌ Error en Supabase (al obtener reseñas):', reseñasError);
            if (Object.keys(reseñasError).length === 0) {
                console.error('El objeto de error de Supabase está vacío. Posiblemente un problema de RLS o permisos de API Key.');
            }
            return res.render('login.ejs', { error: 'Error al cargar reseñas.' });
        } else {


            // Objeto para almacenar el resumen por paquete
            let resumenPaquetes = {};

            // Iterar sobre cada reseña para acumular los datos
            for (let i = 0; i < reseñas.length; i++) {
                const reseña = reseñas[i];
                const idPaquete = reseña.id_paquete;
                // Asegurarse de convertir el puntaje a número para la suma
                const puntajeNumerico = parseFloat(reseña.puntaje);

                // Si el paquete aún no está en nuestro objeto resumenPaquetes, inicializarlo
                if (!resumenPaquetes[idPaquete]) {
                    resumenPaquetes[idPaquete] = {
                        id_paquete: idPaquete,
                        total_puntaje_sumado: 0,
                        cantidad_reseñas: 0
                    };
                }

                // Sumar el puntaje y contar la reseña
                resumenPaquetes[idPaquete].total_puntaje_sumado += puntajeNumerico;
                resumenPaquetes[idPaquete].cantidad_reseñas += 1;
            }

            // ==============================================================



            let { data: paquetes, error: paquetesError } = await supabase // Usa supabase
                .from('paquete')
                .select('*');

            if (paquetesError) {
                console.error('❌ Error en Supabase (al obtener paquetes):', paquetesError);
                if (Object.keys(paquetesError).length === 0) {
                    console.error('El objeto de error de Supabase está vacío. Posiblemente un problema de RLS o permisos de API Key.');
                }
                return res.render('login.ejs', { error: 'Error al cargar paquetes.' });
            } else {


                res.render('index', { session: req.session, paquetes: paquetes, reseñas: reseñas, resumenReseñas: resumenPaquetes });
            }
        }
    } catch (err) {
        console.error('Error general en la ruta /index:', err);
        return res.render('login.ejs', { error: 'Ocurrió un error inesperado al cargar la página.' });
    }
});

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
        console.log(user_name, " y ", password)
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

app.get('/paquete', async (req, res) => {
    const id_paquete = req.query.id_paquete;

    try {
        // Obtener datos del paquete
        let { data: paquete_data, error: paqueteError } = await supabase
            .from('paquete')
            .select("*")
            .eq('id_paquete', id_paquete);

        if (paqueteError) {
            console.error("Error al obtener datos del paquete:", paqueteError);
            return res.status(500).send("Error interno del servidor al obtener paquete.");
        }

        // Obtener componentes del paquete
        let { data: paquete_componentes, error: componentesError } = await supabase
            .from('paquete_componentes')
            .select("*")
            .eq('id_paquete', id_paquete);

        if (componentesError) {
            console.error("Error al obtener componentes del paquete:", componentesError);
            return res.status(500).send("Error interno del servidor al obtener componentes.");
        }

        // Obtener reseñas
        let { data: reseñas, error: reseñasError } = await supabase
            .from('reseñas')
            .select("*")
            .eq('id_paquete', id_paquete);

        if (reseñasError) {
            console.error("Error al obtener las reseñas del paquete:", reseñasError);
            return res.status(500).send("Error interno del servidor al obtener reseñas.");
        }

        // Inicializar arrays para los componentes
        const hoteles = [];
        const vuelos = [];
        const autos = [];

        // CORRECCIÓN PRINCIPAL: Iterar correctamente sobre el array
        for (let i = 0; i < paquete_componentes.length; i++) { // .length era lo que faltaba
            const componente = paquete_componentes[i];

            if (componente.tipo_componente === "Vuelo") {
                const id_vuelo = componente.id_componente; // Usar 'componente' en lugar de paquete_componentes[i]

                // CORRECCIÓN: Variable mal nombrada (id_vuelo vs vuelo_id)
                let { data: vuelo_data, error: vueloError } = await supabase
                    .from('vuelo')
                    .select("*")
                    .eq('id_vuelo', id_vuelo); // Era 'vuelo_id' pero debería ser 'id_vuelo'

                if (vueloError) {
                    console.error("Error al obtener datos del vuelo:", vueloError);
                } else if (vuelo_data && vuelo_data.length > 0) {
                    vuelos.push(vuelo_data[0]); // Agregar al array de vuelos
                }
            }

            if (componente.tipo_componente === "Hotel") {
                const id_hotel = componente.id_componente;

                let { data: hotel_data, error: hotelError } = await supabase
                    .from('hotel')
                    .select("*")
                    .eq('id_hotel', id_hotel);

                if (hotelError) {
                    console.error("Error al obtener datos del hotel:", hotelError);
                } else if (hotel_data && hotel_data.length > 0) {
                    hoteles.push(hotel_data[0]);
                }
            }

            if (componente.tipo_componente === "Auto") {
                const id_auto = componente.id_componente;

                let { data: auto_data, error: autoError } = await supabase
                    .from('auto')
                    .select("*")
                    .eq('id_auto', id_auto);

                if (autoError) {
                    console.error("Error al obtener datos del auto:", autoError);
                } else if (auto_data && auto_data.length > 0) {
                    autos.push(auto_data[0]);
                }
            }
        }

        // Log para debugging
        console.log("Vuelos encontrados:", vuelos[0].aerolinea);
        console.log("Hoteles encontrados:", hoteles);
        console.log("Autos encontrados:", autos);

        // Renderizar la vista con todos los datos
        res.render('paquete', {
            session: req.session,
            paquete: paquete_data[0],
            vuelos_data: vuelos[0],      // Array de vuelos
            hoteles_data: hoteles[0],    // Array de hoteles
            autos_data: autos[0],        // Array de autos
            reseñas_data: reseñas
        });

    } catch (error) {
        console.error("Error general en la ruta /paquete:", error);
        res.status(500).send("Error interno del servidor.");
    }
});

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