// ใช้ CONFIG.API_URL จาก config.js (โหลดก่อน script นี้)
const API = CONFIG.API_URL;

document.addEventListener("DOMContentLoaded", () => {
    loadProducts();
    setupCart();
    loadCart();
    setupMenuToggle();
    updateUserUI();

    const editProfileBtn = document.getElementById('editProfileBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const userDetailsBtn = document.getElementById('userDetails');
    const checkoutButton = document.getElementById('checkoutButton');

    if (editProfileBtn) editProfileBtn.addEventListener('click', editProfile);
    if (logoutBtn) logoutBtn.addEventListener('click', logout);
    if (userDetailsBtn) userDetailsBtn.addEventListener('click', showUserProfile);

    if (checkoutButton) {
        checkoutButton.addEventListener('click', () => {
            const user = JSON.parse(localStorage.getItem('user'));
            const cart = JSON.parse(localStorage.getItem("cart")) || [];
            if (!user) { alert('กรุณาล็อกอินก่อนที่จะชำระเงิน'); return; }
            if (cart.length === 0) { alert('ตะกร้าสินค้าของคุณว่างเปล่า'); return; }
            document.getElementById("checkoutModal").style.display = "flex";
        });
    }

    const closeModal = document.getElementById("closeModal");
    if (closeModal) {
        closeModal.addEventListener("click", () => {
            document.getElementById("checkoutModal").style.display = "none";
        });
    }

    const confirmCheckout = document.getElementById("confirmCheckout");
    if (confirmCheckout) {
        confirmCheckout.addEventListener("click", async () => {
            const user = JSON.parse(localStorage.getItem("user"));
            const cart = JSON.parse(localStorage.getItem("cart")) || [];
            if (!user) { alert("กรุณาล็อกอินก่อนสั่งซื้อ"); return; }
            if (cart.length === 0) { alert("ตะกร้าของคุณว่างเปล่า"); return; }

            const shippingAddress = document.getElementById("shippingAddress").value;
            const paymentMethod = document.getElementById("paymentMethod").value;
            if (!shippingAddress) { alert("กรุณากรอกที่อยู่"); return; }

            const orderData = {
                user_id: user.id,
                items: cart,
                total_price: cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
                shipping_address: shippingAddress,
                payment_method: paymentMethod,
                status: "pending",
            };

            try {
                const response = await fetch(`${API}/orders`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(orderData)
                });
                const result = await response.json();
                if (response.status === 201) {
                    alert(`🎉 สั่งซื้อสำเร็จ! เลขที่ออเดอร์: ${result.orderId}`);
                    localStorage.removeItem("cart");
                    updateCartUI([]);
                    document.getElementById("checkoutModal").style.display = "none";
                } else {
                    alert("❌ มีข้อผิดพลาดในการสั่งซื้อ: " + (result.message || ""));
                }
            } catch (error) {
                alert("❌ ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์");
                console.error(error);
            }
        });
    }
});

async function showUserProfile() {
    const user = await getUserDetails();
    if (user) {
        document.getElementById('userProfile').style.display = 'block';
        document.getElementById('profileName').textContent = `ชื่อ: ${user.firstname} ${user.lastname}`;
        document.getElementById('profileEmail').textContent = `อีเมล์: ${user.email}`;
        document.getElementById('profileAge').textContent = `อายุ: ${user.age || 'ไม่ระบุ'}`;
        document.getElementById('profileGender').textContent = `เพศ: ${user.gender || 'ไม่ระบุ'}`;
        document.getElementById('profileInterests').textContent = `สิ่งที่สนใจ: ${user.interests || 'ไม่ระบุ'}`;
        document.getElementById('profileDescription').textContent = `คำอธิบาย: ${user.description || 'ไม่ระบุ'}`;
        document.getElementById('profilePay').textContent = `เลือกชำระผ่าน: ${user.payment_method || 'ไม่ระบุ'}`;
        const el = document.getElementById('userfirstname');
        if (el) el.textContent = user.firstname || 'ผู้ใช้';
        if (document.getElementById('useremail')) document.getElementById('useremail').textContent = user.email || '';
        if (document.getElementById('userage')) document.getElementById('userage').textContent = user.age || 'ไม่ระบุ';
        if (document.getElementById('usergender')) document.getElementById('usergender').textContent = user.gender || 'ไม่ระบุ';
        document.getElementById('profileMenu').style.display = 'block';
    } else {
        alert('กรุณาล็อกอินก่อนที่จะดูโปรไฟล์');
    }
}

async function getUserDetails() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || !user.id) { alert('ไม่มีข้อมูลผู้ใช้ที่ล็อกอิน'); return null; }
    try {
        const response = await fetch(`${API}/users/profile/${user.id}`);
        if (response.ok) return await response.json();
        alert('ไม่สามารถดึงข้อมูลผู้ใช้ได้');
        return null;
    } catch (error) {
        console.error('Error:', error);
        alert('เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้');
        return null;
    }
}

function logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('cart');
    updateUserUI();
    updateCartUI([]);
    alert('ออกจากระบบสำเร็จ');
    const profileMenu = document.getElementById('profileMenu');
    if (profileMenu) profileMenu.classList.remove('visible');
    window.location.href = 'homepage.html';
}

function updateUserUI() {
    const user = JSON.parse(localStorage.getItem('user'));
    const userInfoDiv = document.getElementById('userInfo');
    const loginBtn = document.getElementById('loginBtn');
    const signupBtn = document.getElementById('signupBtn');
    const adminButtonContainer = document.getElementById("adminButtonContainer");
    if (user && userInfoDiv) {
        const el = document.getElementById('userfirstname');
        if (el) el.textContent = user.firstname || 'ผู้ใช้';
        if (loginBtn) loginBtn.style.display = 'none';
        if (signupBtn) signupBtn.style.display = 'none';
        if (adminButtonContainer) adminButtonContainer.style.display = user.role === 'admin' ? "block" : "none";
    } else {
        if (loginBtn) loginBtn.style.display = 'inline-block';
        if (signupBtn) signupBtn.style.display = 'inline-block';
        if (adminButtonContainer) adminButtonContainer.style.display = "none";
    }
}

function setupMenuToggle() {
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const profileMenu = document.getElementById('profileMenu');
    if (hamburgerBtn && profileMenu) {
        hamburgerBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            profileMenu.classList.toggle('visible');
        });
        document.addEventListener('click', (e) => {
            if (!profileMenu.contains(e.target) && e.target !== hamburgerBtn)
                profileMenu.classList.remove('visible');
        });
    }
}

function editProfile() { window.location.href = 'login/editProfile.html'; }
function scrollToProducts() {
    const s = document.getElementById('productSection');
    if (s) s.scrollIntoView({ behavior: 'smooth' });
}

async function loadProducts() {
    try {
        const response = await fetch(`${API}/products`);
        if (!response.ok) throw new Error("Failed to load products");
        const products = await response.json();
        const productList = document.getElementById("productList");
        if (!productList) return;
        productList.innerHTML = "";
        products.forEach(product => {
            const card = document.createElement("div");
            card.classList.add("product-card");
            card.innerHTML = `
                <img src="${product.img_url}" alt="${product.name}" loading="lazy">
                <h3>${product.name}</h3>
                <p>${product.price} THB</p>
                <button onclick="addToCart(${product.id}, '${product.name}', ${product.price})">🛒 หยิบใส่ตะกร้า</button>
            `;
            productList.appendChild(card);
        });
    } catch (error) {
        console.error("Error loading products:", error);
    }
}

function setupCart() { updateCartUI(JSON.parse(localStorage.getItem("cart")) || []); }
function loadCart() { updateCartUI(JSON.parse(localStorage.getItem("cart")) || []); }

function addToCart(id, name, price) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    const existing = cart.find(item => item.id === id);
    if (existing) {
        existing.quantity += 1;
        showPopupMessage(`✨ เพิ่ม ${name} อีก 1 ชิ้นแล้ว (${existing.quantity} ชิ้น)`);
    } else {
        cart.push({ id, name, price, quantity: 1 });
        showPopupMessage(`🧚‍♀️ เพิ่ม ${name} ลงตะกร้าแล้ว!`);
    }
    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartUI(cart);
}

function showPopupMessage(message) {
    let container = document.getElementById('popupContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'popupContainer';
        container.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:1000;';
        document.body.appendChild(container);
    }
    const popup = document.createElement('div');
    popup.innerText = message;
    popup.style.cssText = `
        background: linear-gradient(90deg,#F8C8DC,#AEE2FF);color:white;
        padding:12px 20px;border-radius:10px;margin:10px 0;
        box-shadow:0 4px 8px rgba(0,0,0,.2);
        animation:fadeIn .5s,fadeOut .5s 2.5s;font-weight:bold;
    `;
    container.appendChild(popup);
    setTimeout(() => popup.remove(), 3000);
}

const _style = document.createElement('style');
_style.innerHTML = `
    @keyframes fadeIn{from{opacity:0;transform:translateX(50px)}to{opacity:1;transform:translateX(0)}}
    @keyframes fadeOut{from{opacity:1;transform:translateX(0)}to{opacity:0;transform:translateX(50px)}}
`;
document.head.appendChild(_style);

function updateCartUI(cart) {
    const cartList = document.getElementById("cartList");
    const totalEl = document.getElementById("totalPrice");
    if (!cartList || !totalEl) return;
    cartList.innerHTML = "";
    let total = 0;
    if (cart.length === 0) {
        cartList.innerHTML = "<li class='empty-cart'>✨ ตะกร้าสินค้าของคุณว่างเปล่า ✨</li>";
    } else {
        cart.forEach(item => {
            const li = document.createElement("li");
            li.innerHTML = `
                <div><span>${item.name}</span></div>
                <div class="cart-item-controls">
                    <button class="qty-btn" onclick="decreaseQuantity(${item.id})">-</button>
                    <span class="quantity">${item.quantity}</span>
                    <button class="qty-btn" onclick="increaseQuantity(${item.id})">+</button>
                    <span class="price">${item.price * item.quantity} THB</span>
                    <button class="remove-btn" onclick="removeFromCart(${item.id})">ลบ</button>
                </div>`;
            cartList.appendChild(li);
            total += item.price * item.quantity;
        });
    }
    totalEl.innerText = total;
    updateCartBadge(cart);
}

function updateCartBadge(cart) {
    const badge = document.getElementById("cartBadge");
    if (badge) {
        const n = cart.reduce((t, i) => t + i.quantity, 0);
        badge.textContent = n;
        badge.style.display = n > 0 ? 'flex' : 'none';
    }
}

function increaseQuantity(id) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    const item = cart.find(i => i.id === id);
    if (item) { item.quantity++; localStorage.setItem("cart", JSON.stringify(cart)); updateCartUI(cart); }
}

function decreaseQuantity(id) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    const item = cart.find(i => i.id === id);
    if (item && item.quantity > 1) {
        item.quantity--;
        localStorage.setItem("cart", JSON.stringify(cart));
        updateCartUI(cart);
    } else if (item && item.quantity === 1) {
        if (confirm(`ต้องการลบ ${item.name} ออกจากตะกร้าหรือไม่?`)) removeFromCart(id);
    }
}

function removeFromCart(id) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    const idx = cart.findIndex(i => i.id === id);
    if (idx !== -1) {
        const name = cart[idx].name;
        cart.splice(idx, 1);
        localStorage.setItem("cart", JSON.stringify(cart));
        updateCartUI(cart);
        showPopupMessage(`🗑️ ลบ ${name} ออกจากตะกร้าแล้ว`);
    }
}
