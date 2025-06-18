document.addEventListener('DOMContentLoaded', function () {
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
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqYnVvb2Vlanhpc2pkeGdxZ29rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2NzUyOTcsImV4cCI6MjA2NTI1MTI5N30.P2KPoqAFfxUQ4XB5x1LhCLNeS3fIJMHES_fi5ouQ5QQ';

// Inicializar el cliente de Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

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
    const editId = e.target.dataset.editId;
    const editType = e.target.dataset.editType;

    try {
        mostrarMensaje('Procesando datos...', 'info');
        console.log('Datos del formulario:', Object.fromEntries(formData));

        let response;

        if (editId) {
            // Actualizar producto existente
            switch (editType) {
                case 'paquete':
                    response = await actualizarPaquete(editId, formData);
                    break;
                case 'hotel':
                    response = await actualizarHotel(editId, formData);
                    break;
                case 'vuelo':
                    response = await actualizarVuelo(editId, formData);
                    break;
                case 'alquiler':
                    response = await actualizarAlquilerAuto(editId, formData);
                    break;
            }
        } else {
            // Agregar nuevo producto
            switch (tipoProducto) {
                case 'paquete':
                    response = await agregarPaquete(formData);
                    break;
                case 'hotel':
                    response = await agregarHotel(formData);
                    break;
                case 'vuelo':
                    response = await agregarVuelo(formData);
                    break;
                case 'alquiler_auto':
                    response = await agregarAlquilerAuto(formData);
                    break;
                default:
                    throw new Error('Tipo de producto no válido');
            }
        }

        if (response.error) {
            console.error('Error de Supabase:', response.error);
            throw new Error(response.error.message);
        }

        console.log('Respuesta de Supabase:', response);
        mostrarMensaje(editId ? 'Producto actualizado exitosamente' : 'Producto agregado exitosamente', 'success');

        // Limpiar el formulario y resetear el estado
        e.target.reset();
        delete e.target.dataset.editId;
        delete e.target.dataset.editType;
        mostrarCamposEspecificos();

        // Restaurar el texto del botón de guardar
        const submitButton = document.querySelector('.btn-primary');
        submitButton.innerHTML = '<i class="fas fa-save"></i> Guardar Producto';

        // Recargar la tabla
        cargarProductos();

    } catch (error) {
        console.error('Error completo:', error);
        mostrarMensaje('Error al procesar el producto: ' + error.message, 'error');
    }
});

// Función para agregar un paquete
async function agregarPaquete(formData, res) { // Asegúrate de pasar 'res' si lo necesitas para renderizar vistas

    try {
        const hotel_id = formData.get('hotel_id');
        const vuelo_id = formData.get('vuelo_id');

        // Validar datos de entrada básicos
        if (!formData.get('nombre') || !formData.get('descripcion') || !formData.get('precio')) {
            throw new Error('Datos del paquete incompletos. Nombre, descripción y precio son obligatorios.');
        }

        const paqueteData = {
            nombre_paquete: formData.get('nombre'),
            descripcion: formData.get('descripcion'),
            precio_total: parseFloat(formData.get('precio')),
            fecha_inicio_validez: formData.get('fecha_inicio'),
            fecha_fin_validez: formData.get('fecha_fin'),
            tipo_viaje: formData.get('tipo_viaje'),
            Dias: parseInt(formData.get('dias')),
            Personas: parseInt(formData.get('personas')),
            descripcion_amplia: formData.get('descripcion_amplia'),
            descuento: parseInt(formData.get('descuento')),
            fecha_salida: formData.get('fecha_salida')
        };

        // Validar si los números son válidos después de la conversión
        if (isNaN(paqueteData.precio_total) || isNaN(paqueteData.Dias) || isNaN(paqueteData.Personas) || isNaN(paqueteData.descuento)) {
            throw new Error('Algunos valores numéricos del paquete no son válidos.');
        }

        console.log('Datos del paquete a insertar:', paqueteData);

        // 1. Insertar el paquete principal
        const { data: paquete, error: paqueteError } = await supabase
            .from('paquete')
            .insert([paqueteData])
            .select();

        if (paqueteError) {
            console.error('❌ Error Supabase al insertar el paquete:', paqueteError);
            if (Object.keys(paqueteError).length === 0) {
                console.error('El objeto de error de Supabase (paquete) está vacío. Posiblemente un problema de RLS o permisos de API Key.');
            }
            throw new Error('Error al guardar la información del paquete.');
        }

        if (!paquete || paquete.length === 0) {
            throw new Error('El paquete no fue devuelto después de la inserción.');
        }

        const id_paquete_creado = paquete[0].id_paquete;

        // 2. Obtener datos del hotel y agregar componente si hotel_id existe
        if (hotel_id) {
            const { data: hotel_data, error: hotelDataError } = await supabase
                .from('hotel')
                .select("*")
                .eq('id_hotel', hotel_id);

            if (hotelDataError) {
                console.error('❌ Error Supabase al obtener datos del hotel:', hotelDataError);
                // Considerar si revertir la inserción del paquete si esto falla críticamente
                throw new Error('Error al obtener los detalles del hotel.');
            }

            if (!hotel_data || hotel_data.length === 0) {
                throw new Error('Hotel no encontrado con el ID proporcionado.');
            }

            const hotelComponentData = {
                id_paquete: id_paquete_creado,
                id_componente: hotel_data[0].id_hotel,
                tipo_componente: "Hotel",
                // Asegúrate de que precio_total exista en tu tabla hotel si lo usas aquí
                // Si es precio_noche, el nombre debe coincidir con la base de datos
                precio: hotel_data[0].precio_noche || 0, // Usar precio_noche de la tabla hotel
            };

            const { error: insertHotelComponentError } = await supabase
                .from('paquete_componentes')
                .insert([hotelComponentData])
                .select();

            if (insertHotelComponentError) {
                console.error('❌ Error Supabase al insertar componente de hotel:', insertHotelComponentError);
                // Aquí podrías decidir si quieres eliminar el paquete y/o otros componentes si esto falla
                throw new Error('Error al asociar el hotel al paquete.');
            }
        }

        // 3. Obtener datos del vuelo y agregar componente si vuelo_id existe
        // El código original no incluye la inserción del componente de vuelo. Lo añadiré aquí.
        if (vuelo_id) {
            const { data: vuelo_data, error: vueloDataError } = await supabase
                .from('vuelo')
                .select("*")
                .eq('id_vuelo', vuelo_id);

            if (vueloDataError) {
                console.error('❌ Error Supabase al obtener datos del vuelo:', vueloDataError);
                throw new Error('Error al obtener los detalles del vuelo.');
            }

            if (!vuelo_data || vuelo_data.length === 0) {
                throw new Error('Vuelo no encontrado con el ID proporcionado.');
            }

            const vueloComponentData = {
                id_paquete: id_paquete_creado,
                id_componente: vuelo_data[0].id_vuelo,
                tipo_componente: "Vuelo",
                precio: vuelo_data[0].precio_base || 0, // Usar precio_base de la tabla vuelo
            };

            const { error: insertVueloComponentError } = await supabase
                .from('paquete_componentes')
                .insert([vueloComponentData])
                .select();

            if (insertVueloComponentError) {
                console.error('❌ Error Supabase al insertar componente de vuelo:', insertVueloComponentError);
                throw new Error('Error al asociar el vuelo al paquete.');
            }
        }

        // Si todo fue exitoso
        return { success: true, message: 'Paquete agregado exitosamente', paqueteId: id_paquete_creado };

    } catch (error) {
        console.error('💥 Error en la función agregarPaquete:', error.message);
        // Si 'res' es pasado a la función, se puede usar para renderizar o enviar una respuesta de error.
        if (res) {
            return res.render('administrador.ejs', { error: error.message || 'Error desconocido al agregar el paquete.' });
        }
        return { success: false, error: error.message || 'Error desconocido al agregar el paquete.' };
    }
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
    const response = await supabase
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
    const response = await supabase
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
    const response = await supabase
        .from('alquiler_auto')
        .insert([alquilerData])
        .select();

    console.log('Respuesta de inserción de alquiler:', response);
    return response;
}

// Función para cargar los productos existentes
async function cargarProductos() {
    try {
        console.log('Iniciando carga de productos...');

        // Cargar paquetes
        const { data: paquetes, error: errorPaquetes } = await supabase
            .from('paquete')
            .select('*');

        if (errorPaquetes) {
            console.error('Error al cargar paquetes:', errorPaquetes);
            throw errorPaquetes;
        }
        console.log('Paquetes cargados:', paquetes);

        // Cargar hoteles
        const { data: hoteles, error: errorHoteles } = await supabase
            .from('hotel')
            .select('*');

        if (errorHoteles) {
            console.error('Error al cargar hoteles:', errorHoteles);
            throw errorHoteles;
        }
        console.log('Hoteles cargados:', hoteles);

        // Cargar vuelos
        const { data: vuelos, error: errorVuelos } = await supabase
            .from('vuelo')
            .select('*');

        if (errorVuelos) {
            console.error('Error al cargar vuelos:', errorVuelos);
            throw errorVuelos;
        }
        console.log('Vuelos cargados:', vuelos);

        // Cargar alquileres
        const { data: alquileres, error: errorAlquileres } = await supabase
            .from('alquiler_auto')
            .select('*');

        if (errorAlquileres) {
            console.error('Error al cargar alquileres:', errorAlquileres);
            throw errorAlquileres;
        }
        console.log('Alquileres cargados:', alquileres);

        // Actualizar la tabla con todos los productos
        const todosLosProductos = [
            ...(paquetes || []),
            ...(hoteles || []),
            ...(vuelos || []),
            ...(alquileres || [])
        ];

        console.log('Total de productos a mostrar:', todosLosProductos.length);
        actualizarTablaProductos(todosLosProductos);

    } catch (error) {
        console.error('Error al cargar productos:', error);
        mostrarMensaje('Error al cargar los productos: ' + error.message, 'error');
    }
}

// Función para actualizar la tabla de productos
function actualizarTablaProductos(productos) {
    console.log('Actualizando tabla con productos:', productos);
    const tbody = document.querySelector('.table-responsive table tbody');

    if (!tbody) {
        console.error('No se encontró el elemento tbody en la tabla');
        return;
    }

    tbody.innerHTML = '';

    if (!productos || productos.length === 0) {
        console.log('No hay productos para mostrar');
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center;">
                    No hay productos disponibles
                </td>
            </tr>
        `;
        return;
    }

    productos.forEach(producto => {
        let nombre, categoria, precio, id, tipo;

        if ('nombre_paquete' in producto) {
            nombre = producto.nombre_paquete;
            categoria = 'Paquete';
            precio = producto.precio_total;
            id = producto.id_paquete;
            tipo = 'paquete';
        } else if ('nombre' in producto && 'precio_noche' in producto) {
            nombre = producto.nombre;
            categoria = 'Hotel';
            precio = producto.precio_noche;
            id = producto.id_hotel;
            tipo = 'hotel';
        } else if ('numero_vuelo' in producto) {
            nombre = producto.numero_vuelo;
            categoria = 'Vuelo';
            precio = producto.precio_base;
            id = producto.id_vuelo;
            tipo = 'vuelo';
        } else {
            nombre = `${producto.marca} ${producto.modelo}`;
            categoria = 'Alquiler';
            precio = producto.precio_total;
            id = producto.id_alquiler_auto;
            tipo = 'alquiler_auto';
        }

        const tr = document.createElement('tr');
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
                    <span class="product-id">#${id}</span>
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
                    <button class="btn-editar" onclick="editarProducto('${id}', '${tipo}')" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-eliminar" onclick="eliminarProducto('${id}', '${tipo}')" title="Eliminar">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                    <button class="btn-view" onclick="verProducto('${id}', '${tipo}')" title="Vista previa">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
            </td>
        `;

        tbody.appendChild(tr);
    });
}

// Cargar productos al iniciar la página
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM cargado, iniciando carga de productos...');
    cargarProductos();
});

// Función para editar un producto
async function editarProducto(id, tipo) {
    try {
        // Obtener los datos del producto
        const { data: producto, error } = await supabase
            .from(tipo)
            .select('*')
            .eq('id_' + tipo, id)
            .single();

        if (error) throw error;

        // Llenar el formulario con los datos del producto
        document.getElementById('tipo_producto').value = tipo;
        mostrarCamposEspecificos();

        // Llenar campos comunes
        document.getElementById('nombre').value = producto.nombre || producto.nombre_paquete || producto.numero_vuelo || `${producto.marca} ${producto.modelo}`;
        document.getElementById('precio').value = producto.precio_total || producto.precio_noche || producto.precio_base;

        // Llenar campos específicos según el tipo
        switch (tipo) {
            case 'paquete':
                document.getElementById('descripcion').value = producto.descripcion || '';
                document.getElementById('fecha_inicio').value = producto.fecha_inicio_validez || '';
                document.getElementById('fecha_fin').value = producto.fecha_fin_validez || '';
                document.getElementById('tipo_viaje').value = producto.tipo_viaje || '';
                document.getElementById('dias').value = producto.Dias || '';
                document.getElementById('descripcion_amplia').value = producto.descripcion_amplia || '';
                document.getElementById('personas').value = producto.Personas || '';
                document.getElementById('descuento').value = producto.descuento || '';
                document.getElementById('fecha_salida').value = producto.fecha_salida || '';
                break;
            case 'hotel':
                document.getElementById('ciudad').value = producto.ciudad || '';
                document.getElementById('pais').value = producto.pais || '';
                document.getElementById('direccion').value = producto.direccion || '';
                document.getElementById('categoria_estrellas').value = producto.categoria_estrellas || '';
                document.getElementById('precio_noche').value = producto.precio_noche || '';
                break;
            case 'vuelo':
                document.getElementById('numero_vuelo').value = producto.numero_vuelo || '';
                document.getElementById('aerolinea').value = producto.aerolinea || '';
                document.getElementById('ciudad_origen').value = producto.ciudad_origen || '';
                document.getElementById('ciudad_destino').value = producto.ciudad_destino || '';
                document.getElementById('fecha_salida_vuelo').value = producto.fecha_salida || '';
                document.getElementById('fecha_llegada').value = producto.fecha_llegada || '';
                document.getElementById('clase_vuelo').value = producto.clase_vuelo || '';
                break;
            case 'alquiler_auto':
                document.getElementById('marca').value = producto.marca || '';
                document.getElementById('modelo').value = producto.modelo || '';
                document.getElementById('tipo_vehiculo').value = producto.tipo_vehiculo || '';
                document.getElementById('ubicacion_recogida').value = producto.ubicacion_recogida || '';
                document.getElementById('ubicacion_devolucion').value = producto.ubicacion_devolucion || '';
                break;
        }

        // Cambiar el texto del botón de guardar
        const submitButton = document.querySelector('.btn-primary');
        submitButton.innerHTML = '<i class="fas fa-save"></i> Actualizar Producto';

        // Agregar el ID del producto al formulario para la actualización
        const form = document.getElementById('productForm');
        form.dataset.editId = id;
        form.dataset.editType = tipo;

        // Hacer scroll al formulario
        form.scrollIntoView({ behavior: 'smooth' });

    } catch (error) {
        console.error('Error al cargar datos del producto:', error);
        mostrarMensaje('Error al cargar los datos del producto: ' + error.message, 'error');
    }
}

// Función para eliminar un producto
async function eliminarProducto(id, tipo) {
    try {
        if (!id || !tipo) {
            throw new Error('ID o tipo de producto no válido');
        }

        let tabla, idField;
        if (tipo === 'paquete') {
            tabla = 'paquete';
            idField = 'id_paquete';
        } else if (tipo === 'hotel') {
            tabla = 'hotel';
            idField = 'id_hotel';
        } else if (tipo === 'vuelo') {
            tabla = 'vuelo';
            idField = 'id_vuelo';
        } else if (tipo === 'alquiler_auto') {
            tabla = 'alquiler_auto';
            idField = 'id_alquiler_auto';
        } else {
            throw new Error('Tipo de producto no reconocido');
        }

        if (confirm('¿Estás seguro de que deseas eliminar este producto?')) {
            const { error } = await supabase
                .from(tabla)
                .delete()
                .eq(idField, id);

            if (error) {
                throw error;
            }

            mostrarMensaje('Producto eliminado exitosamente', 'success');
            cargarProductos(); // Recargar la tabla
        }
    } catch (error) {
        mostrarMensaje('Error al eliminar el producto: ' + error.message, 'error');
    }
}

// Función para ver un producto
async function verProducto(id, tipo) {
    try {
        // Obtener los datos del producto
        const { data: producto, error } = await supabase
            .from(tipo)
            .select('*')
            .eq('id_' + tipo, id)
            .single();

        if (error) throw error;

        // Crear el contenido del modal
        let detallesHTML = '<div class="producto-detalles">';
        detallesHTML += `<h3>Detalles del ${tipo.charAt(0).toUpperCase() + tipo.slice(1)}</h3>`;

        // Agregar los detalles según el tipo de producto
        switch (tipo) {
            case 'paquete':
                detallesHTML += `
                    <p><strong>Nombre:</strong> ${producto.nombre_paquete}</p>
                    <p><strong>Descripción:</strong> ${producto.descripcion}</p>
                    <p><strong>Precio:</strong> $${producto.precio_total}</p>
                    <p><strong>Días:</strong> ${producto.Dias}</p>
                    <p><strong>Personas:</strong> ${producto.Personas}</p>
                    <p><strong>Tipo de Viaje:</strong> ${producto.tipo_viaje}</p>
                    <p><strong>Descuento:</strong> ${producto.descuento}%</p>
                    <p><strong>Fecha de Salida:</strong> ${producto.fecha_salida}</p>
                `;
                break;
            case 'hotel':
                detallesHTML += `
                    <p><strong>Nombre:</strong> ${producto.nombre}</p>
                    <p><strong>Ciudad:</strong> ${producto.ciudad}</p>
                    <p><strong>País:</strong> ${producto.pais}</p>
                    <p><strong>Dirección:</strong> ${producto.direccion}</p>
                    <p><strong>Categoría:</strong> ${producto.categoria_estrellas} estrellas</p>
                    <p><strong>Precio por Noche:</strong> $${producto.precio_noche}</p>
                `;
                break;
            case 'vuelo':
                detallesHTML += `
                    <p><strong>Número de Vuelo:</strong> ${producto.numero_vuelo}</p>
                    <p><strong>Aerolínea:</strong> ${producto.aerolinea}</p>
                    <p><strong>Origen:</strong> ${producto.ciudad_origen}</p>
                    <p><strong>Destino:</strong> ${producto.ciudad_destino}</p>
                    <p><strong>Fecha de Salida:</strong> ${producto.fecha_salida}</p>
                    <p><strong>Fecha de Llegada:</strong> ${producto.fecha_llegada}</p>
                    <p><strong>Clase:</strong> ${producto.clase_vuelo}</p>
                    <p><strong>Precio Base:</strong> $${producto.precio_base}</p>
                `;
                break;
            case 'alquiler_auto':
                detallesHTML += `
                    <p><strong>Marca:</strong> ${producto.marca}</p>
                    <p><strong>Modelo:</strong> ${producto.modelo}</p>
                    <p><strong>Tipo de Vehículo:</strong> ${producto.tipo_vehiculo}</p>
                    <p><strong>Ubicación de Recogida:</strong> ${producto.ubicacion_recogida}</p>
                    <p><strong>Ubicación de Devolución:</strong> ${producto.ubicacion_devolucion}</p>
                    <p><strong>Precio Total:</strong> $${producto.precio_total}</p>
                `;
                break;
        }

        detallesHTML += '</div>';

        // Crear y mostrar el modal
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close">&times;</span>
                ${detallesHTML}
            </div>
        `;

        document.body.appendChild(modal);

        // Agregar estilos al modal
        const style = document.createElement('style');
        style.textContent = `
            .modal {
                display: block;
                position: fixed;
                z-index: 1000;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0,0,0,0.5);
            }
            .modal-content {
                background-color: #fefefe;
                margin: 15% auto;
                padding: 20px;
                border: 1px solid #888;
                width: 80%;
                max-width: 600px;
                border-radius: 8px;
                position: relative;
            }
            .close {
                color: #aaa;
                float: right;
                font-size: 28px;
                font-weight: bold;
                cursor: pointer;
            }
            .close:hover {
                color: black;
            }
            .producto-detalles {
                margin-top: 20px;
            }
            .producto-detalles h3 {
                color: var(--Texto_principal);
                margin-bottom: 20px;
            }
            .producto-detalles p {
                margin: 10px 0;
                color: var(--Texto_secundario);
            }
            .producto-detalles strong {
                color: var(--Texto_principal);
            }
        `;
        document.head.appendChild(style);

        // Cerrar el modal
        const closeBtn = modal.querySelector('.close');
        closeBtn.onclick = function () {
            modal.remove();
            style.remove();
        }

        // Cerrar el modal al hacer clic fuera
        window.onclick = function (event) {
            if (event.target == modal) {
                modal.remove();
                style.remove();
            }
        }

    } catch (error) {
        console.error('Error al cargar detalles del producto:', error);
        mostrarMensaje('Error al cargar los detalles del producto: ' + error.message, 'error');
    }
}

// Función para mostrar/ocultar campos específicos según el tipo de producto
function mostrarCamposEspecificos() {
    const tipoProducto = document.getElementById('tipo_producto').value;

    // Ocultar todos los campos específicos primero
    document.getElementById('campos_paquete').style.display = 'none';
    document.getElementById('campos_hotel').style.display = 'none';
    document.getElementById('campos_vuelo').style.display = 'none';
    document.getElementById('campos_alquiler').style.display = 'none';

    // Mostrar los campos correspondientes al tipo seleccionado
    if (tipoProducto) {
        document.getElementById(`campos_${tipoProducto}`).style.display = 'block';
    }
}

// Funciones para actualizar productos
async function actualizarPaquete(id, formData) {
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

    return await supabase
        .from('paquete')
        .update(paqueteData)
        .eq('id_paquete', id)
        .select();
}

async function actualizarHotel(id, formData) {
    const hotelData = {
        nombre: formData.get('nombre'),
        ciudad: formData.get('ciudad'),
        pais: formData.get('pais'),
        direccion: formData.get('direccion'),
        categoria_estrellas: parseInt(formData.get('categoria_estrellas')),
        precio_noche: parseFloat(formData.get('precio_noche'))
    };

    return await supabase
        .from('hotel')
        .update(hotelData)
        .eq('id_hotel', id)
        .select();
}

async function actualizarVuelo(id, formData) {
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

    return await supabase
        .from('vuelo')
        .update(vueloData)
        .eq('id_vuelo', id)
        .select();
}

async function actualizarAlquilerAuto(id, formData) {
    const alquilerData = {
        marca: formData.get('marca'),
        modelo: formData.get('modelo'),
        tipo_vehiculo: formData.get('tipo_vehiculo'),
        ubicacion_recogida: formData.get('ubicacion_recogida'),
        ubicacion_devolucion: formData.get('ubicacion_devolucion'),
        precio_total: parseFloat(formData.get('precio'))
    };

    return await supabase
        .from('alquiler_auto')
        .update(alquilerData)
        .eq('id_alquiler_auto', id)
        .select();
} 