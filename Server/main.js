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

app.get('/carrito', (req, res) => {
    res.render('carrito', { session: req.session });
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

    // Renombra la segunda variable de error a 'errorComponentes' o similar
    let { data: paquete_data, error: paqueteError } = await supabase
        .from('paquete')
        .select("*")
        .eq('id_paquete', id_paquete);

    // Es buena práctica manejar los errores
    if (paqueteError) {
        console.error("Error al obtener datos del paquete:", paqueteError);
        return res.status(500).send("Error interno del servidor al obtener paquete.");
    }

    let { data: paquete_componentes, error: componentesError } = await supabase
        .from('paquete_componentes')
        .select("*")
        // Asegúrate de que este filtro sea correcto y relevante para tu lógica
        .eq('id_paquete', id_paquete); // Asumo que quieres filtrar por id_paquete aquí también

    if (componentesError) {
        console.error("Error al obtener componentes del paquete:", componentesError);
        return res.status(500).send("Error interno del servidor al obtener componentes.");
    }
    let { data: reseñas, reseñasError } = await supabase
        .from('reseñas')
        .select("*")

        // Filters
        .eq('id_paquete', id_paquete)
    if (reseñasError) {
        console.error("Error al obtener las reseñas del paquete:", reseñasError);
        return res.status(500).send("Error interno del servidor al obtener componentes.");
    }
    console.log(reseñas[0].id_reseña)
   
    // Aquí puedes procesar paquete_data y paquete_componentes
    // antes de pasarlos a tu vista, por ejemplo, combinarlos.
    // console.log("Datos del paquete:", paquete_data);
    // console.log("Componentes del paquete:", paquete_componentes);


    res.render('paquete', { session: req.session, paquete: paquete_data[0], componentes: paquete_componentes, reseñas_data: reseñas });
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

// Nueva ruta para agregar productos al carrito
app.post('/api/agregar_a_carrito', isLogged, async (req, res) => {
    try {
        const { id_paquete, nombre_paquete, precio_unitario, cantidad, descripcion_breve } = req.body;
        const userId = req.session.usuario_id; // ID del usuario desde la sesión

        if (!userId) {
            return res.status(401).json({ error: 'Usuario no autenticado.' });
        }

        if (!id_paquete || !nombre_paquete || !precio_unitario || !cantidad || cantidad < 1) {
            return res.status(400).json({ error: 'Datos del producto incompletos o inválidos.' });
        }

        // 1. Buscar un pedido abierto (carrito) para el usuario
        let { data: pedidoExistente, error: pedidoError } = await supabase
            .from('pedido')
            .select('*')
            .eq('id_usuario', userId)
            .eq('estado', 'abierto') // Asume que tienes un estado 'abierto' para carritos activos
            .limit(1);

        if (pedidoError) {
            console.error('Error al buscar pedido existente:', pedidoError);
            return res.status(500).json({ error: 'Error interno del servidor al buscar el carrito.' });
        }

        let id_pedido;

        if (pedidoExistente && pedidoExistente.length > 0) {
            // Ya existe un carrito abierto para este usuario
            id_pedido = pedidoExistente[0].id_pedido;
            console.log(`Pedido existente encontrado: ${id_pedido}`);
        } else {
            // No hay carrito abierto, crear uno nuevo
            const { data: nuevoPedido, error: nuevoPedidoError } = await supabase
                .from('pedido')
                .insert([
                    {
                        id_usuario: userId,
                        fecha_pedido: new Date().toISOString().split('T')[0], // Fecha actual 'YYYY-MM-DD'
                        estado: 'abierto',
                        total_pedido: 0 // Se actualizará al agregar productos
                    }
                ])
                .select();

            if (nuevoPedidoError) {
                console.error('Error al crear nuevo pedido:', nuevoPedidoError);
                return res.status(500).json({ error: 'Error interno del servidor al crear el carrito.' });
            }
            id_pedido = nuevoPedido[0].id_pedido;
            console.log(`Nuevo pedido creado: ${id_pedido}`);
        }

        // 2. Verificar si el producto ya está en el carrito
        let { data: detalleExistente, error: detalleError } = await supabase
            .from('detalles_pedido')
            .select('*')
            .eq('id_pedido', id_pedido)
            .eq('id_producto_servicio', id_paquete) // Usar id_paquete como id_producto_servicio
            .limit(1);

        if (detalleError) {
            console.error('Error al buscar detalle de pedido existente:', detalleError);
            return res.status(500).json({ error: 'Error interno del servidor al verificar producto en carrito.' });
        }

        let updatedProductQuantity;

        if (detalleExistente && detalleExistente.length > 0) {
            // El producto ya está en el carrito, actualizar la cantidad
            const currentQuantity = detalleExistente[0].cantidad;
            updatedProductQuantity = currentQuantity + cantidad; // Sumar la nueva cantidad
            const { error: updateError } = await supabase
                .from('detalles_pedido')
                .update({ cantidad: updatedProductQuantity })
                .eq('id_detalle', detalleExistente[0].id_detalle);

            if (updateError) {
                console.error('Error al actualizar cantidad del producto en carrito:', updateError);
                return res.status(500).json({ error: 'Error al actualizar la cantidad del producto en el carrito.' });
            }
            console.log(`Cantidad actualizada para el producto ${id_paquete} en el pedido ${id_pedido}. Nueva cantidad: ${updatedProductQuantity}`);
        } else {
            // El producto no está en el carrito, insertarlo como nuevo detalle
            const { data: nuevoDetalle, error: insertError } = await supabase
                .from('detalles_pedido')
                .insert([
                    {
                        id_pedido: id_pedido,
                        id_producto_servicio: id_paquete, // Esto es el id_paquete
                        tipo_producto_servicio: 'paquete', // Para diferenciar si es un paquete, hotel, vuelo, etc.
                        cantidad: cantidad,
                        precio_unitario: precio_unitario,
                        descripcion: descripcion_breve || nombre_paquete // Podrías usar nombre_paquete como descripción breve
                    }
                ])
                .select();

            if (insertError) {
                console.error('Error al insertar nuevo detalle de pedido:', insertError);
                return res.status(500).json({ error: 'Error al agregar el producto al carrito.' });
            }
            updatedProductQuantity = cantidad;
            console.log(`Nuevo producto ${id_paquete} agregado al pedido ${id_pedido}.`);
        }

        // Opcional: Recalcular el total del pedido después de agregar/actualizar un producto
        // Esto podría ser más eficiente con una función de base de datos o un trigger en Supabase
        const { data: detallesActuales, error: getDetallesError } = await supabase
            .from('detalles_pedido')
            .select('cantidad, precio_unitario')
            .eq('id_pedido', id_pedido);

        if (getDetallesError) {
            console.error('Error al obtener detalles para recalcular total:', getDetallesError);
            // No es un error crítico, el total se puede calcular en el frontend del carrito
        } else {
            let nuevoTotalPedido = 0;
            detallesActuales.forEach(item => {
                nuevoTotalPedido += item.cantidad * item.precio_unitario;
            });

            await supabase
                .from('pedido')
                .update({ total_pedido: nuevoTotalPedido })
                .eq('id_pedido', id_pedido);
            console.log(`Total del pedido ${id_pedido} actualizado a: ${nuevoTotalPedido}`);
        }


        return res.status(200).json({ message: 'Producto agregado al carrito exitosamente.', id_pedido: id_pedido, cantidad_actualizada: updatedProductQuantity });

    } catch (error) {
        console.error('Error en la ruta /api/agregar_a_carrito:', error);
        return res.status(500).json({ error: 'Ocurrió un error inesperado al agregar el producto al carrito.' });
    }
});


app.use('/Scripts', express.static(path.join(__dirname, '../Client/Scripts')));
app.use('/administrador', express.static(path.join(__dirname, '../Client')));