
let data_paquete = document.getElementById('data_paquete');
data_paquete = JSON.parse(data_paquete.textContent);
const data_dias = data_paquete.Dias
const precio_p = data_paquete.precio_total / 2;
const salida = data_paquete.fecha_salida
document.getElementById("precio_p").textContent = `$ ${precio_p} `


if (salida) {

    const [año, mes, dia] = salida.split('-').map(Number);


    const fecha = new Date(año, mes - 1, dia);


    const diaLocal = fecha.getDate();
    const mesTextoLocal = fecha.toLocaleDateString('es-ES', { month: 'long' });
    const añoLocal = fecha.getFullYear();

    console.log();
    document.getElementById("fecha_salida").textContent = ` ${diaLocal} de ${mesTextoLocal} de ${añoLocal}`
}


let currentPersonas = data_paquete.Personas || 1;
const precioBaseTotal = parseFloat(data_paquete.precio_total);
const personasBase = data_paquete.Personas || 1;
const precioPorPersona = precioBaseTotal / personasBase;

const personasDisplayElement = document.getElementById('personas-display');
const precioTotalDisplayElement = document.getElementById('precio-paquete');
const total_per = document.getElementById('total_per');

const updateTotalPrice = () => {
    const nuevoPrecioTotal = precioPorPersona * currentPersonas;
    if (precioTotalDisplayElement) {
        precioTotalDisplayElement.textContent = `$ ${nuevoPrecioTotal.toFixed(2)}`;
    }
};


document.getElementById("sumar_persona").addEventListener("click", () => {
    console.log("Botón sumar presionado");

    currentPersonas += 1;
    if (personasDisplayElement) {
        total_per.textContent = `Total (${currentPersonas} personas) `;
        personasDisplayElement.textContent = currentPersonas;
    }

    updateTotalPrice();
});


document.getElementById("restar_persona").addEventListener("click", () => {
    console.log("Botón restar presionado");

    if (currentPersonas > 1) {
        currentPersonas -= 1;
        if (personasDisplayElement) {
            total_per.textContent = `Total (${currentPersonas} personas)`;
            personasDisplayElement.textContent = currentPersonas;
        }
        updateTotalPrice();
    } else {
        console.log("No se puede seleccionar menos de 1 persona.");
    }
});


const precioOriginal = parseFloat(data_paquete.precio_total);
const porcentajeDescuento = parseFloat(data_paquete.descuento); 

let precioFinalConDescuento;
let montoDescontado;

if (porcentajeDescuento > 0) {
    montoDescontado = (precioOriginal * porcentajeDescuento) / 100;
    precioFinalConDescuento = precioOriginal - montoDescontado;
} else {

    precioFinalConDescuento = precioOriginal;
    montoDescontado = 0;
}


const priceValueElement = document.getElementById("price-value"); 
const finalPriceElement = document.getElementById("final-price"); 

if (priceValueElement) {
    priceValueElement.textContent = `$ ${precioFinalConDescuento.toFixed(2)}`; 
    priceValueElement.style.color = porcentajeDescuento > 0 ? '#00000' : 'initial';
}

