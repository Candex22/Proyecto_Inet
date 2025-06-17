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
const nodemailer = require('nodemailer'); 

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

// Configuración de archivos estáticos
app.use(express.static(path.join(__dirname, '../Client')));
app.use('/Scripts', express.static(path.join(__dirname, '../Client/Scripts')));
app.use('/Resources', express.static(path.join(__dirname, '../Client/Resources')));
app.use('/Estilo', express.static(path.join(__dirname, '../Client/Estilo')));

// Middleware para procesar JSON y datos de formularios
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Conexión a la base de datos

//  const connection = mysql.createConnection({
//      host: 'localhost',
//      user: 'root',
//      password: '',
//     database: 'BD',
//     port: 3306
// });

// Encender servidor
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Servidor corriendo en el puerto ${port}`);
});


const isLogged = (req, res, next) => {


    if (!req.session.user_sesion || !req.session.usuario_id) {


        // Check if it's an API request
        if (req.path.startsWith('/api/')) {
            // For API routes, return JSON error instead of redirect
            return res.status(401).json({ error: 'Usuario no autenticado. Por favor, inicia sesión.' });
        } else {
            // For regular routes, redirect to login
            return res.redirect('/login');
        }
    } else {

        next();
    }
};
app.get('/', (req, res) => {
    // Mientras este en produccion para ahorrar tiempo
    // res.redirect('/index');

    res.redirect('/login')

})

app.get('/login', (req, res) => {
    res.render('login', { session: req.session });
})

app.get('/administrador', async (req, res) => {
    let { data: vuelo, vueloError } = await supabase
        .from('vuelo')
        .select('*')

    if (vueloError) {
        console.error('❌ Error en Supabase (al obtener los vuelos):', vueloError);
        if (Object.keys(vueloError).length === 0) {
            console.error('El objeto de error de Supabase está vacío. Posiblemente un problema de RLS o permisos de API Key.');
        }
        return res.render('login.ejs', { error: 'Error al cargar reseñas.' });
    } else {
        let { data: hotel, hotelError } = await supabase
            .from('hotel')
            .select('*')
        if (hotelError) {
            console.error('❌ Error en Supabase (al obtener reseñas):', hotelError);
            if (Object.keys(hotelError).length === 0) {
                console.error('El objeto de error de Supabase está vacío. Posiblemente un problema de RLS o permisos de API Key.');
            }
            return res.render('login.ejs', { error: 'Error al cargar reseñas.' });
        } else {
            res.render('administrador', { session: req.session, data_vuelo: vuelo, data_hotel: hotel });
        }

    }

})

app.get('/register', (req, res) => {
    res.render('register', { session: req.session });
})

app.get('/paquetes', async (req, res) => {
    try {
        // Obtener reseñas
        let { data: reseñas, error: reseñasError } = await supabase
            .from('reseñas')
            .select('*');

        if (reseñasError) {
            console.error('❌ Error en Supabase (al obtener reseñas):', reseñasError);
            if (Object.keys(reseñasError).length === 0) {
                console.error('El objeto de error de Supabase está vacío. Posiblemente un problema de RLS o permisos de API Key.');
            }
            return res.render('login.ejs', { error: 'Error al cargar reseñas.' });
        }

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

        // Obtener paquetes
        let { data: paquetes, error: paquetesError } = await supabase
            .from('paquete')
            .select('*');

        if (paquetesError) {
            console.error('❌ Error en Supabase (al obtener paquetes):', paquetesError);
            if (Object.keys(paquetesError).length === 0) {
                console.error('El objeto de error de Supabase está vacío. Posiblemente un problema de RLS o permisos de API Key.');
            }
            return res.render('login.ejs', { error: 'Error al cargar paquetes.' });
        }

        // Si todo va bien, renderizar la vista 'paquetes'
        res.render('paquetes', {
            session: req.session,
            paquetes: paquetes,
            reseñas: reseñas, // Aunque 'reseñas' se procesa en resumenPaquetes, se pasa por si se necesita directamente en la vista.
            resumenReseñas: resumenPaquetes
        });

    } catch (err) {
        console.error('Error general en la ruta /paquetes:', err);
        return res.render('login.ejs', { error: 'Ocurrió un error inesperado al cargar la página.' });
    }
});


app.get('/logout', (req, res) => {
    console.log('🚪 Usuario cerrando sesión:', req.session.nombre_usuario_us);

    // Destruir la sesión inmediatamente
    req.session.destroy((err) => {
        if (err) {
            console.error('❌ Error al cerrar sesión:', err);
            return res.redirect('/login');
        }

        console.log('✅ Sesión cerrada exitosamente');
        // Limpiar la cookie de sesión
        res.clearCookie('connect.sid');

        // Redirigir al login
        res.redirect('/login');
    });
});

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

        const { nombre_us, apellido_us, nombre_usuario_us, email_us, password_us } = req.body;


        const hash = await hashPassword(password_us);



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


        const nuevoUsuario = insert_users[0];


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

        // Obtener reseñas y solo el nombre del usuario relacionado
        // CAMBIO CLAVE AQUÍ: Solo solicitamos 'Usuarios(nombre)'
        let { data: reseñasRaw, error: reseñasError } = await supabase
            .from('reseñas')
            .select('*, Usuarios(nombre)') // <-- MODIFICADO: Solo trae 'nombre'
            .eq('id_paquete', id_paquete);

        if (reseñasError) {
            console.error("Error al obtener las reseñas del paquete:", reseñasError);
            return res.status(500).send("Error interno del servidor al obtener reseñas.");
        }

        // Mapear las reseñas para incluir solo el nombre del usuario directamente
        const reseñas_data = reseñasRaw.map(reseña => ({
            ...reseña,
            user_name: reseña.Usuarios ? reseña.Usuarios.nombre : 'Usuario Desconocido'
        }));


        // Inicializar arrays para los componentes
        const hoteles = [];
        const vuelos = [];
        const autos = [];

        // Iterar sobre los componentes del paquete para obtener sus detalles
        for (let i = 0; i < paquete_componentes.length; i++) {
            const componente = paquete_componentes[i];

            if (componente.tipo_componente === "Vuelo") {
                const id_vuelo = componente.id_componente;

                let { data: vuelo_data, error: vueloError } = await supabase
                    .from('vuelo')
                    .select("*")
                    .eq('id_vuelo', id_vuelo);

                if (vueloError) {
                    console.error("Error al obtener datos del vuelo:", vueloError);
                } else if (vuelo_data && vuelo_data.length > 0) {
                    vuelos.push(vuelo_data[0]);
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

        // Renderizar la vista con todos los datos
        res.render('paquete', {
            session: req.session,
            paquete: paquete_data[0],
            vuelos_data: vuelos[0],
            hoteles_data: hoteles[0],
            autos_data: autos[0],
            reseñas_data: reseñas_data
        });

    } catch (error) {
        console.error("Error general en la ruta /paquete:", error);
        res.status(500).send("Error interno del servidor.");
    }
});
app.post("/enviar_opinion", async (req, res) => {
    const userId = req.session.usuario_id;
    const id_paquete = req.query.id_paquete;
    const rating = req.body.rating;
    const comment = req.body.comment;

    try {
        const { data, error } = await supabase
            .from('reseñas')
            .insert([
                {
                    id_paquete: id_paquete,
                    id_usuario: userId,
                    puntaje: rating,
                    cometario: comment,
                    fecha: new Date().toISOString().slice(0, 10)
                }
            ]);

        if (error) {
            console.error("Error al insertar la reseña:", error);
            return res.status(500).json({ success: false, message: "Error al guardar la sugerencia.", error: error.message });
        }



        res.redirect(`/paquete?id_paquete=${id_paquete}`);

    } catch (dbError) {
        console.error("Error al interactuar con Supabase:", dbError);
        res.status(500).json({ success: false, message: "Error interno del servidor al procesar la sugerencia." });
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


// Ruta para mostrar el carrito
app.get('/carrito', isLogged, async (req, res) => {
    try {
        const userId = req.session.usuario_id;
        console.log('🛒 Loading cart for user:', userId);

        if (!userId) {
            console.log('❌ No user ID found in session');
            return res.redirect('/login');
        }

        // Buscar pedido abierto específico del usuario
        let { data: pedidoAbierto, error: pedidoError } = await supabase
            .from('pedido')
            .select('*')
            .eq('id_usuario', userId)
            .eq('estado', 'abierto')
            .single();

        if (pedidoError && pedidoError.code !== 'PGRST116') {
            console.error('❌ Error al buscar pedido:', pedidoError);
            return res.render('carrito', {
                session: req.session,
                cartItems: [],
                cartTotal: 0
            });
        }

        console.log('📋 Pedido encontrado:', pedidoAbierto);

        let cartItems = [];
        let cartTotal = 0;

        if (pedidoAbierto) {
            const id_pedido = pedidoAbierto.id_pedido;
            console.log('📦 Procesando pedido ID:', id_pedido);

            // CORRECCIÓN: Obtener detalles del pedido SIN la columna imagen_url que no existe
            let { data: detallesPedido, error: detallesError } = await supabase
                .from('detalles_pedido')
                .select(`
                    id_detalle,
                    id_pedido,
                    id_producto_servicio,
                    cantidad,
                    precio_unitario,
                    descripcion,
                    paquete:id_producto_servicio (
                        nombre_paquete,
                        descripcion
                    )
                `)
                .eq('id_pedido', id_pedido);

            if (detallesError) {
                console.error('❌ Error al obtener detalles del pedido:', detallesError);
            } else {
                console.log('📝 Detalles encontrados:', detallesPedido?.length || 0);

                // Procesar cada detalle
                cartItems = detallesPedido.map(detalle => {
                    const itemTotal = (parseFloat(detalle.precio_unitario) || 0) * (parseInt(detalle.cantidad) || 1);
                    cartTotal += itemTotal;

                    return {
                        id_detalle: detalle.id_detalle,
                        id_producto_servicio: detalle.id_producto_servicio,
                        nombre_paquete: detalle.paquete?.nombre_paquete || `Paquete ID: ${detalle.id_producto_servicio}`,
                        descripcion: detalle.descripcion || detalle.paquete?.descripcion || 'Descripción no disponible',
                        precio_unitario: parseFloat(detalle.precio_unitario) || 0,
                        cantidad: parseInt(detalle.cantidad) || 1,
                        // imagen_url: null, // Removido ya que no existe en la BD
                        subtotal: itemTotal
                    };
                });
            }
        } else {
            console.log('📭 No se encontraron pedidos abiertos para el usuario');
        }

        console.log('🛒 Items finales del carrito:', cartItems.length);
        console.log('💰 Total final:', cartTotal);

        res.render('carrito', {
            session: req.session,
            cartItems: cartItems,
            cartTotal: cartTotal
        });

    } catch (error) {
        console.error('💥 Error crítico en ruta /carrito:', error);
        res.render('carrito', {
            session: req.session,
            cartItems: [],
            cartTotal: 0,
            error: 'Ocurrió un error al cargar el carrito'
        });
    }
});

// Función para actualizar cantidad (CORREGIDA)
app.post('/api/actualizar_cantidad_carrito', isLogged, async (req, res) => {
    try {
        const { id_detalle, cambio, nueva_cantidad } = req.body;
        const userId = req.session.usuario_id;

        console.log('🔄 Actualizando cantidad - User:', userId, 'Detalle:', id_detalle, 'Cambio:', cambio, 'Nueva cantidad:', nueva_cantidad);

        if (!id_detalle) {
            return res.status(400).json({ error: 'ID de detalle requerido.' });
        }

        // VERIFICACIÓN DE SEGURIDAD: Asegurar que el detalle pertenece al usuario
        const { data: detalleActual, error: getError } = await supabase
            .from('detalles_pedido')
            .select(`
                cantidad, 
                id_pedido, 
                precio_unitario,
                pedido:id_pedido (
                    id_usuario,
                    estado
                )
            `)
            .eq('id_detalle', id_detalle)
            .single();

        if (getError || !detalleActual) {
            console.error('❌ Error obteniendo detalle actual:', getError);
            return res.status(404).json({ error: 'Item no encontrado.' });
        }

        // VERIFICAR que el pedido pertenece al usuario logueado
        if (detalleActual.pedido.id_usuario !== userId) {
            console.error('❌ Usuario no autorizado para modificar este item');
            return res.status(403).json({ error: 'No autorizado.' });
        }

        // VERIFICAR que el pedido está abierto
        if (detalleActual.pedido.estado !== 'abierto') {
            return res.status(400).json({ error: 'No se puede modificar un pedido cerrado.' });
        }

        // Calcular nueva cantidad
        let nuevaCantidadFinal;
        if (nueva_cantidad !== undefined) {
            nuevaCantidadFinal = parseInt(nueva_cantidad);
        } else if (cambio !== undefined) {
            nuevaCantidadFinal = detalleActual.cantidad + parseInt(cambio);
        } else {
            return res.status(400).json({ error: 'Debe proporcionar cambio o nueva_cantidad.' });
        }

        if (nuevaCantidadFinal < 1) {
            return res.status(400).json({ error: 'La cantidad no puede ser menor a 1.' });
        }

        console.log('✅ Nueva cantidad calculada:', nuevaCantidadFinal);

        // Actualizar la cantidad
        const { error: updateError } = await supabase
            .from('detalles_pedido')
            .update({ cantidad: nuevaCantidadFinal })
            .eq('id_detalle', id_detalle);

        if (updateError) {
            console.error('❌ Error al actualizar cantidad:', updateError);
            return res.status(500).json({ error: 'Error al actualizar la cantidad.' });
        }

        // Recalcular total del pedido
        await recalcularTotalPedido(detalleActual.id_pedido);

        res.json({
            message: 'Cantidad actualizada exitosamente.',
            nueva_cantidad: nuevaCantidadFinal,
            precio_total_item: nuevaCantidadFinal * parseFloat(detalleActual.precio_unitario)
        });

    } catch (error) {
        console.error('💥 Error en actualizar cantidad:', error);
        res.status(500).json({ error: 'Error inesperado.' });
    }
});

app.delete('/api/eliminar_item_carrito/:id_detalle', isLogged, async (req, res) => {
    try {
        // En peticiones DELETE, los parámetros a menudo van en la URL, por eso usamos req.params
        // Si tu frontend envía el id en el body, mantén req.body, pero es más común en DELETE que vaya en la URL.
        const { id_detalle } = req.params; // Cambiado de req.body a req.params
        const userId = req.session.usuario_id;

        console.log('🗑️ Eliminando item - User:', userId, 'Detalle:', id_detalle);

        if (!id_detalle) {
            // Aunque venga de req.params, sigue siendo buena práctica validar
            return res.status(400).json({ error: 'ID de detalle requerido.' });
        }

        // VERIFICACIÓN DE SEGURIDAD: Obtener info del detalle y verificar ownership
        const { data: detalleInfo, error: getError } = await supabase
            .from('detalles_pedido')
            .select(`
                id_pedido,
                pedido:id_pedido (
                    id_usuario,
                    estado
                )
            `)
            .eq('id_detalle', id_detalle)
            .single();

        if (getError || !detalleInfo) {
            console.error('❌ Error obteniendo info del detalle:', getError);
            return res.status(404).json({ error: 'Item no encontrado.' });
        }

        // VERIFICAR que el pedido pertenece al usuario logueado
        if (detalleInfo.pedido.id_usuario !== userId) {
            console.error('❌ Usuario no autorizado para eliminar este item');
            return res.status(403).json({ error: 'No autorizado.' });
        }

        // VERIFICAR que el pedido está abierto
        if (detalleInfo.pedido.estado !== 'abierto') {
            return res.status(400).json({ error: 'No se puede modificar un pedido cerrado.' });
        }

        const id_pedido = detalleInfo.id_pedido;

        // Eliminar el item
        const { error: deleteError } = await supabase
            .from('detalles_pedido')
            .delete()
            .eq('id_detalle', id_detalle);

        if (deleteError) {
            console.error('❌ Error al eliminar item:', deleteError);
            return res.status(500).json({ error: 'Error al eliminar el item.' });
        }

        console.log('✅ Item eliminado exitosamente');

        // Recalcular total del pedido
        // Asegúrate de que recalcularTotalPedido esté definida y accesible
        await recalcularTotalPedido(id_pedido);

        res.json({ message: 'Item eliminado exitosamente.' });

    } catch (error) {
        console.error('💥 Error en eliminar item:', error);
        res.status(500).json({ error: 'Error inesperado.' });
    }
});
// Función para agregar al carrito (ya corregida en tu código)
app.post('/api/agregar_a_carrito', isLogged, async (req, res) => {
    console.log('🛒 Cart API called');
    console.log('📦 Request body:', req.body);
    console.log('👤 User ID:', req.session.usuario_id);

    try {
        const { id_paquete, nombre_paquete, precio_unitario, cantidad, descripcion_breve } = req.body;
        const userId = req.session.usuario_id;

        // Validation
        if (!userId) {
            console.error('❌ No user ID in session');
            return res.status(401).json({ error: 'Usuario no autenticado.' });
        }

        if (!id_paquete || !precio_unitario || !cantidad) {
            console.error('❌ Missing required fields:', { id_paquete, precio_unitario, cantidad });
            return res.status(400).json({ error: 'Datos incompletos: se requiere id_paquete, precio_unitario y cantidad.' });
        }

        console.log('✅ Validation passed, searching for open order...');

        // Buscar pedido abierto del usuario
        let { data: pedidoAbierto, error: pedidoError } = await supabase
            .from('pedido')
            .select('*')
            .eq('id_usuario', userId)
            .eq('estado', 'abierto')
            .single();

        if (pedidoError && pedidoError.code !== 'PGRST116') {
            console.error('❌ Error searching for order:', pedidoError);
            return res.status(500).json({ error: `Error al buscar pedido: ${pedidoError.message}` });
        }

        console.log('📋 Found order:', pedidoAbierto || 'None');

        let id_pedido;

        if (!pedidoAbierto) {
            console.log('🆕 Creating new order...');

            // Crear nuevo pedido
            const { data: nuevoPedido, error: crearError } = await supabase
                .from('pedido')
                .insert([{
                    id_usuario: userId,
                    fecha_pedido: new Date().toISOString(),
                    estado: 'abierto',
                    total_pedido: 0
                }])
                .select()
                .single();

            if (crearError) {
                console.error('❌ Error creating order:', crearError);
                return res.status(500).json({ error: `Error al crear pedido: ${crearError.message}` });
            }

            console.log('✅ New order created:', nuevoPedido);
            id_pedido = nuevoPedido.id_pedido;
        } else {
            id_pedido = pedidoAbierto.id_pedido;
            console.log('📋 Using existing order:', id_pedido);
        }

        // Verificar si el producto ya existe en el carrito
        const { data: itemExistente, error: buscarError } = await supabase
            .from('detalles_pedido')
            .select('*')
            .eq('id_pedido', id_pedido)
            .eq('id_producto_servicio', id_paquete)
            .single();

        if (buscarError && buscarError.code !== 'PGRST116') {
            console.error('❌ Error searching existing item:', buscarError);
            return res.status(500).json({ error: `Error al verificar carrito: ${buscarError.message}` });
        }

        if (itemExistente) {
            console.log('➕ Updating existing item quantity...');
            // Actualizar cantidad
            const nuevaCantidad = itemExistente.cantidad + parseInt(cantidad);

            const { error: actualizarError } = await supabase
                .from('detalles_pedido')
                .update({ cantidad: nuevaCantidad })
                .eq('id_detalle', itemExistente.id_detalle);

            if (actualizarError) {
                console.error('❌ Error updating quantity:', actualizarError);
                return res.status(500).json({ error: `Error al actualizar cantidad: ${actualizarError.message}` });
            }

            console.log('✅ Quantity updated to:', nuevaCantidad);
        } else {
            console.log('🆕 Creating new order detail...');
            // Crear nuevo detalle
            const { error: insertarError } = await supabase
                .from('detalles_pedido')
                .insert([{
                    id_pedido: id_pedido,
                    id_producto_servicio: id_paquete,
                    cantidad: parseInt(cantidad),
                    precio_unitario: parseFloat(precio_unitario),
                    descripcion: descripcion_breve || nombre_paquete
                }]);

            if (insertarError) {
                console.error('❌ Error inserting detail:', insertarError);
                return res.status(500).json({ error: `Error al agregar al carrito: ${insertarError.message}` });
            }

            console.log('✅ New detail created successfully');
        }

        // Recalcular total del pedido
        await recalcularTotalPedido(id_pedido);

        console.log('🎉 Product added to cart successfully!');

        res.setHeader('Content-Type', 'application/json');
        res.json({
            success: true,
            message: 'Producto agregado al carrito exitosamente!',
            id_pedido: id_pedido
        });

    } catch (error) {
        console.error('💥 Critical error in cart API:', error);
        res.setHeader('Content-Type', 'application/json');
        res.status(500).json({ error: `Error inesperado: ${error.message}` });
    }
});

// Función mejorada para recalcular total
async function recalcularTotalPedido(id_pedido) {
    try {
        console.log('🔢 Recalculando total para pedido:', id_pedido);

        const { data: detalles, error } = await supabase
            .from('detalles_pedido')
            .select('cantidad, precio_unitario')
            .eq('id_pedido', id_pedido);

        if (error) {
            console.error('❌ Error al obtener detalles para recalcular:', error);
            return;
        }

        let nuevoTotal = 0;
        detalles.forEach(item => {
            nuevoTotal += item.cantidad * item.precio_unitario;
        });

        console.log('💰 Nuevo total calculado:', nuevoTotal);

        const { error: updateError } = await supabase
            .from('pedido')
            .update({ total_pedido: nuevoTotal })
            .eq('id_pedido', id_pedido);

        if (updateError) {
            console.error('❌ Error al actualizar total del pedido:', updateError);
        } else {
            console.log('✅ Total del pedido actualizado exitosamente');
        }
    } catch (error) {
        console.error('💥 Error crítico al recalcular total:', error);
    }
}


// Route to render the payment page
app.get('/pago', isLogged, async (req, res) => {
    try {
        const userId = req.session.usuario_id;

        // Fetch the user's open order
        const { data: pedidoAbierto, error: pedidoError } = await supabase
            .from('pedido')
            .select('*')
            .eq('id_usuario', userId)
            .eq('estado', 'abierto')
            .single();

        if (pedidoError && pedidoError.code !== 'PGRST116') {
            console.error('❌ Error al buscar pedido para pago:', pedidoError);
            return res.render('pago', { session: req.session, cartItems: [], cartTotal: 0, error: 'Error al cargar los detalles del pago.' });
        }

        if (!pedidoAbierto) {
            return res.render('carrito', { session: req.session, cartItems: [], cartTotal: 0, error: 'No hay un pedido abierto para procesar.' });
        }

        const id_pedido = pedidoAbierto.id_pedido;

        // Fetch order details
        const { data: detallesPedido, error: detallesError } = await supabase
            .from('detalles_pedido')
            .select(`
                id_detalle,
                id_producto_servicio,
                cantidad,
                precio_unitario,
                descripcion,
                paquete:id_producto_servicio (
                    nombre_paquete
                )
            `)
            .eq('id_pedido', id_pedido);

        if (detallesError) {
            console.error('❌ Error al obtener detalles del pedido para pago:', detallesError);
            return res.render('pago', { session: req.session, cartItems: [], cartTotal: 0, error: 'Error al cargar los detalles del pago.' });
        }

        const cartItems = detallesPedido.map(detalle => ({
            id_detalle: detalle.id_detalle,
            nombre_paquete: detalle.paquete?.nombre_paquete || detalle.descripcion,
            precio_unitario: parseFloat(detalle.precio_unitario) || 0,
            cantidad: parseInt(detalle.cantidad) || 1,
            subtotal: (parseFloat(detalle.precio_unitario) || 0) * (parseInt(detalle.cantidad) || 1)
        }));

        res.render('pago', {
            session: req.session,
            cartItems: cartItems,
            cartTotal: pedidoAbierto.total_pedido || 0
        });

    } catch (error) {
        console.error('💥 Error en la ruta /pago:', error);
        res.status(500).render('error', { error: 'Ocurrió un error inesperado al cargar la página de pago.' });
    }
});


// API endpoint to process the payment
app.post('/api/procesar_pago', isLogged, async (req, res) => {
    const { dni, address, phone } = req.body;
    const userId = req.session.usuario_id;
    const userEmail = req.session.email_us; // Get user email from session

    if (!dni || !address || !phone) {
        return res.status(400).json({ error: 'Todos los campos de facturación son requeridos.' });
    }

    if (!/^\d{7,8}$/.test(dni)) {
        return res.status(400).json({ error: 'El DNI debe contener 7 u 8 dígitos numéricos.' });
    }
    
    if (!/^\d{10,}$/.test(phone)) {
        return res.status(400).json({ error: 'El teléfono debe contener al menos 10 dígitos numéricos.' });
    }

    try {
        // 1. Get the current open order for the user
        const { data: pedidoAbierto, error: pedidoError } = await supabase
            .from('pedido')
            .select('*')
            .eq('id_usuario', userId)
            .eq('estado', 'abierto')
            .single();

        if (pedidoError || !pedidoAbierto) {
            console.error('Error finding open order for payment:', pedidoError);
            return res.status(404).json({ error: 'No se encontró un pedido abierto para procesar el pago.' });
        }

        const id_pedido = pedidoAbierto.id_pedido;
        const total_pedido = pedidoAbierto.total_pedido;

        // 2. Fetch order details to include in the invoice
        const { data: detallesPedido, error: detallesError } = await supabase
            .from('detalles_pedido')
            .select(`
                cantidad,
                precio_unitario,
                descripcion,
                paquete:id_producto_servicio (
                    nombre_paquete
                )
            `)
            .eq('id_pedido', id_pedido);

        if (detallesError) {
            console.error('Error fetching order details for invoice:', detallesError);
            return res.status(500).json({ error: 'Error al obtener los detalles del pedido para la factura.' });
        }

        // 3. Update the order status to 'cerrado' (closed) and add billing info
        const { error: updateOrderError } = await supabase
            .from('pedido')
            .update({
                estado: 'cerrado',
                dni_facturacion: dni,
                direccion_facturacion: address,
                telefono_facturacion: phone,
                fecha_cierre: new Date().toISOString() // Or specific payment date
            })
            .eq('id_pedido', id_pedido);

        if (updateOrderError) {
            console.error('Error updating order status:', updateOrderError);
            return res.status(500).json({ error: 'Error al finalizar el pedido.' });
        }

        // 4. Generate invoice content
        let invoiceHtml = `
            <h1>Factura de Compra</h1>
            <p><strong>Pedido ID:</strong> ${id_pedido}</p>
            <p><strong>Fecha de Compra:</strong> ${new Date().toLocaleDateString('es-AR')}</p>
            <p><strong>Cliente:</strong> ${req.session.nombre_us} ${req.session.apellido_us}</p>
            <p><strong>Email:</strong> ${req.session.email_us}</p>
            <p><strong>DNI:</strong> ${dni}</p>
            <p><strong>Dirección de Facturación:</strong> ${address}</p>
            <p><strong>Teléfono:</strong> ${phone}</p>
            <hr>
            <h2>Detalles del Pedido:</h2>
            <table border="1" cellpadding="5" cellspacing="0" style="width:100%;">
                <thead>
                    <tr>
                        <th>Descripción</th>
                        <th>Cantidad</th>
                        <th>Precio Unitario</th>
                        <th>Subtotal</th>
                    </tr>
                </thead>
                <tbody>
        `;

        detallesPedido.forEach(item => {
            const itemName = item.paquete?.nombre_paquete || item.descripcion;
            invoiceHtml += `
                <tr>
                    <td>${itemName}</td>
                    <td>${item.cantidad}</td>
                    <td>$${parseFloat(item.precio_unitario).toFixed(2)}</td>
                    <td>$${(item.cantidad * parseFloat(item.precio_unitario)).toFixed(2)}</td>
                </tr>
            `;
        });

        invoiceHtml += `
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="3" style="text-align:right;"><strong>Total:</strong></td>
                        <td><strong>$${total_pedido.toFixed(2)}</strong></td>
                    </tr>
                </tfoot>
            </table>
            <p>¡Gracias por tu compra!</p>
        `;

        // 5. Send email with invoice
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST, // e.g., 'smtp.gmail.com'
            port: process.env.EMAIL_PORT, // e.g., 587 or 465
            secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
            auth: {
                user: process.env.EMAIL_USER, // Your email address
                pass: process.env.EMAIL_PASS, // Your email password or app-specific password
            },
        });

        const mailOptions = {
            from: process.env.EMAIL_USER, // Sender address
            to: userEmail, // List of recipients
            subject: 'Confirmación de Compra y Factura - TravelPortal',
            html: invoiceHtml,
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
                // Don't block the user, just log the error
            } else {
                console.log('Email sent: ' + info.response);
            }
        });

        res.json({ success: true, message: 'Pago procesado y factura enviada a su correo.' });

    } catch (error) {
        console.error('💥 Error en /api/procesar_pago:', error);
        res.status(500).json({ error: 'Error interno del servidor al procesar el pago.' });
    }
});

// Route for payment confirmation page
app.get('/confirmacion_pago', (req, res) => {
    res.render('confirmacion_pago', { session: req.session });
});


app.use('/Scripts', express.static(path.join(__dirname, '../Client/Scripts')));
app.use('/administrador', express.static(path.join(__dirname, '../Client')));

app.use((err, req, res, next) => {
    console.error('💥 Unhandled error:', err);

    if (req.path.startsWith('/api/')) {
        res.status(500).json({ error: 'Error interno del servidor' });
    } else {
        res.status(500).render('error', { error: 'Error interno del servidor' });
    }
});

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