// Base de datos de productos (Catálogo Vintage)
const catalogProducts = [
  { id: 1, title: 'Trench Coat Trench 1978', category: 'abrigos', price: 380, image: 'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=500&q=80' },
  { id: 2, title: 'Vestido Seda Floral 1965', category: 'vestidos', price: 290, image: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=500&q=80' },
  { id: 3, title: 'Saco Lana Tweed Británico', category: 'abrigos', price: 420, image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=500&q=80' },
  { id: 4, title: 'Bolso Cuero Grabado Años 70', category: 'accesorios', price: 210, image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=500&q=80' },
  { id: 5, title: 'Vestido Velvet Borgoña', category: 'vestidos', price: 340, image: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=500&q=80' },
  { id: 6, title: 'Sombrero Fieltro Clásico', category: 'accesorios', price: 150, image: 'https://images.unsplash.com/photo-1514327605112-b887c0e61c0a?auto=format&fit=crop&w=500&q=80' }
];

// Estado Global de la App
let shoppingCart = JSON.parse(localStorage.getItem('vintageCart')) || [];
let currentCountdown = null;
let countdownSeconds = 10;
let activeOrderData = null;

// Referencias DOM
const productsGrid = document.getElementById('productsGrid');
const cartBadge = document.getElementById('cartBadge');
const cartDrawer = document.getElementById('cartDrawer');
const cartOverlay = document.getElementById('cartOverlay');
const cartBody = document.getElementById('cartBody');
const cartSubtotal = document.getElementById('cartSubtotal');
const checkoutModal = document.getElementById('checkoutModal');
const timerModal = document.getElementById('timerModal');
const toast = document.getElementById('toast');

// ==========================================
// RENDERIZADO DEL CATÁLOGO & DOM
// ==========================================
function renderProducts(filter = 'todos') {
  productsGrid.innerHTML = '';
  
  const filtered = filter === 'todos' 
    ? catalogProducts 
    : catalogProducts.filter(p => p.category === filter);

  filtered.forEach(p => {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
      <div class="product-img" style="background-image: url('${p.image}')"></div>
      <div class="product-info">
        <span class="product-cat">${p.category}</span>
        <h3 class="product-title">${p.title}</h3>
        <div class="product-price">${p.price} Bs.</div>
        <button class="btn-add" onclick="addToCart(${p.id})">
          <i class="fa-solid fa-plus"></i> Añadir a la Bolsa
        </button>
      </div>
    `;
    productsGrid.appendChild(card);
  });
}

// Filtros de categoría por eventos DOM
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    renderProducts(e.target.dataset.filter);
  });
});

// ==========================================
// LÓGICA DEL CARRITO DE COMPRAS
// ==========================================
function addToCart(id) {
  const product = catalogProducts.find(p => p.id === id);
  const existing = shoppingCart.find(item => item.id === id);

  if (existing) {
    existing.qty += 1;
  } else {
    shoppingCart.push({ ...product, qty: 1 });
  }

  updateCartState();
  showToast(`Añadido: ${product.title}`);
}

function removeFromCart(id) {
  shoppingCart = shoppingCart.filter(item => item.id !== id);
  updateCartState();
}

function updateCartState() {
  localStorage.setItem('vintageCart', JSON.stringify(shoppingCart));
  
  // Actualizar Badge
  const totalItems = shoppingCart.reduce((sum, item) => sum + item.qty, 0);
  cartBadge.textContent = totalItems;

  // Actualizar Vista del Carrito en el DOM
  cartBody.innerHTML = '';
  let subtotal = 0;

  if (shoppingCart.length === 0) {
    cartBody.innerHTML = '<p class="empty-cart-msg">Tu bolsa de compra está vacía.</p>';
    cartSubtotal.textContent = '0 Bs.';
    return;
  }

  shoppingCart.forEach(item => {
    const itemSubtotal = item.price * item.qty;
    subtotal += itemSubtotal;

    const row = document.createElement('div');
    row.className = 'cart-item';
    row.innerHTML = `
      <div>
        <div class="cart-item-title">${item.title} (x${item.qty})</div>
        <div class="cart-item-price">${itemSubtotal} Bs.</div>
      </div>
      <button class="remove-item-btn" onclick="removeFromCart(${item.id})">
        <i class="fa-solid fa-trash"></i>
      </button>
    `;
    cartBody.appendChild(row);
  });

  cartSubtotal.textContent = `${subtotal} Bs.`;
}

// Abrir/Cerrar Carrito Drawer
document.getElementById('openCartBtn').addEventListener('click', () => {
  cartDrawer.classList.add('open');
  cartOverlay.classList.add('open');
});

function closeCart() {
  cartDrawer.classList.remove('open');
  cartOverlay.classList.remove('open');
}

document.getElementById('closeCartBtn').addEventListener('click', closeCart);
cartOverlay.addEventListener('click', closeCart);

// ==========================================
// FORMULARIO & TEMPORIZADOR DE 10 SEGUNDOS
// ==========================================
document.getElementById('btnProceedCheckout').addEventListener('click', () => {
  if (shoppingCart.length === 0) {
    showToast("Tu bolsa está vacía.");
    return;
  }
  closeCart();
  checkoutModal.classList.add('active');
});

document.getElementById('btnCancelCheckout').addEventListener('click', () => {
  checkoutModal.classList.remove('active');
});

document.getElementById('checkoutForm').addEventListener('submit', (e) => {
  e.preventDefault();
  
  const total = shoppingCart.reduce((sum, i) => sum + (i.price * i.qty), 0);
  activeOrderData = {
    name: document.getElementById('custName').value.trim(),
    phone: document.getElementById('custPhone').value.trim(),
    address: document.getElementById('custCity').value.trim(),
    total: `${total} Bs.`,
    items: [...shoppingCart]
  };

  checkoutModal.classList.remove('active');
  startConfirmationTimer();
});

function startConfirmationTimer() {
  timerModal.classList.add('active');
  
  document.getElementById('sumName').textContent = activeOrderData.name;
  document.getElementById('sumAddress').textContent = activeOrderData.address;
  document.getElementById('sumTotal').textContent = activeOrderData.total;

  countdownSeconds = 10;
  document.getElementById('timerDisplay').textContent = `${countdownSeconds}s`;

  clearInterval(currentCountdown);
  currentCountdown = setInterval(() => {
    countdownSeconds--;
    document.getElementById('timerDisplay').textContent = `${countdownSeconds}s`;

    if (countdownSeconds <= 0) {
      clearInterval(currentCountdown);
      executeFinalPurchase();
    }
  }, 1000);
}

document.getElementById('btnAbortTimer').addEventListener('click', () => {
  clearInterval(currentCountdown);
  timerModal.classList.remove('active');
  showToast("Confirmación cancelada.");
});

document.getElementById('btnConfirmNow').addEventListener('click', () => {
  clearInterval(currentCountdown);
  executeFinalPurchase();
});

function executeFinalPurchase() {
    timerModal.classList.remove('active');

    // Construir la lista de productos de forma limpia y corregida
    let itemsList = "";
    activeOrderData.items.forEach(i => {
        const subtotalItem = i.price * i.qty;
        itemsList += `- ${i.title} (x${i.qty}) - ${subtotalItem} Bs.\n`;
    });

    const targetWhatsApp = "59175273771";
    
    // Mensaje estructurado de forma correcta con template literals
    const message = `Hola L'Epoque Vintage, deseo confirmar la compra de la siguiente orden:\n\nCliente: ${activeOrderData.name}\nTelefono: ${activeOrderData.phone}\nDireccion: ${activeOrderData.address}\n\nDetalle de Prendas:\n${itemsList}\nTOTAL COMPRA: ${activeOrderData.total}`;

    showToast("Compra confirmada. Redirigiendo...");

    // Vaciar Carrito
    shoppingCart = [];
    updateCartState();

    setTimeout(() => {
        const encodedMessage = encodeURIComponent(message);
        window.open(`https://wa.me/${targetWhatsApp}?text=${encodedMessage}`, '_blank');
    }, 800);
}

function showToast(text) {
  toast.textContent = text;
  toast.style.display = 'block';
  setTimeout(() => {
    toast.style.display = 'none';
  }, 2500);
}

// Inicialización al cargar la página
document.addEventListener('DOMContentLoaded', () => {
  renderProducts();
  updateCartState();
});