document.addEventListener('DOMContentLoaded', function() {
    const tabs = document.querySelectorAll('.tab');
    const sections = document.querySelectorAll('.tab-content');

    // Hide all sections except the first one initially
    sections.forEach((section, index) => {
        if (index !== 0) {
            section.style.display = 'none';
        }
    });

    // Add click event listener to each tab
    tabs.forEach((tab, index) => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs
            tabs.forEach(t => t.classList.remove('active'));
            
            // Add active class to clicked tab
            tab.classList.add('active');
            
            // Hide all sections
            sections.forEach(section => {
                section.style.display = 'none';
            });
            
            // Show the corresponding section
            sections[index].style.display = 'block';
        });
    });
});

// Configuración de Supabase
const SUPABASE_URL = 'https://cjbuooeejxisjdxgqgok.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqYnVvb2Vlanhpc2pkeGdxZ29rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2NzUyOTcsImV4cCI6MjA2NTI1MTI5N30.P2KPoqAFfxUQ4XB5x1LhCLNeS3fIJMHES_fi5ouQ5QQ'; // Reemplazar con tu API key

// Inicializar el cliente de Supabase
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Función para mostrar mensajes al usuario
function mostrarMensaje(mensaje, tipo = 'info') {
    const mensajeDiv = document.createElement('div');
    mensajeDiv.className = `mensaje ${tipo}`;
    mensajeDiv.textContent = mensaje;
    document.body.appendChild(mensajeDiv);
    
    setTimeout(() => {
        mensajeDiv.remove();
    }, 5000);
}

// Función para manejar el envío del formulario
document.getElementById('productForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const tipoProducto = formData.get('tipo_producto');
    
    try {
        mostrarMensaje('Enviando datos a la base de datos...', 'info');
        console.log('Datos del formulario:', Object.fromEntries(formData));
        
        let response;
        
        switch(tipoProducto) {
            case 'paquete':
                response = await agregarPaquete(formData);
                break;
            case 'hotel':
                response = await agregarHotel(formData);
                break;
            case 'vuelo':
                response = await agregarVuelo(formData);
                break;
            case 'alquiler':
                response = await agregarAlquilerAuto(formData);
                break;
            default:
                throw new Error('Tipo de producto no válido');
        }
        
        if (response.error) {
            console.error('Error de Supabase:', response.error);
            throw new Error(response.error.message);
        }
        
        console.log('Respuesta de Supabase:', response);
        mostrarMensaje('Producto agregado exitosamente', 'success');
        e.target.reset();
        mostrarCamposEspecificos();
        cargarProductos();
        
    } catch (error) {
        console.error('Error completo:', error);
        mostrarMensaje('Error al agregar el producto: ' + error.message, 'error');
    }
});

// Función para agregar un paquete
async function agregarPaquete(formData) {
    const paqueteData = {
        nombre_paquete: formData.get('nombre'),
        descripcion: formData.get('descripcion'),
        precio_total: parseFloat(formData.get('precio')),
        fecha_inicio_validez: formData.get('fecha_inicio'),
        fecha_fin_validez: formData.get('fecha_fin'),
        tipo_viaje: formData.get('tipo_viaje'),
        Dias: parseInt(formData.get('dias')),
        Personas: parseInt(formData.get('personas')),
        descuento: parseInt(formData.get('descuento')),
        fecha_salida: formData.get('fecha_salida')
    };
    
    console.log('Datos del paquete a insertar:', paqueteData);
    const response = await supabaseClient
        .from('paquete')
        .insert([paqueteData])
        .select();
    
    console.log('Respuesta de inserción de paquete:', response);
    return response;
}

// Función para agregar un hotel
async function agregarHotel(formData) {
    const hotelData = {
        nombre: formData.get('nombre'),
        ciudad: formData.get('ciudad'),
        pais: formData.get('pais'),
        direccion: formData.get('direccion'),
        categoria_estrellas: parseInt(formData.get('categoria_estrellas')),
        precio_noche: parseFloat(formData.get('precio_noche'))
    };
    
    console.log('Datos del hotel a insertar:', hotelData);
    const response = await supabaseClient
        .from('hotel')
        .insert([hotelData])
        .select();
    
    console.log('Respuesta de inserción de hotel:', response);
    return response;
}

// Función para agregar un vuelo
async function agregarVuelo(formData) {
    const vueloData = {
        numero_vuelo: formData.get('numero_vuelo'),
        aerolinea: formData.get('aerolinea'),
        ciudad_origen: formData.get('ciudad_origen'),
        ciudad_destino: formData.get('ciudad_destino'),
        fecha_salida: formData.get('fecha_salida_vuelo'),
        fecha_llegada: formData.get('fecha_llegada'),
        precio_base: parseFloat(formData.get('precio')),
        clase_vuelo: formData.get('clase_vuelo')
    };
    
    console.log('Datos del vuelo a insertar:', vueloData);
    const response = await supabaseClient
        .from('vuelo')
        .insert([vueloData])
        .select();
    
    console.log('Respuesta de inserción de vuelo:', response);
    return response;
}

// Función para agregar un alquiler de auto
async function agregarAlquilerAuto(formData) {
    const alquilerData = {
        marca: formData.get('marca'),
        modelo: formData.get('modelo'),
        tipo_vehiculo: formData.get('tipo_vehiculo'),
        ubicacion_recogida: formData.get('ubicacion_recogida'),
        ubicacion_devolucion: formData.get('ubicacion_devolucion'),
        precio_total: parseFloat(formData.get('precio'))
    };
    
    console.log('Datos del alquiler a insertar:', alquilerData);
    const response = await supabaseClient
        .from('alquiler_auto')
        .insert([alquilerData])
        .select();
    
    console.log('Respuesta de inserción de alquiler:', response);
    return response;
}

// Función para cargar los productos existentes
async function cargarProductos() {
    try {
        // Cargar paquetes
        const { data: paquetes, error: errorPaquetes } = await supabaseClient
            .from('paquete')
            .select('*');
            
        if (errorPaquetes) throw errorPaquetes;
        
        // Cargar hoteles
        const { data: hoteles, error: errorHoteles } = await supabaseClient
            .from('hotel')
            .select('*');
            
        if (errorHoteles) throw errorHoteles;
        
        // Cargar vuelos
        const { data: vuelos, error: errorVuelos } = await supabaseClient
            .from('vuelo')
            .select('*');
            
        if (errorVuelos) throw errorVuelos;
        
        // Cargar alquileres
        const { data: alquileres, error: errorAlquileres } = await supabaseClient
            .from('alquiler_auto')
            .select('*');
            
        if (errorAlquileres) throw errorAlquileres;
        
        // Actualizar la tabla con todos los productos
        actualizarTablaProductos([...paquetes, ...hoteles, ...vuelos, ...alquileres]);
        
    } catch (error) {
        console.error('Error al cargar productos:', error);
        mostrarMensaje('Error al cargar los productos', 'error');
    }
}

// Función para actualizar la tabla de productos
function actualizarTablaProductos(productos) {
    const tbody = document.querySelector('table tbody');
    tbody.innerHTML = '';
    
    productos.forEach(producto => {
        const tr = document.createElement('tr');
        
        // Determinar el tipo de producto y sus campos específicos
        let nombre, categoria, precio;
        
        if ('nombre_paquete' in producto) {
            nombre = producto.nombre_paquete;
            categoria = 'Paquete';
            precio = producto.precio_total;
        } else if ('nombre' in producto) {
            nombre = producto.nombre;
            categoria = 'Hotel';
            precio = producto.precio_noche;
        } else if ('numero_vuelo' in producto) {
            nombre = producto.numero_vuelo;
            categoria = 'Vuelo';
            precio = producto.precio_base;
        } else {
            nombre = `${producto.marca} ${producto.modelo}`;
            categoria = 'Alquiler';
            precio = producto.precio_total;
        }
        
        tr.innerHTML = `
            <td>
                <label class="checkbox-container">
                    <input type="checkbox">
                    <span class="checkmark"></span>
                </label>
            </td>
            <td>
                <div class="product-info">
                    <h4>${nombre}</h4>
                    <span class="product-id">#${producto.id || producto.id_paquete || producto.id_hotel || producto.id_vuelo || producto.id_alquiler_auto}</span>
                </div>
            </td>
            <td>
                <span class="category-badge ${categoria.toLowerCase()}">${categoria}</span>
            </td>
            <td>
                <div class="price-info">
                    <span class="current-price">$${precio}</span>
                </div>
            </td>
            <td>
                <span class="status-badge active">Activo</span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn-editar" onclick="editarProducto('${producto.id || producto.id_paquete || producto.id_hotel || producto.id_vuelo || producto.id_alquiler_auto}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-eliminar" onclick="eliminarProducto('${producto.id || producto.id_paquete || producto.id_hotel || producto.id_vuelo || producto.id_alquiler_auto}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        
        tbody.appendChild(tr);
    });
}

// Cargar productos al iniciar la página
document.addEventListener('DOMContentLoaded', cargarProductos); 