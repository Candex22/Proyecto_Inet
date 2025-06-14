// Lógica de filtrado y ordenamiento para la sección de paquetes

document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.querySelector('input[name="search"]');
    const categorySelect = document.querySelector('select[name="category"]');
    const orderSelect = document.querySelector('select[name="order"]');
    const cardsContainer = document.querySelector('.lista-paquetes');
    const cards = Array.from(cardsContainer.querySelectorAll('.tarjeta-paquete'));

    // Helper para obtener datos de cada tarjeta
    function getCardData(card) {
        return {
            element: card,
            title: card.querySelector('h3')?.textContent.toLowerCase() || '',
            description: card.querySelector('p')?.textContent.toLowerCase() || '',
            category: card.querySelector('.tag.national') ? 'Nacional' : (card.querySelector('.tag.international') ? 'Internacional' : ''),
            // Quita $ y , y convierte a número
            price: parseFloat((card.querySelector('.prices .current')?.textContent || '0').replace(/[$,]/g, '')),
            // Busca el número de estrellas en el texto de rating
            rating: (() => {
                const ratingText = card.querySelector('.rating p')?.textContent || '';
                const match = ratingText.match(/Estrellas:\s*([\d.]+)/);
                return match ? parseFloat(match[1]) : 0;
            })(),
        };
    }

    // Filtrar y ordenar
    function filterAndSortCards() {
        const search = searchInput.value.trim().toLowerCase();
        const category = categorySelect.value;
        const order = orderSelect.value;

        let filtered = cards.map(getCardData).filter(card => {
            // Filtro de texto
            const matchesText = card.title.includes(search) || card.description.includes(search);
            // Filtro de categoría
            const matchesCategory = !category || card.category === category;
            return matchesText && matchesCategory;
        });

        // Ordenamiento
        if (order === 'precio-asc') {
            filtered.sort((a, b) => a.price - b.price);
        } else if (order === 'precio-desc') {
            filtered.sort((a, b) => b.price - a.price);
        } else if (order === 'rating') {
            filtered.sort((a, b) => b.rating - a.rating);
        }

        // Limpiar y volver a agregar
        cardsContainer.innerHTML = '';
        filtered.forEach(card => cardsContainer.appendChild(card.element));
    }

    // Eventos
    searchInput.addEventListener('input', filterAndSortCards);
    categorySelect.addEventListener('change', filterAndSortCards);
    orderSelect.addEventListener('change', filterAndSortCards);

    // Inicializar
    filterAndSortCards();
});
