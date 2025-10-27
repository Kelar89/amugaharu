/*
  AMU GAHARU - admin-app.js
  - Logic for the form-based admin page
  - Load products, populate form, add, edit, delete, export JSON
  - Penambahan Fitur Image Preview
*/
'use strict';

// --- State ---
let products = []; // Array to hold product data
let editingProductId = null; // Track ID of product being edited

// --- DOM Elements ---
const productListEl = document.getElementById('productList');
const productFormEl = document.getElementById('productForm');
const formTitleEl = document.getElementById('formTitle');
const saveBtnEl = document.getElementById('saveBtn');
const cancelBtnEl = document.getElementById('cancelBtn');
const downloadBtnEl = document.getElementById('downloadBtn');
const copyBtnEl = document.getElementById('copyBtn');
const productCountEl = document.getElementById('productCount');

// --- Form Input Elements ---
const prodIdInput = document.getElementById('prodId');
const prodNameInput = document.getElementById('prodName');
const prodCategoryInput = document.getElementById('prodCategory');
const prodPriceInput = document.getElementById('prodPrice');
const prodUnitInput = document.getElementById('prodUnit');
const prodStockInput = document.getElementById('prodStock');
const prodImgInput = document.getElementById('prodImg');
const prodDescInput = document.getElementById('prodDesc');
const imgPreviewEl = document.getElementById('imgPreview'); // Image Preview Element

// --- Functions ---

/** Loads products from products.json */
async function loadProducts() {
    try {
        const response = await fetch('products.json?t=' + Date.now()); // Cache bust
        if (!response.ok) {
            if (response.status === 404) {
                console.warn('products.json not found. Starting with empty list.');
                products = []; // Start empty if file doesn't exist
            } else {
                throw new Error(`Gagal memuat products.json: ${response.statusText}`);
            }
        } else {
            products = await response.json();
        }
        renderProductList();
        resetForm(); // Ensure form is reset after loading
    } catch (error) {
        console.error(error);
        productListEl.innerHTML = `<p class="ghost" style="color: #ff8a8a;">Error: ${error.message}</p>`;
        products = []; // Reset products array on error
        renderProductList(); // Update count display even on error
    }
}

/** Renders the list of products */
function renderProductList() {
    productListEl.innerHTML = ''; // Clear list
    productCountEl.textContent = products.length; // Update count

    if (products.length === 0) {
        productListEl.innerHTML = '<p class="ghost">Belum ada produk.</p>';
        return;
    }

    products.forEach(product => {
        const item = document.createElement('div');
        item.className = 'product-item';
        item.innerHTML = `
            <img src="${product.img || 'img/placeholder.jpg'}" alt="${product.name}" onerror="this.onerror=null; this.src='img/placeholder.jpg';"> {/* Placeholder if image fails */}
            <div class="product-item-details">
                <h3>${product.name} <small class="ghost">(${product.id})</small></h3>
                <p><strong>Kategori:</strong> ${product.category}</p>
                <p><strong>Harga:</strong> ${formatMoneyAdmin(product.price)} ${product.unit ? `/ ${product.unit}` : ''}</p>
                <p><strong>Stok:</strong> ${product.stock}</p>
                <p class="ghost description">${product.desc || '-'}</p>
            </div>
            <div class="product-item-actions">
                <button class="btn btn-edit" onclick="editProduct('${product.id}')">Edit</button>
                <button class="btn btn-delete" onclick="deleteProduct('${product.id}')">Hapus</button>
            </div>
        `;
        productListEl.appendChild(item);
    });
}

/** Updates the image preview */
function updateImagePreview() {
    const path = prodImgInput.value.trim();
    if (path) {
        imgPreviewEl.src = path;
        imgPreviewEl.style.display = 'block'; // Show preview
    } else {
        imgPreviewEl.src = '';
        imgPreviewEl.style.display = 'none'; // Hide preview if path is empty
    }
}

// Error handler for the preview image
imgPreviewEl.onerror = function() {
    this.src = 'img/placeholder.jpg'; // Show placeholder on error
    console.warn("Image preview failed to load:", this.src);
};


/** Populates the form with product data for editing */
function editProduct(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;

    editingProductId = id;

    prodIdInput.value = product.id;
    prodIdInput.readOnly = true; // Prevent editing ID
    prodNameInput.value = product.name;
    prodCategoryInput.value = product.category;
    prodPriceInput.value = product.price;
    prodUnitInput.value = product.unit || '';
    prodStockInput.value = product.stock;
    prodImgInput.value = product.img;
    prodDescInput.value = product.desc || '';

    updateImagePreview(); // Update preview when editing

    formTitleEl.textContent = 'Edit Produk';
    saveBtnEl.textContent = 'Simpan Perubahan';
    cancelBtnEl.style.display = 'inline-block'; // Show cancel button
    productFormEl.scrollIntoView({ behavior: 'smooth', block: 'start' }); // Scroll form into view
}

/** Handles form submission (Add or Update) */
function handleFormSubmit(event) {
    event.preventDefault(); // Prevent default page reload

    const formData = {
        id: prodIdInput.value.trim(),
        name: prodNameInput.value.trim(),
        category: prodCategoryInput.value.trim(),
        price: parseInt(prodPriceInput.value),
        unit: prodUnitInput.value.trim() || null, // Store as null if empty
        stock: parseInt(prodStockInput.value),
        img: prodImgInput.value.trim(),
        desc: prodDescInput.value.trim() || null // Store as null if empty
    };

    // Basic Validation
    if (!formData.id || !formData.name || !formData.category || !formData.img) {
        alert("Field dengan tanda * (bintang) wajib diisi.");
        return;
    }
    if (isNaN(formData.price) || isNaN(formData.stock) || formData.price < 0 || formData.stock < 0) {
        alert("Harga dan Stok harus berupa angka positif.");
        return;
    }
     // Check image path format (simple check)
    if (!formData.img.startsWith('img/') || !/\.(jpg|jpeg|png|webp|gif|ico)$/i.test(formData.img)) {
       if (!confirm(`Path gambar "${formData.img}" tidak umum (tidak diawali 'img/' atau ekstensi tidak standar). Yakin ingin melanjutkan?`)) {
          return;
       }
    }


    if (editingProductId) {
        // Update existing product
        const index = products.findIndex(p => p.id === editingProductId);
        if (index > -1) {
            products[index] = formData;
        }
    } else {
        // Add new product
        // Check if ID already exists
        if (products.some(p => p.id === formData.id)) {
            alert(`ID Produk "${formData.id}" sudah digunakan. Harap gunakan ID unik.`);
            prodIdInput.focus(); // Focus on ID input
            return;
        }
        products.push(formData);
    }

    // Sort products by ID after adding/editing for consistency
    products.sort((a, b) => a.id.localeCompare(b.id));

    renderProductList();
    resetForm();
    alert(`Produk berhasil ${editingProductId ? 'diperbarui' : 'ditambahkan'}! Jangan lupa Download/Copy JSON dan upload ke GitHub.`);
}

/** Resets the form to its initial state */
function resetForm() {
    productFormEl.reset(); // Clears all input fields
    editingProductId = null;
    prodIdInput.readOnly = false; // Make ID editable again for new products
    formTitleEl.textContent = 'Tambah Produk Baru';
    saveBtnEl.textContent = 'Tambah Produk';
    cancelBtnEl.style.display = 'none'; // Hide cancel button
    updateImagePreview(); // Reset preview image
}

/** Deletes a product */
function deleteProduct(id) {
    if (confirm(`Yakin ingin menghapus produk "${products.find(p=>p.id===id)?.name || id}"?`)) { // Show name in confirm
        products = products.filter(p => p.id !== id);
        if (editingProductId === id) { // If deleting the product being edited
            resetForm();
        }
        renderProductList();
        alert(`Produk ID "${id}" berhasil dihapus! Jangan lupa Download/Copy JSON dan upload ke GitHub.`);
    }
}

/** Generates JSON and initiates download */
function downloadJson() {
    try {
        const jsonString = JSON.stringify(products, null, 2); // Pretty print JSON
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'products.json';
        document.body.appendChild(a); // Required for Firefox
        a.click();
        document.body.removeChild(a); // Clean up
        URL.revokeObjectURL(url);
    } catch (e) {
        alert('Gagal membuat file JSON: ' + e.message);
    }
}

/** Copies the generated JSON to clipboard */
function copyJson() {
    try {
        if (products.length === 0) {
            alert('Tidak ada produk untuk disalin.');
            return;
        }
        const jsonString = JSON.stringify(products, null, 2); // Pretty print JSON
        navigator.clipboard.writeText(jsonString)
            .then(() => alert('JSON produk berhasil disalin ke clipboard!'))
            .catch(err => {
                console.error('Copy JSON error:', err);
                alert('Gagal menyalin JSON: ' + err + '\n\nMungkin browser Anda tidak mendukung fitur ini atau izin tidak diberikan.');
             });
    } catch (e) {
        alert('Gagal membuat JSON: ' + e.message);
    }
}

/** Simple money formatter for admin (no currency symbol) */
function formatMoneyAdmin(value) {
    if (isNaN(value)) return 'N/A';
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

// --- Event Listeners ---
productFormEl.addEventListener('submit', handleFormSubmit);
cancelBtnEl.addEventListener('click', resetForm);
downloadBtnEl.addEventListener('click', downloadJson);
copyBtnEl.addEventListener('click', copyJson);
prodImgInput.addEventListener('input', updateImagePreview); // Listener for image preview

// --- Initial Load ---
document.addEventListener('DOMContentLoaded', loadProducts);