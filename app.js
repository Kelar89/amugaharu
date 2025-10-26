'use strict';

/*
  AMU GAHARU - app.js
  - Versi 4.3 (UI/UX Tweaks, Copywriting Hook, Animations)
  - Re-introduce smoke effect.
  - Add typewriter effect for hero subheadline.
  - Implement menu overlay logic.
  - Keep previous fixes (JSON data, buttons, notes).
*/

/***** Configuration *****/
const CONFIG = {
  brand: 'AMU GAHARU',
  waNumber: '6285894448143',
  currency: 'Rp',
  packingFee: 10000,
  promo: { weekendDiscountPercent: 10 },
  // [BARU] Teks untuk Typewriter
  typewriterTexts: [
    "Kayu dan Minyak Gaharu 100% Asli Nusantara.",
    "Pilihan Kolektor & Pecinta Aroma Berkualitas.",
    "Seleksi Ketat dari Hutan Berkelanjutan.",
    "Pesan Mudah & Cepat via WhatsApp."
  ]
};

/***** State & Utilities *****/
let PRODUCTS = [];
let CART = JSON.parse(localStorage.getItem('amugaharu_cart')||'[]');
let APPLIED_PROMO = JSON.parse(localStorage.getItem('amugaharu_promo')||'false');

function formatMoney(v){ return CONFIG.currency + ' ' + v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') }

function openWhatsAppQuick(e){
  if(e) e.preventDefault();
  const text = encodeURIComponent(`Halo admin ${CONFIG.brand}, saya ingin bertanya mengenai produk.`);
  window.open(`https://wa.me/${CONFIG.waNumber}?text=${text}`,'_blank');
}

function gaTrack(eventName, params) {
  console.log(`[Google Analytics Dummy] Event: ${eventName}`, params || '');
}

/***** Render products & Init *****/
async function init(){
  try {
    const response = await fetch('products.json?t=' + Date.now());
    if (!response.ok) {
      throw new Error(`Gagal memuat products.json: ${response.statusText}`);
    }
    PRODUCTS = await response.json();
    renderProducts();
  } catch (error) {
    console.error(error);
    document.getElementById('productGrid').innerHTML = `<div class="ghost" style="color: #ff8a8a;">Gagal memuat data produk. Pastikan file 'products.json' ada.</div>`;
  }

  updateCartUI();
  attachEvents();
  attachMenuEvents();
  checkPromo();
  initFaq();
  initScrollAnimations();
  initSmokeEffect(); // Re-initialize smoke effect
  startTypewriter(); // Start typewriter effect

  gaTrack('page_view');

  setTimeout(()=>document.getElementById('loader').style.display='none', 500);
}

function renderProducts(){
  const grid = document.getElementById('productGrid'); grid.innerHTML='';
  const q = document.getElementById('searchInput').value.toLowerCase();
  const cat = document.querySelector('#filterPills button.active').dataset.category;
  const sort = document.getElementById('sortBy').value;

  let list = PRODUCTS.filter(p=> p.name.toLowerCase().includes(q) || (p.desc && p.desc.toLowerCase().includes(q)));
  if(cat!=='all') list = list.filter(p=>p.category===cat);
  if(sort==='price-asc') list.sort((a,b)=>a.price-b.price);
  if(sort==='price-desc') list.sort((a,b)=>b.price-a.price);

  if (list.length === 0) {
    grid.innerHTML = `<div class="ghost">Tidak ada produk yang cocok.</div>`;
    return;
  }

  list.forEach(p=>{
    const div = document.createElement('div'); div.className='product reveal';
    div.innerHTML = `
      <div class='badge'>${p.category}</div>
      <div class='img'><img src='${p.img}' alt='${p.name}' loading='lazy'></div>
      <h3>${p.name}</h3>
      <div class='ghost'>${p.desc || ''}</div>
      <div style='display:flex;justify-content:space-between;align-items:center;margin-top:10px'>
        <div>
          <div class='price'>${formatMoney(p.price)}</div>
          <div class='ghost' style='font-size:12px'>Stok: ${p.stock}</div>
        </div>
        <div class='prod-actions'>
          {/* [BARU] CTA Sekunder Langsung ke WA */}
          <button class='icon-btn' onclick='openWhatsAppProduct("${p.id}")' title="Tanya Produk Ini via WA">
             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-whatsapp" viewBox="0 0 16 16">
               <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.57 6.57 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.626-2.957 6.584-6.591 6.584zm-1.07-5.115c-.083-.41-.304-.552-.57-.649-.26-.098-.517-.146-.732-.146s-.442.05-.612.146c-.17.098-.282.232-.365.411-.083.179-.164.389-.24.588-.076.199-.16.42-.236.611a.28.28 0 0 0 .01.246c.07.152.18.31.3.444.118.133.26.27.413.413.152.143.33.29.53.444.2.152.413.282.64.39.229.108.47.163.732.163.26 0 .5-.055.7-.163.2-.108.35-.27.45-.477.1-.207.15-.462.15-.764s-.05-.59-.15-.764c-.1-.207-.25-.371-.45-.477s-.42-.163-.7-.163c-.22 0-.41.04-.57.123-.16.084-.28.2-.36.36s-.13.34-.16.53c-.03.19-.01.38.03.53.05.15.13.28.23.38.1.1.23.18.38.23.15.05.3.08.43.08.16 0 .3-.03.43-.08.13-.05.25-.13.35-.23.1-.1.18-.23.23-.38.05-.15.08-.3.08-.43s-.03-.3-.08-.43c-.05-.13-.13-.25-.23-.35-.1-.1-.23-.18-.38-.23z"/>
             </svg>
          </button>
          <button class='icon-btn' onclick='openProductModal("${p.id}")' title="Lihat Detail">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z"/><path d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8zm8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z"/></svg>
          </button>
          <button class='icon-btn icon-btn-primary' onclick='addToCart("${p.id}", 1)' title="Tambah ke Keranjang">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M8 1.5a.5.5 0 0 1 .5.5v5.5H14a.5.5 0 0 1 0 1H8.5V14a.5.5 0 0 1-1 0V8.5H2a.5.5 0 0 1 0-1h5.5V2a.5.5 0 0 1 .5-.5z"/></svg>
          </button>
        </div>
      </div>`;
    grid.appendChild(div);
  })

  initScrollAnimations();
}

function filterByCategory(category){
  document.querySelectorAll('#filterPills button').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.category === category);
  });
  renderProducts();
  gaTrack('filter_by_category', { category: category });
}

// [BARU] Fungsi WA khusus produk
function openWhatsAppProduct(id) {
    const p = PRODUCTS.find(x => x.id === id);
    if (!p) return;
    const text = encodeURIComponent(`Halo admin ${CONFIG.brand}, saya tertarik dengan produk "${p.name}". Mohon info lebih lanjut.`);
    window.open(`https://wa.me/${CONFIG.waNumber}?text=${text}`, '_blank');
    gaTrack('contact_via_wa_product', { product_id: p.id, product_name: p.name });
}


/***** Modal functions *****/
function openProductModal(id){
  const p = PRODUCTS.find(x=>x.id===id); if(!p) return;
  const left = document.getElementById('modalLeft'); const right = document.getElementById('modalRight');
  left.innerHTML = `<div style='border-radius:12px;overflow:hidden'><img src='${p.img}' alt='${p.name}' style='width:100%; height:100%; object-fit:cover'></div>`;

  const shareURL = encodeURIComponent(window.location.href + '#product-' + p.id);
  const shareText = encodeURIComponent(`Cek produk premium ${p.name} dari ${CONFIG.brand}!`);

  right.innerHTML = `
    <h2 style='margin-top:0'>${p.name}</h2>
    <div class='ghost'>${p.desc || ''}</div>
    <div style='margin-top:12px; font-weight:800; color:var(--accent); font-size:20px'>${formatMoney(p.price)}</div>
    <div style='margin-top:12px; display:flex; gap:8px; align-items:center'>
      <input id='modalQtyInput' type='number' min='1' value='1' style='width:80px; padding:8px; border-radius:8px; background:transparent; border:1px solid rgba(255,255,255,0.04)'>
      <button class='btn btn-primary' onclick='addToCart("${p.id}", parseInt(document.getElementById("modalQtyInput").value||1)); closeModal("productModal");'>Tambah ke Keranjang</button>
    </div>
    <div class="share-buttons">
      <a class="share-btn wa" href="https://api.whatsapp.com/send?text=${shareText}%20${shareURL}" target="_blank">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.626-2.957 6.584-6.591 6.584zM9.079 8.39c-.083-.411-.304-.552-.57-.649-.26-.098-.517-.146-.732-.146s-.442.05-.612.146c-.17.098-.282.232-.365.411-.083.179-.164.389-.24.588-.076.199-.16.42-.236.611a.28.28 0 0 0 .01.246c.07.152.18.31.3.444.118.133.26.27.413.413.152.143.33.29.53.444.2.152.413.282.64.39.229.108.47.163.732.163.26 0 .5-.055.7-.163.2-.108.35-.27.45-.477.1-.207.15-.462.15-.764s-.05-.59-.15-.764c-.1-.207-.25-.371-.45-.477s-.42-.163-.7-.163c-.22 0-.41.04-.57.123-.16.084-.28.2-.36.36s-.13.34-.16.53c-.03.19-.01.38.03.53.05.15.13.28.23.38.1.1.23.18.38.23.15.05.3.08.43.08.16 0 .3-.03.43-.08.13-.05.25-.13.35-.23.1-.1.18-.23.23-.38.05-.15.08-.3.08-.43s-.03-.3-.08-.43c-.05-.13-.13-.25-.23-.35-.1-.1-.23-.18-.38-.23z"/></svg>
        Share
      </a>
      <a class="share-btn fb" href="https://www.facebook.com/sharer/sharer.php?u=${shareURL}" target="_blank">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M16 8.049c0-4.446-3.582-8.05-8-8.05C3.58 0 0 3.603 0 8.049c0 4.017 2.926 7.347 6.75 7.951v-5.625h-2.03V8.05H6.75V6.275c0-2.017 1.195-3.131 3.022-3.131.876 0 1.791.157 1.791.157v1.98h-1.009c-.993 0-1.303.621-1.303 1.258v1.51h2.218l-.354 2.326H9.25V16c3.824-.604 6.75-3.934 6.75-7.951z"/></svg>
        Share
      </a>
      <a class="share-btn tw" href="https://twitter.com/intent/tweet?text=${shareText}&url=${shareURL}" target="_blank">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M5.026 15c6.038 0 9.341-5.003 9.341-9.334 0-.14 0-.282-.006-.422A6.685 6.685 0 0 0 16 3.542a6.658 6.658 0 0 1-1.889.518 3.301 3.301 0 0 0 1.447-1.817 6.533 6.533 0 0 1-2.087.793A3.286 3.286 0 0 0 7.875 6.03a9.325 9.325 0 0 1-6.767-3.429 3.289 3.289 0 0 0 1.018 4.382A3.323 3.323 0 0 1 .64 6.575v.045a3.288 3.288 0 0 0 2.632 3.218 3.203 3.203 0 0 1-.865.115 3.23 3.23 0 0 1-.614-.057 3.283 3.283 0 0 0 3.067 2.277A6.588 6.588 0 0 1 .792 13.58a6.32 6.32 0 0 1-.79-.045A9.344 9.344 0 0 0 5.026 15z"/></svg>
        Tweet
      </a>
    </div>`;
  openModal('productModal');
  gaTrack('view_product', { product_id: p.id, product_name: p.name });
}

function openModal(id) {
  document.getElementById(id).classList.add('open');
}

function closeModal(id){ document.getElementById(id).classList.remove('open'); }

/***** Full Cart Logic *****/
function addToCart(id, qty = 1){
  const p = PRODUCTS.find(x=>x.id===id); if(!p) return;
  qty = Math.max(1, parseInt(qty));

  const existing = CART.find(c=>c.id===id);
  if(existing){
    existing.qty += qty
  } else {
    if (p.id && p.name && p.price && p.img) {
      CART.push({id:p.id, name:p.name, price:p.price, unit:p.unit, img: p.img, qty:qty})
    } else {
      console.error("Data produk tidak lengkap:", p);
      alert("Gagal menambahkan produk, data tidak lengkap.");
      return;
    }
  }

  localStorage.setItem('amugaharu_cart', JSON.stringify(CART));
  updateCartUI();
  openModal('cartModal');
  gaTrack('add_to_cart', { product_id: p.id, quantity: qty });
}


function updateCartQuantity(id, newQty) {
  newQty = Math.max(0, parseInt(newQty));
  const itemIndex = CART.findIndex(c => c.id === id);
  if (itemIndex === -1) return;

  if (newQty === 0) {
      CART.splice(itemIndex, 1);
  } else {
      CART[itemIndex].qty = newQty;
  }
  localStorage.setItem('amugaharu_cart', JSON.stringify(CART));
  updateCartUI();
}


function updateCartUI() {
  renderMiniCart();
  calculateTotals();
  document.getElementById('cartCount').innerText = CART.reduce((s,i)=>s+i.qty,0);
}

function renderMiniCart() {
    const cartBody = document.getElementById('cartBody');
    const cartEmpty = document.getElementById('cartEmpty');

    const itemsToRemove = Array.from(cartBody.children).filter(child => child !== cartEmpty);
    itemsToRemove.forEach(child => cartBody.removeChild(child));

    if (CART.length === 0) {
        if (cartEmpty) cartEmpty.style.display = 'block';
    } else {
        if (cartEmpty) cartEmpty.style.display = 'none';
        CART.forEach(item => {
            const div = document.createElement('div');
            div.className = 'cart-item';
            div.innerHTML = `
                <div class='pimg'><img src='${item.img}' alt='${item.name}' loading='lazy'></div>
                <div class='cart-item-meta'>
                    <h4>${item.name}</h4>
                    <div class='price'>${formatMoney(item.price)}</div>
                </div>
                <div class='cart-qty'>
                    <button class='qty-btn' onclick='updateCartQuantity("${item.id}", ${item.qty - 1})'>-</button>
                    <span>${item.qty}</span>
                    <button class='qty-btn' onclick='updateCartQuantity("${item.id}", ${item.qty + 1})'>+</button>
                </div>
                <button class='cart-item-remove' onclick='updateCartQuantity("${item.id}", 0)'>Hapus</button>
            `;
            if (cartEmpty) {
                cartBody.insertBefore(div, cartEmpty);
            } else {
                cartBody.appendChild(div);
            }
        });
    }
}


function calculateTotals() {
  let subtotal = 0;
  CART.forEach(item => { subtotal += item.price * item.qty });

  const shippingMethod = localStorage.getItem('shippingMethod') || 'internal';
  let shippingCost = 0;
  if (subtotal > 0) {
      if (shippingMethod === 'pickup') {
          shippingCost = 0;
      } else if (shippingMethod === 'internal') {
          shippingCost = 15000;
      } else {
          shippingCost = 0;
      }
  }

  const packingFee = (subtotal > 0) ? CONFIG.packingFee : 0;

  let discount = 0;
  const packingFeeRow = document.getElementById('packingFeeRow');
  const summaryPackingFee = document.getElementById('summaryPackingFee');


  if(APPLIED_PROMO) {
    discount = subtotal * (CONFIG.promo.weekendDiscountPercent / 100);
    document.getElementById('promoDiscountRow').style.display = 'flex';
    document.getElementById('summaryDiscount').innerText = '- ' + formatMoney(discount);
  } else {
    document.getElementById('promoDiscountRow').style.display = 'none';
  }

   if (packingFee > 0) {
      packingFeeRow.style.display = 'flex';
      summaryPackingFee.innerText = formatMoney(packingFee);
  } else {
      packingFeeRow.style.display = 'none';
  }


  const total = subtotal + shippingCost + packingFee - discount;

  document.getElementById('summarySubtotal').innerText = formatMoney(subtotal);
  document.getElementById('summaryShipping').innerText = (shippingMethod === 'gosend' || shippingMethod === 'grabexpress') ? 'Sesuai Aplikasi' : formatMoney(shippingCost);
  document.getElementById('summaryTotal').innerText = formatMoney(total);

}


function checkoutToWhatsApp() {
  if(CART.length === 0) {
    alert('Keranjang Anda kosong');
    return;
  }

  const orderNote = document.getElementById('orderNote').value.trim();

  const customerName = "Umar"; // Ganti dengan data asli
  const customerPhone = "085894448146"; // Ganti dengan data asli
  const customerAddress = "petmaburan 89, RT 4/RW 6, Kel. per, Kec. asdfs, rwe324 10260"; // Ganti dengan data asli
  const customerPinpoint = "Tidak Dibagikan"; // Ganti dengan data asli
  const shippingMethod = localStorage.getItem('shippingMethod') || 'internal'; // Ganti dengan data asli
  const paymentMethod = "Transfer BCA"; // Ganti dengan data asli


  let shippingCost = 0;
  let estimatedTime = "Sesuai Aplikasi Ojol";
  let shippingCostDisplay = "Sesuai Aplikasi";

  if (shippingMethod === 'pickup') {
      shippingCost = 0;
      estimatedTime = "Siap diambil dalam 30 menit";
      shippingCostDisplay = formatMoney(0);
  } else if (shippingMethod === 'internal') {
      shippingCost = 15000;
      estimatedTime = "Tiba dalam 45-60 menit";
      shippingCostDisplay = formatMoney(shippingCost);
  }

  const packingFee = (CART.reduce((sum, item) => sum + item.price * item.qty, 0) > 0) ? CONFIG.packingFee : 0;

  let lines = [];
  lines.push(`*Pesan Baru dari Website ${CONFIG.brand}*`);
  lines.push(`===================================`);
  lines.push(`*Detail Pelanggan:*`);
  lines.push(`* *Nama:* ${customerName}`);
  lines.push(`* *No. HP:* ${customerPhone}`);
  lines.push(`* *Alamat:* ${customerAddress}`);
  lines.push(`* *Pinpoint Lokasi:* ${customerPinpoint}`);
  lines.push(`===================================`);
  lines.push(`*Detail Pesanan (Order ID: ${Date.now().toString().slice(-6)}):*`);

  let subtotal = 0;
  CART.forEach((item, index) => {
    const product = PRODUCTS.find(p => p.id === item.id);
    lines.push(`*${item.name}*`);
    lines.push(`  - Jumlah: ${item.qty} x ${formatMoney(item.price)}`);
    // Example only - Adapt if you add variants to products.json
    // if (product && product.variants) { lines.push(`  - *Varian:*`); /* ... */ }
    if (item.note) { lines.push(`  - Catatan Item: ${item.note}`); }
    if (index < CART.length - 1) { lines.push(`---`); }
    subtotal += item.price * item.qty;
  });

  if (orderNote) {
    lines.push(`---`);
    lines.push(`*Catatan Pesanan Keseluruhan:*`);
    lines.push(orderNote);
    lines.push(`---`);
  } else {
    lines.push(`===================================`);
  }

  lines.push(`*Pengiriman & Pembayaran:*`);
  lines.push(`* *Metode Pengiriman:* ${shippingMethod.replace(/^\w/, c => c.toUpperCase())}`);
  lines.push(`* *Estimasi:* ${estimatedTime}`);
  lines.push(`* *Metode Pembayaran:* ${paymentMethod}`);
  lines.push(`===================================`);
  lines.push(`*Rincian Pembayaran:*`);
  lines.push(`* *Subtotal:* ${formatMoney(subtotal)}`);
  lines.push(`* *Ongkir:* ${shippingCostDisplay}`);
  if (packingFee > 0) { lines.push(`* *Biaya Packing:* ${formatMoney(packingFee)}`); }

  let discount = 0;
  if(APPLIED_PROMO) {
    discount = subtotal * (CONFIG.promo.weekendDiscountPercent / 100);
    lines.push(`* *Diskon Promo:* -${formatMoney(discount)}`);
  }
  lines.push(`-----------------------------------`);

  const total = subtotal + shippingCost + packingFee - discount;
  lines.push(`* *TOTAL:* *${formatMoney(total)}*`);
  lines.push(`===================================`);
  lines.push(`Mohon segera diproses. Terima kasih. 🙏`);

  const text = encodeURIComponent(lines.join('\n'));
  const waLink = `https://wa.me/${CONFIG.waNumber}?text=${text}`;

  gaTrack('begin_checkout', { value: total, currency: 'IDR' });
  window.open(waLink,'_blank');
}


/***** Promo logic *****/
function isWeekendPromo(){
  const d = new Date(); const day = d.getDay();
  return (day===5||day===6||day===0);
}
function checkPromo(){
  if(isWeekendPromo()){
    document.getElementById('promoBox').style.opacity='1';
    startPromoTimer();
  }
}
function startPromoTimer(){
  const now = new Date(); const end = new Date(now);
  const day = now.getDay(); const daysToSun = (7 - day) % 7; end.setDate(now.getDate() + daysToSun); end.setHours(23,59,59,999);
  const timerEl = document.getElementById('promoTimer');
  const id = setInterval(()=>{
    const diff = end - new Date(); if(diff<=0){ timerEl.innerText='00:00:00'; clearInterval(id); document.getElementById('promoBox').style.display='none'; APPLIED_PROMO=false; localStorage.setItem('amugaharu_promo', JSON.stringify(APPLIED_PROMO)); updateCartUI(); return }
    const h = String(Math.floor(diff/3600000)).padStart(2,'0'); const m = String(Math.floor(diff%3600000/60000)).padStart(2,'0'); const s = String(Math.floor(diff%60000/1000)).padStart(2,'0');
    timerEl.innerText = `${h}:${m}:${s}`;
  },1000);
}
function applyPromo(){
  APPLIED_PROMO = true;
  localStorage.setItem('amugaharu_promo', JSON.stringify(true));
  alert('Promo diterapkan di keranjang (diskon '+CONFIG.promo.weekendDiscountPercent+'%)');
  updateCartUI();
  document.getElementById('promoBox').classList.add('hidden');
  gaTrack('apply_promo', { promo_id: 'WEEKEND_10' });
}


/***** FAQ Accordion Logic *****/
const FAQS = [
  { q: 'Apakah gaharu ini asli?', a: 'Ya, kami menjamin 100% keaslian gaharu dari sumber terverifikasi. Setiap produk premium disertai sertifikat.' },
  { q: 'Bagaimana cara membedakan gaharu asli?', a: 'Gaharu asli memiliki aroma yang khas, tidak menyengat, dan tahan lama. Serat kayunya padat dan tenggelam di air (untuk kualitas super).' },
  { q: 'Berapa lama pengiriman?', a: 'Estimasi pengiriman 2-4 hari kerja untuk Jabodetabek dan 4-7 hari kerja untuk luar pulau, tergantung jasa kirim yang dipilih.' },
  { q: 'Apakah kemasannya aman?', a: 'Sangat aman. Kami menggunakan kemasan eksklusif yang kokoh dan dilapisi bubble wrap tebal untuk memastikan produk tiba dengan selamat.' }
];

function initFaq() {
  const container = document.getElementById('faqContainer');
  container.innerHTML = '';
  FAQS.forEach(faq => {
    const item = document.createElement('div');
    item.className = 'faq-item';
    item.innerHTML = `
      <div class="faq-q">${faq.q}</div>
      <div class="faq-a"><p>${faq.a}</p></div>
    `;
    item.addEventListener('click', () => {
      item.classList.toggle('active');
      gaTrack('toggle_faq', { question: faq.q });
    });
    container.appendChild(item);
  });
}

/***** Scroll Animation Logic *****/
function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.reveal').forEach(el => {
    observer.observe(el);
  });
}

/***** Menu Overlay Logic *****/
function attachMenuEvents() {
  const menuBtn = document.getElementById('menuBtn');
  const closeMenuBtn = document.getElementById('closeMenuBtn');
  const menuOverlay = document.getElementById('menuOverlay');
  const overlayLinks = document.querySelectorAll('#menuOverlay .overlay-nav a');

  menuBtn.addEventListener('click', () => {
    menuOverlay.classList.add('open');
  });

  closeMenuBtn.addEventListener('click', () => {
    menuOverlay.classList.remove('open');
  });

  overlayLinks.forEach(link => {
    link.addEventListener('click', () => {
      menuOverlay.classList.remove('open');
    });
  });
}

/***** [BARU] Typewriter Effect Logic *****/
function startTypewriter() {
    const subheadlineElement = document.getElementById('heroSubheadline');
    if (!subheadlineElement) return;

    let textIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    const typingSpeed = 100; // milliseconds per character
    const deletingSpeed = 50;
    const delayBetweenTexts = 2000; // milliseconds

    function type() {
        const currentText = CONFIG.typewriterTexts[textIndex];
        let displayText = '';

        if (isDeleting) {
            // Deleting phase
            displayText = currentText.substring(0, charIndex - 1);
            charIndex--;
        } else {
            // Typing phase
            displayText = currentText.substring(0, charIndex + 1);
            charIndex++;
        }

        subheadlineElement.innerHTML = `${displayText}<span class="typewriter-cursor">|</span>`;

        let typeSpeed = isDeleting ? deletingSpeed : typingSpeed;

        if (!isDeleting && charIndex === currentText.length) {
            // Finished typing this text
            typeSpeed = delayBetweenTexts; // Pause before deleting
            isDeleting = true;
        } else if (isDeleting && charIndex === 0) {
            // Finished deleting this text
            isDeleting = false;
            textIndex = (textIndex + 1) % CONFIG.typewriterTexts.length; // Move to next text
            typeSpeed = 500; // Short pause before typing next text
        }

        setTimeout(type, typeSpeed);
    }

    // Initial call
    setTimeout(type, 500); // Start after a short delay
}

/***** [BARU] Smoke Effect Logic *****/
function initSmokeEffect() {
  const canvas = document.getElementById('smokeCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  let particles = [];
  const particleCount = 50;

  function Particle() {
    this.x = Math.random() * canvas.width;
    this.y = canvas.height + Math.random() * 100;
    this.vx = (Math.random() - 0.5) * 0.3;
    this.vy = -(Math.random() * 1.5 + 0.5);
    this.radius = Math.random() * 30 + 20;
    this.alpha = Math.random() * 0.1 + 0.05;
  }

  function createParticles() {
    particles = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;

      if (p.y < -p.radius) {
        p.x = Math.random() * canvas.width;
        p.y = canvas.height + p.radius;
        p.alpha = Math.random() * 0.1 + 0.05;
      }

      p.alpha *= 0.995;

      let gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
      gradient.addColorStop(0, `rgba(197, 155, 75, ${p.alpha * 0.5})`);
      gradient.addColorStop(0.5, `rgba(197, 155, 75, ${p.alpha * 0.2})`);
      gradient.addColorStop(1, `rgba(197, 155, 75, 0)`);

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    requestAnimationFrame(animate);
  }

  createParticles();
  animate();

  window.addEventListener('resize', () => {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    createParticles();
  });
}


/***** Init listeners *****/
function attachEvents(){
  document.addEventListener('keydown', (e)=>{ if(e.key==='Escape') { closeModal('productModal'); closeModal('cartModal'); document.getElementById('menuOverlay').classList.remove('open'); } }); // Also close overlay

  document.querySelectorAll('a[href^="#"]').forEach(a=>a.addEventListener('click', function(e){
    if (!a.closest('.overlay-nav')) { // Don't prevent default for overlay links
      e.preventDefault();
    }
    const tgt = this.getAttribute('href'); if(tgt==='#') return;
    const targetElement = document.querySelector(tgt);
    if (targetElement) {
        const headerOffset = 70;
        const elementPosition = targetElement.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
             top: offsetPosition,
             behavior: "smooth"
        });
    } else {
        console.warn(`Target elemen '${tgt}' tidak ditemukan.`);
    }
  }));


  document.querySelectorAll('#filterPills button').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('#filterPills button').forEach(b => b.classList.remove('active'));
      e.currentTarget.classList.add('active');
      renderProducts();
    });
  });

  document.getElementById('openCartBtn').addEventListener('click', () => openModal('cartModal'));

  document.getElementById('productModal').addEventListener('click', (e) => {
    if(e.target.id === 'productModal') closeModal('productModal');
  });
  document.getElementById('cartModal').addEventListener('click', (e) => {
    if(e.target.id === 'cartModal') closeModal('cartModal');
  });
}

// DOM ready
document.addEventListener('DOMContentLoaded', init);