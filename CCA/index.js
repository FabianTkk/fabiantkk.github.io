/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Simulating product data - in a real app, this would come from a backend API
const products = [
    {
        id: 'prod1',
        nombre: 'iPhone 16 Pro y iPhone 16 Pro Max',
        categoryHighlight: 'INTELIGENCIA DE APPLE',
        descripcionLarga: 'Experimenta el futuro con nuestro elegante y potente smartphone. Pantalla OLED de 6.5", cámara triple de 48MP y el último procesador para un rendimiento sin igual.',
        precio: 999.00,
        precioTextoAlternativo: 'Desde $999 o $41.62/mes por 24 meses*',
        imagen: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-15-pro-finish-select-202309-6-7inch-naturaltitanium?wid=5120&hei=2880&fmt=p-jpg&qlt=80&.v=1692845702708', // Example Pro image
        categoria: 'Smartphones',
        availableColors: [
            { name: 'Titanio Natural', value: '#B4B0A9' },
            { name: 'Titanio Azul', value: '#5E7A8A' },
            { name: 'Titanio Blanco', value: '#F0F0F0' },
            { name: 'Titanio Negro', value: '#3B3B3B' },
        ]
    },
    {
        id: 'prod2',
        nombre: 'iPhone 16 y iPhone 16 Plus',
        categoryHighlight: 'INTELIGENCIA DE APPLE',
        descripcionLarga: 'Un salto gigante en rendimiento y fotografía. El chip A18 Bionic y un sistema de cámara dual avanzado te permiten hacer más y capturar todo.',
        precio: 799.00,
        precioTextoAlternativo: 'Desde $799 o $33.29/mes por 24 meses*',
        imagen: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-15-finish-select-202309-6-1inch-blue?wid=5120&hei=2880&fmt=p-jpg&qlt=80&.v=1692923777970', // Example non-Pro image
        categoria: 'Smartphones',
        availableColors: [
            { name: 'Azul', value: '#A5C9E5' },
            { name: 'Rosa', value: '#F7C8D1' },
            { name: 'Amarillo', value: '#F9E79F' },
            { name: 'Verde', value: '#BEE2C3' },
            { name: 'Negro', value: '#3B3B3B' },
        ]
    },
    {
        id: 'prod3',
        nombre: 'iPhone 16e',
        categoryHighlight: 'NUEVO',
        descripcionLarga: 'Increíblemente capaz. Sorprendentemente asequible. El iPhone 16e combina potencia y valor en un diseño que te encantará.',
        precio: 599.00,
        precioTextoAlternativo: 'Desde $599 o $24.95/mes por 24 meses*',
        imagen: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-se-finish-select-202207-product-red?wid=5120&hei=2880&fmt=p-jpg&qlt=80&.v=1655316690209', // Example SE image
        categoria: 'Smartphones',
        availableColors: [
            { name: 'Medianoche', value: '#3B3B3B' },
            { name: 'Blanco Estrella', value: '#F0F0F0' },
            { name: '(PRODUCT)RED', value: '#BF001C' },
        ]
    },
    {
        id: 'prod4',
        nombre: 'Tablet Air Ligera',
        categoryHighlight: 'CREATIVIDAD PRO',
        descripcionLarga: 'La Tablet Air es increíblemente delgada y ligera, pero potente. Perfecta para trabajar, crear y jugar donde quiera que vayas. Pantalla Liquid Retina de 10.9".',
        precio: 599.00,
        precioTextoAlternativo: 'Desde $599 o $49.91/mes por 12 meses*',
        imagen: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/ipad-air-finish-select-gallery-202211-purple-wifi_FMT_WHH?wid=1280&hei=720&fmt=p-jpg&qlt=95&.v=1667506425330',
        categoria: 'Tablets',
        availableColors: [
            { name: 'Gris Espacial', value: '#808080' },
            { name: 'Blanco Estrella', value: '#F0F0F0' },
            { name: 'Rosa', value: '#F7C8D1'},
            { name: 'Púrpura', value: '#D0BDE3'},
            { name: 'Azul', value: '#A5C9E5' }
        ]
    },
    {
        id: 'prod5',
        nombre: 'Auriculares Inalámbricos Max',
        categoryHighlight: 'AUDIO INMERSIVO',
        descripcionLarga: 'Sumérgete en tu música con nuestros auriculares inalámbricos Max. Cancelación activa de ruido, batería de larga duración y un ajuste cómodo para todo el día.',
        precio: 549.00,
        precioTextoAlternativo: 'Desde $549 o $45.75/mes por 12 meses*',
        imagen: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/airpods-max-hero-select-202011?wid=940&hei=800&fmt=jpeg&qlt=90&.v=1604021292000',
        categoria: 'Audio',
        availableColors: [
            { name: 'Plata', value: '#E0E0E0' },
            { name: 'Gris Espacial', value: '#808080' },
            { name: 'Azul Cielo', value: '#A5C9E5' },
            { name: 'Rosa', value: '#F7C8D1' },
            { name: 'Verde', value: '#BEE2C3' }
        ]
    }

];

// WhatsApp Configuration (Reemplazar con tu número)
const WHATSAPP_PHONE_NUMBER = '1234567890'; // Ejemplo: +521XXXXXXXXXX (incluir código de país y área)

// Cart state - loaded from localStorage
let cart = [];

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const productGrid = document.getElementById('product-grid');
    const productDetailModal = document.getElementById('product-detail-modal');
    const cartModal = document.getElementById('cart-modal');
    const closeModalButtons = document.querySelectorAll('.modal-close-button');
    const cartButton = document.getElementById('cart-button');
    const cartCountSpan = document.getElementById('cart-count');
    const cartItemsContainer = document.getElementById('cart-items-container');
    const cartTotalPriceSpan = document.getElementById('cart-total-price');
    const modalBodyContent = document.getElementById('modal-body-content');
    const themeToggleButton = document.getElementById('theme-toggle-button');
    const bodyElement = document.body;

    // --- Theme Toggle Logic ---
    function applyTheme(theme) {
        if (theme === 'dark') {
            bodyElement.classList.add('dark-mode');
            if (themeToggleButton) themeToggleButton.setAttribute('aria-pressed', 'true');
        } else {
            bodyElement.classList.remove('dark-mode');
            if (themeToggleButton) themeToggleButton.setAttribute('aria-pressed', 'false');
        }
        localStorage.setItem('theme', theme);
    }

    if (themeToggleButton) {
        themeToggleButton.addEventListener('click', () => {
            const currentThemeIsDark = bodyElement.classList.contains('dark-mode');
            applyTheme(currentThemeIsDark ? 'light' : 'dark');
        });
    }

    // Initialize theme
    const savedTheme = localStorage.getItem('theme');
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme) {
        applyTheme(savedTheme);
    } else if (prefersDarkScheme) {
        applyTheme('dark');
    } else {
        applyTheme('light'); // Default to light if no preference
    }


    // --- Product Rendering ---
    function renderProducts() {
        if (!productGrid) return;
        productGrid.innerHTML = ''; // Clear existing products
        products.forEach(product => {
            const card = document.createElement('article');
            card.className = 'product-card';
            card.setAttribute('aria-labelledby', `product-name-${product.id}`);
            // No tabindex on card itself, handled by inner buttons.
            card.dataset.productId = product.id;

            const categoryHighlightHTML = product.categoryHighlight ?
                `<p class="product-card-category-highlight">${product.categoryHighlight}</p>` : '';

            const colorSwatchesHTML = product.availableColors && product.availableColors.length > 0 ?
                product.availableColors.map(color =>
                    `<span class="color-swatch" style="background-color: ${color.value};" aria-label="${color.name}" title="${color.name}"></span>`
                ).join('') : '';

            const priceTextHTML = product.precioTextoAlternativo || `$${product.precio.toFixed(2)}`;

            card.innerHTML = `
                ${categoryHighlightHTML}
                <h3 id="product-name-${product.id}" class="product-card-name">${product.nombre}</h3>
                <div class="product-card-image-container">
                    <img src="${product.imagen}" alt="${product.nombre}" class="product-card-image">
                    <button class="look-closer-button" data-product-id="${product.id}" aria-label="Mira más de cerca ${product.nombre}">Mira más de cerca</button>
                </div>
                <div class="product-color-swatches">
                    ${colorSwatchesHTML}
                </div>
                <div class="product-card-actions">
                    <p class="product-card-price-text">${priceTextHTML}</p>
                    <button class="button primary-button comprar-button" data-product-id="${product.id}" aria-label="Comprar ${product.nombre}">Comprar</button>
                </div>
            `;
            
            // Event listener for "Mira más de cerca" button
            const lookCloserButton = card.querySelector('.look-closer-button');
            if (lookCloserButton) {
                lookCloserButton.addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevent card click if button is distinct
                    openProductDetailModal(product.id);
                });
            }

            // Event listener for "Comprar" button
            const comprarButton = card.querySelector('.comprar-button');
            if (comprarButton) {
                comprarButton.addEventListener('click', (event) => {
                    event.stopPropagation();
                    addProductToCart(product.id);
                });
            }
            
            // Allow clicking card (not buttons) to open modal too
             card.addEventListener('click', (e) => {
                const targetElement = e.target;
                if (!targetElement.closest('button')) { // If click is not on any button within card
                    openProductDetailModal(product.id);
                }
            });


            productGrid.appendChild(card);
        });
    }

    // --- Modal Logic ---
    let lastFocusedElement = null;

    function openModal(modalElement) {
        if(modalElement) {
            lastFocusedElement = document.activeElement;
            modalElement.classList.add('active');
            modalElement.setAttribute('aria-hidden', 'false');
            // Prioritize focusing the close button in modals
            const closeButton = modalElement.querySelector('.modal-close-button');
            if (closeButton) {
                closeButton.focus();
            } else {
                // Fallback to first focusable element or modal itself
                const focusableElement = modalElement.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
                if (focusableElement) {
                    focusableElement.focus();
                } else {
                    modalElement.focus(); 
                }
            }
        }
    }

    function closeModal(modalElement) {
         if(modalElement && modalElement.classList.contains('active')) {
            modalElement.classList.remove('active');
            modalElement.setAttribute('aria-hidden', 'true');
            if (lastFocusedElement) {
                lastFocusedElement.focus();
                lastFocusedElement = null;
            }
         }
    }

    closeModalButtons.forEach(button => {
        button.addEventListener('click', () => {
            const parentModal = button.closest('.modal');
            closeModal(parentModal);
        });
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            if (productDetailModal && productDetailModal.classList.contains('active')) closeModal(productDetailModal);
            if (cartModal && cartModal.classList.contains('active')) closeModal(cartModal);
        }
    });
    
    window.addEventListener('click', (event) => {
        if (event.target === productDetailModal) {
            closeModal(productDetailModal);
        }
        if (event.target === cartModal) {
            closeModal(cartModal);
        }
    });


    // --- Product Detail Modal ---
    function openProductDetailModal(productId) {
        const product = products.find(p => p.id === productId);
        if (!product || !modalBodyContent) return;

        modalBodyContent.innerHTML = `
            <img src="${product.imagen}" alt="${product.nombre}" class="product-image-large">
            <h2 class="product-name-large" id="product-modal-title">${product.nombre}</h2>
            <p class="product-price-large">$${product.precio.toFixed(2)}</p>
            <p class="product-description-full">${product.descripcionLarga}</p>
            <div class="modal-actions">
                <button class="button primary-button add-to-cart-button-modal" data-product-id="${product.id}" aria-label="Añadir ${product.nombre} al carrito">Añadir al Carrito</button>
                <button class="button secondary-button whatsapp-button" data-product-id="${product.id}" aria-label="Contactar por WhatsApp sobre ${product.nombre}">Contactar por WhatsApp</button>
            </div>
        `;
        productDetailModal.setAttribute('aria-labelledby', 'product-modal-title');
        openModal(productDetailModal);

        const addToCartButtonModal = modalBodyContent.querySelector('.add-to-cart-button-modal');
        if (addToCartButtonModal) {
            addToCartButtonModal.addEventListener('click', (event) => {
                addProductToCart(product.id);
            });
        }

        const whatsappButtonModal = modalBodyContent.querySelector('.whatsapp-button');
        if (whatsappButtonModal) {
            whatsappButtonModal.addEventListener('click', (event) => {
                openWhatsAppChat(product.id);
            });
        }
    }

    // --- WhatsApp Integration ---
    function openWhatsAppChat(productId) {
        const product = products.find(p => p.id === productId);
        if (!product) return;

        const message = encodeURIComponent(`Hola, estoy interesado en el producto: ${product.nombre} - Precio: $${product.precio.toFixed(2)}`);
        const whatsappURL = `https://wa.me/${WHATSAPP_PHONE_NUMBER}?text=${message}`;
        window.open(whatsappURL, '_blank');
    }

    // --- Cart Logic ---
    function loadCartFromLocalStorage() {
        const storedCart = localStorage.getItem('minimalistShopCart');
        if (storedCart) {
            cart = JSON.parse(storedCart);
        }
        updateCartDisplay();
    }

    function saveCartToLocalStorage() {
        localStorage.setItem('minimalistShopCart', JSON.stringify(cart));
    }

    function addProductToCart(productId) {
        const product = products.find(p => p.id === productId);
        if (!product) return;

        const existingCartItem = cart.find(item => item.id === productId);
        if (existingCartItem) {
            existingCartItem.quantity++;
        } else {
            cart.push({ ...product, quantity: 1 });
        }
        
        saveCartToLocalStorage();
        updateCartDisplay();
        // Optionally open cart modal after adding from card, or provide other feedback
        // For now, just update count and rely on user to open cart.
        // openModal(cartModal); 
    }

    function updateCartItemQuantity(productId, newQuantity) {
        const cartItem = cart.find(item => item.id === productId);
        if (cartItem) {
            cartItem.quantity = Math.max(0, newQuantity); 
            if (cartItem.quantity === 0) {
                removeProductFromCart(productId, false); 
            }
        }
        saveCartToLocalStorage();
        updateCartDisplay(); 
    }

    function removeProductFromCart(productId, shouldUpdateDisplay = true) {
        cart = cart.filter(item => item.id !== productId);
        saveCartToLocalStorage();
        if (shouldUpdateDisplay) {
            updateCartDisplay();
        }
    }

    function updateCartDisplay() {
        if (!cartItemsContainer || !cartCountSpan || !cartTotalPriceSpan) return;

        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCountSpan.textContent = totalItems.toString();

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p class="empty-cart-message">Tu carrito está vacío.</p>';
        } else {
            cartItemsContainer.innerHTML = cart.map(item => `
                <div class="cart-item" data-product-id="${item.id}" aria-labelledby="cart-item-name-${item.id}">
                    <img src="${item.imagen}" alt="${item.nombre}" class="cart-item-image">
                    <div class="cart-item-info">
                        <p id="cart-item-name-${item.id}" class="cart-item-name">${item.nombre}</p>
                        <p class="cart-item-price">$${item.precio.toFixed(2)} x ${item.quantity}</p>
                    </div>
                    <div class="cart-item-quantity">
                        <button class="quantity-change" data-action="decrease" data-product-id="${item.id}" aria-label="Disminuir cantidad de ${item.nombre}">-</button>
                        <input type="number" value="${item.quantity}" min="1" aria-label="Cantidad de ${item.nombre}" class="quantity-input" data-product-id="${item.id}" readonly>
                        <button class="quantity-change" data-action="increase" data-product-id="${item.id}" aria-label="Aumentar cantidad de ${item.nombre}">+</button>
                    </div>
                    <button class="cart-item-remove-button" data-product-id="${item.id}" aria-label="Eliminar ${item.nombre} del carrito">Eliminar</button>
                </div>
            `).join('');

            cartItemsContainer.querySelectorAll('.quantity-change').forEach(button => {
                button.addEventListener('click', (event) => {
                    const targetButton = event.target;
                    const productId = targetButton.dataset.productId;
                    const action = targetButton.dataset.action;
                    const itemInCart = cart.find(i => i.id === productId); // Renamed to avoid conflict
                    if (itemInCart && productId) {
                        let newQuantity = itemInCart.quantity;
                        if (action === 'increase') newQuantity++;
                        if (action === 'decrease') newQuantity--;
                        updateCartItemQuantity(productId, newQuantity);
                    }
                });
            });
            
            cartItemsContainer.querySelectorAll('.quantity-input').forEach(input => {
                input.addEventListener('change', (event) => { 
                    const targetInput = event.target;
                    const productId = targetInput.dataset.productId;
                    const newQuantity = parseInt(targetInput.value, 10);
                    if (productId && !isNaN(newQuantity)) {
                        updateCartItemQuantity(productId, newQuantity);
                    }
                });
            });

            cartItemsContainer.querySelectorAll('.cart-item-remove-button').forEach(button => {
                button.addEventListener('click', (event) => {
                    const targetButton = event.target;
                     const productId = targetButton.dataset.productId;
                    if (productId) {
                        removeProductFromCart(productId);
                    }
                });
            });
        }

        const totalPrice = cart.reduce((sum, item) => sum + (item.precio * item.quantity), 0);
        cartTotalPriceSpan.textContent = `$${totalPrice.toFixed(2)}`;
    }

    // --- Event Listeners ---
    if (cartButton) {
        cartButton.addEventListener('click', (e) => {
            e.preventDefault();
            openModal(cartModal);
        });
    }
    
    const checkoutButton = document.getElementById('checkout-button');
    if (checkoutButton) {
        checkoutButton.addEventListener('click', () => {
            if (cart.length > 0) {
                alert('Simulación de pago: ¡Gracias por tu compra!');
                cart = []; 
                saveCartToLocalStorage();
                updateCartDisplay();
                closeModal(cartModal);
            } else {
                alert('Tu carrito está vacío.');
            }
        });
    }

    const homeLinks = document.querySelectorAll('#home-link, #home-link-logo');
    homeLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            closeModal(productDetailModal);
            closeModal(cartModal);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            const mainHeading = document.getElementById('products-heading');
            if(mainHeading) mainHeading.focus({ preventScroll: true }); // preventScroll option
        });
    });


    // --- Initialization ---
    loadCartFromLocalStorage();
    renderProducts(); 
});