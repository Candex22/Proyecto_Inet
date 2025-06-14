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
    console.log('🔐 Checking authentication...');
    console.log('🔐 Session user:', req.session.user_sesion);
    console.log('🔐 User ID:', req.session.usuario_id);
    
    if (!req.session.user_sesion || !req.session.usuario_id) {
        console.log('❌ User not authenticated');
        
        // Check if it's an API request
        if (req.path.startsWith('/api/')) {
            // For API routes, return JSON error instead of redirect
            return res.status(401).json({ error: 'Usuario no autenticado. Por favor, inicia sesión.' });
        } else {
            // For regular routes, redirect to login
            return res.redirect('/login');
        }
    } else {
        console.log('✅ User authenticated');
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

app.get('/logout', (req, res) => {
    // Destruir la sesión
    req.session.destroy((err) => {
        if (err) {
            console.error('Error al cerrar sesión:', err);
            return res.redirect('/index');
        }
        // Limpiar la cookie de sesión
        res.clearCookie('connect.sid');
        // Redirigir al login
        res.redirect('/login');
    });
});

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


// Ruta para mostrar el carrito
app.get('/carrito', isLogged, async (req, res) => {
    try {
        const userId = req.session.usuario_id;
        console.log('🛒 Loading cart for user:', userId);

        if (!userId) {
            return res.redirect('/login');
        }

        // Search for open order (cart) for the user
        let { data: pedidoAbierto, error: pedidoError } = await supabase
            .from('pedido')
            .select('*')
            .eq('id_usuario', userId)
            .eq('estado', 'abierto')
            .limit(1);

        if (pedidoError) {
            console.error('Error al buscar pedido:', pedidoError);
            return res.render('carrito', { 
                session: req.session, 
                cartItems: [], 
                cartTotal: 0 
            });
        }

        let cartItems = [];
        let cartTotal = 0;

        if (pedidoAbierto && pedidoAbierto.length > 0) {
            const id_pedido = pedidoAbierto[0].id_pedido;

            // Get order details with package information
            let { data: detallesPedido, error: detallesError } = await supabase
                .from('detalles_pedido')
                .select(`
                    id_detalle,
                    id_producto_servicio,
                    cantidad,
                    precio_unitario,
                    descripcion
                `)
                .eq('id_pedido', id_pedido);

            if (detallesError) {
                console.error('Error al obtener detalles del pedido:', detallesError);
            } else {
                // For each detail, get additional package information
                for (let detalle of detallesPedido) {
                    const { data: paqueteInfo, error: paqueteError } = await supabase
                        .from('paquete')
                        .select('nombre_paquete, descripcion')
                        .eq('id_paquete', detalle.id_producto_servicio)
                        .limit(1);

                    if (!paqueteError && paqueteInfo && paqueteInfo.length > 0) {
                        cartItems.push({
                            id_detalle: detalle.id_detalle,
                            nombre_paquete: paqueteInfo[0].nombre_paquete,
                            descripcion: detalle.descripcion || paqueteInfo[0].descripcion,
                            precio_unitario: detalle.precio_unitario,
                            cantidad: detalle.cantidad,
                            imagen_url: null // Add if you have images
                        });
                        
                        cartTotal += detalle.cantidad * detalle.precio_unitario;
                    }
                }
            }
        }

        res.render('carrito', { 
            session: req.session, 
            cartItems: cartItems, 
            cartTotal: cartTotal 
        });

    } catch (error) {
        console.error('Error en ruta /carrito:', error);
        res.render('carrito', { 
            session: req.session, 
            cartItems: [], 
            cartTotal: 0 
        });
    }
});

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

        // Search for open order (cart) for the user
        let { data: pedidoAbierto, error: pedidoError } = await supabase
            .from('pedido')
            .select('*')
            .eq('id_usuario', userId)
            .eq('estado', 'abierto')
            .limit(1);

        if (pedidoError) {
            console.error('❌ Error searching for order:', pedidoError);
            return res.status(500).json({ error: `Error al buscar pedido: ${pedidoError.message}` });
        }

        console.log('📋 Found orders:', pedidoAbierto?.length || 0);

        let id_pedido;

        if (!pedidoAbierto || pedidoAbierto.length === 0) {
            console.log('🆕 Creating new order...');
            
            // Create new order
            const { data: nuevoPedido, error: crearError } = await supabase
                .from('pedido')
                .insert([{
                    id_usuario: userId,
                    fecha_pedido: new Date().toISOString(),
                    estado: 'abierto',
                    total_pedido: 0
                }])
                .select();

            if (crearError) {
                console.error('❌ Error creating order:', crearError);
                return res.status(500).json({ error: `Error al crear pedido: ${crearError.message}` });
            }

            console.log('✅ New order created:', nuevoPedido[0]);
            id_pedido = nuevoPedido[0].id_pedido;
        } else {
            id_pedido = pedidoAbierto[0].id_pedido;
            console.log('📋 Using existing order:', id_pedido);
        }

        // Check if product already exists in cart
        const { data: itemExistente, error: buscarError } = await supabase
            .from('detalles_pedido')
            .select('*')
            .eq('id_pedido', id_pedido)
            .eq('id_producto_servicio', id_paquete)
            .limit(1);

        if (buscarError) {
            console.error('❌ Error searching existing item:', buscarError);
            return res.status(500).json({ error: `Error al verificar carrito: ${buscarError.message}` });
        }

        if (itemExistente && itemExistente.length > 0) {
            console.log('➕ Updating existing item quantity...');
            // Update quantity
            const nuevaCantidad = itemExistente[0].cantidad + parseInt(cantidad);
            
            const { error: actualizarError } = await supabase
                .from('detalles_pedido')
                .update({ cantidad: nuevaCantidad })
                .eq('id_detalle', itemExistente[0].id_detalle);

            if (actualizarError) {
                console.error('❌ Error updating quantity:', actualizarError);
                return res.status(500).json({ error: `Error al actualizar cantidad: ${actualizarError.message}` });
            }
            
            console.log('✅ Quantity updated to:', nuevaCantidad);
        } else {
            console.log('🆕 Creating new order detail...');
            // Create new detail
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

        // Recalculate order total
        await recalcularTotalPedido(id_pedido);

        console.log('🎉 Product added to cart successfully!');
        
        // CRITICAL: Ensure we return JSON response
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

// Enhanced recalcularTotalPedido function with better error handling
async function recalcularTotalPedido(id_pedido) {
    try {
        console.log('🧮 Recalculando total para pedido:', id_pedido);
        
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
            console.log(`✅ Total del pedido ${id_pedido} actualizado a: $${nuevoTotal}`);
        }
    } catch (error) {
        console.error('💥 Error crítico al recalcular total:', error);
    }
}


// Ruta para actualizar cantidad en el carrito
app.post('/api/actualizar_cantidad_carrito', isLogged, async (req, res) => {
    try {
        const { id_detalle, cambio } = req.body;
        const userId = req.session.usuario_id;

        if (!id_detalle || !cambio) {
            return res.status(400).json({ error: 'Datos incompletos.' });
        }

        // Obtener el detalle actual
        const { data: detalleActual, error: getError } = await supabase
            .from('detalles_pedido')
            .select('cantidad, id_pedido')
            .eq('id_detalle', id_detalle)
            .limit(1);

        if (getError || !detalleActual || detalleActual.length === 0) {
            return res.status(404).json({ error: 'Item no encontrado.' });
        }

        const nuevaCantidad = detalleActual[0].cantidad + parseInt(cambio);

        if (nuevaCantidad < 1) {
            return res.status(400).json({ error: 'La cantidad no puede ser menor a 1.' });
        }

        // Actualizar la cantidad
        const { error: updateError } = await supabase
            .from('detalles_pedido')
            .update({ cantidad: nuevaCantidad })
            .eq('id_detalle', id_detalle);

        if (updateError) {
            console.error('Error al actualizar cantidad:', updateError);
            return res.status(500).json({ error: 'Error al actualizar la cantidad.' });
        }

        // Recalcular total del pedido
        await recalcularTotalPedido(detalleActual[0].id_pedido);

        res.json({ message: 'Cantidad actualizada exitosamente.', nueva_cantidad: nuevaCantidad });

    } catch (error) {
        console.error('Error en actualizar cantidad:', error);
        res.status(500).json({ error: 'Error inesperado.' });
    }
});

// Ruta para eliminar item del carrito
app.post('/api/eliminar_item_carrito', isLogged, async (req, res) => {
    try {
        const { id_detalle } = req.body;

        if (!id_detalle) {
            return res.status(400).json({ error: 'ID de detalle requerido.' });
        }

        // Obtener el id_pedido antes de eliminar
        const { data: detalleInfo, error: getError } = await supabase
            .from('detalles_pedido')
            .select('id_pedido')
            .eq('id_detalle', id_detalle)
            .limit(1);

        if (getError || !detalleInfo || detalleInfo.length === 0) {
            return res.status(404).json({ error: 'Item no encontrado.' });
        }

        const id_pedido = detalleInfo[0].id_pedido;

        // Eliminar el item
        const { error: deleteError } = await supabase
            .from('detalles_pedido')
            .delete()
            .eq('id_detalle', id_detalle);

        if (deleteError) {
            console.error('Error al eliminar item:', deleteError);
            return res.status(500).json({ error: 'Error al eliminar el item.' });
        }

        // Recalcular total del pedido
        await recalcularTotalPedido(id_pedido);

        res.json({ message: 'Item eliminado exitosamente.' });

    } catch (error) {
        console.error('Error en eliminar item:', error);
        res.status(500).json({ error: 'Error inesperado.' });
    }
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
