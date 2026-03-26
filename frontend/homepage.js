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

    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', editProfile);
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    if (userDetailsBtn) {
        userDetailsBtn.addEventListener('click', showUserProfile);
    }

    if (checkoutButton) {
        checkoutButton.addEventListener('click', checkout);
    }
});

async function showUserProfile() {
    const user = await getUserDetails();
    
    if (user) {
        const profileDiv = document.getElementById('userProfile');
        profileDiv.style.display = 'block';

        document.getElementById('profileName').textContent = `ชื่อ: ${user.firstname} ${user.lastname}`;
        document.getElementById('profileEmail').textContent = `อีเมล์: ${user.email}`;
        document.getElementById('profileAge').textContent = `อายุ: ${user.age}`;
        document.getElementById('profileGender').textContent = `เพศ: ${user.gender}`;
        document.getElementById('profileInterests').textContent = `สิ่งที่สนใจ: ${user.interests}`;
        document.getElementById('profileDescription').textContent = `คำอธิบาย: ${user.description}`;
        document.getElementById('profilePay').textContent = `เลือกชำระผ่าน: ${user.payment_method}`;
    } else {
        alert('กรุณาล็อกอินก่อนที่จะดูโปรไฟล์');
    }
}

async function getUserDetails() {
    const user = JSON.parse(localStorage.getItem('user')); 
    
    if (!user || !user.id) {
        alert('ไม่มีข้อมูลผู้ใช้ที่ล็อกอิน');
        return null; 
    }
    
    try {
        const response = await fetch(`http://127.0.0.1:8888/users/profile/${user.id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            return data;
        } else {
            console.error('ไม่สามารถดึงข้อมูลผู้ใช้ได้:', await response.text());
            alert('ไม่สามารถดึงข้อมูลผู้ใช้ได้');
            return null;
        }
    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้:', error);
        alert('เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้');
        return null;
    }
}

document.getElementById('userDetails').addEventListener('click', async () => {
    const userDetails = await getUserDetails();

    if (userDetails) {
        document.getElementById('userfirstname').textContent = userDetails.firstname || 'ไม่ระบุ';
        document.getElementById('useremail').textContent = userDetails.email || 'ไม่ระบุ';
        document.getElementById('userage').textContent = userDetails.age || 'ไม่ระบุ';
        document.getElementById('usergender').textContent = userDetails.gender || 'ไม่ระบุ';
        document.getElementById('profileMenu').style.display = 'block';
    }
});

function logout() {
    localStorage.removeItem('user');
    updateUserUI();
    alert('ออกจากระบบสำเร็จ');

    const profileMenu = document.getElementById('profileMenu');
    if (profileMenu) {
        profileMenu.classList.remove('visible');
    }

    window.location.href = 'homepage.html';
}

function updateUserUI() {
    const user = JSON.parse(localStorage.getItem('user'));
    const userInfoDiv = document.getElementById('userInfo');
    const loginBtn = document.getElementById('loginBtn');
    const signupBtn = document.getElementById('signupBtn');
    const adminButtonContainer = document.getElementById("adminButtonContainer");

    if (user && userInfoDiv) {
        const userfirstname = document.getElementById('userfirstname');
        if (userfirstname) {
            userfirstname.textContent = user.firstname || 'ผู้ใช้';
        }

        if (loginBtn) loginBtn.style.display = 'none';
        if (signupBtn) signupBtn.style.display = 'none';

        if (user.role === 'admin' && adminButtonContainer) {
            adminButtonContainer.style.display = "block";
        } else if (adminButtonContainer) {
            adminButtonContainer.style.display = "none";
        }
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
        hamburgerBtn.addEventListener('click', () => {
            profileMenu.classList.toggle('visible');
        });
        
        document.addEventListener('click', (e) => {
            if (!profileMenu.contains(e.target) && e.target !== hamburgerBtn) {
                profileMenu.classList.remove('visible');
            }
        });
    }
}

function editProfile() {
    window.location.href = 'login/editProfile.html';
}

function scrollToProducts() {
    const productSection = document.getElementById('productSection');
    if (productSection) {
        productSection.scrollIntoView({ behavior: 'smooth' });
    }
}

async function loadProducts() {
    try {
        const response = await fetch("http://127.0.0.1:8888/products");
        let products = [];

        if (response.ok) {
            products = await response.json();
        } else {
            throw new Error("Failed to load products from the server");
        }

        const productList = document.getElementById("productList");
        if (!productList) return;

        productList.innerHTML = "";

        products.forEach(product => {
            const productCard = document.createElement("div");
            productCard.classList.add("product-card");
            productCard.innerHTML = `
                <img src="${product.img_url}" alt="${product.name}" loading="lazy">
                <h3>${product.name}</h3>
                <p>${product.price} THB</p>
                <button onclick="addToCart(${product.id}, '${product.name}', ${product.price})">🛒 หยิบใส่ตะกร้า</button>
            `;
            productList.appendChild(productCard);
        });
    } catch (error) {
        console.error("Error loading products:", error);
    }
}

function setupCart() {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    updateCartUI(cart);
}

function loadCart() {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    updateCartUI(cart);
}

function addToCart(id, name, price) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    const existingProduct = cart.find(item => item.id === id);

    if (existingProduct) {
        existingProduct.quantity += 1;
        showPopupMessage(`✨ เพิ่ม ${name} อีก 1 ชิ้นแล้ว (${existingProduct.quantity} ชิ้น)`);
    } else {
        cart.push({ id, name, price, quantity: 1 });
        showPopupMessage(`🧚‍♀️ เพิ่ม ${name} ลงตะกร้าแล้ว!`);
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartUI(cart);
}

function showPopupMessage(message) {
    let popupContainer = document.getElementById('popupContainer');

    if (!popupContainer) {
        popupContainer = document.createElement('div');
        popupContainer.id = 'popupContainer';
        popupContainer.style.position = 'fixed';
        popupContainer.style.bottom = '20px';
        popupContainer.style.right = '20px';
        popupContainer.style.zIndex = '1000';
        document.body.appendChild(popupContainer);
    }

    const popup = document.createElement('div');
    popup.className = 'popup-message';
    popup.innerText = message;
    popup.style.cssText = `
        background: linear-gradient(90deg, #F8C8DC, #AEE2FF);
        color: white;
        padding: 12px 20px;
        border-radius: 10px;
        margin: 10px 0;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        animation: fadeIn 0.5s, fadeOut 0.5s 2.5s;
        font-weight: bold;
    `;

    popupContainer.appendChild(popup);
    setTimeout(() => popup.remove(), 3000);
}

const style = document.createElement('style');
style.innerHTML = `
    @keyframes fadeIn {
        from { opacity: 0; transform: translateX(50px); }
        to { opacity: 1; transform: translateX(0); }
    }
    @keyframes fadeOut {
        from { opacity: 1; transform: translateX(0); }
        to { opacity: 0; transform: translateX(50px); }
    }
`;
document.head.appendChild(style);

function updateCartUI(cart) {
    const cartList = document.getElementById("cartList");
    const totalPriceElement = document.getElementById("totalPrice");

    if (!cartList || !totalPriceElement) return;

    cartList.innerHTML = "";
    let totalPrice = 0;

    if (cart.length === 0) {
        cartList.innerHTML = "<li class='empty-cart'>✨ ตะกร้าสินค้าของคุณว่างเปล่า ✨</li>";
    } else {
        cart.forEach(item => {
            const listItem = document.createElement("li");
            listItem.innerHTML = `
                <div>
                    <span>${item.name}</span>
                </div>
                <div class="cart-item-controls">
                    <button class="qty-btn" onclick="decreaseQuantity(${item.id})">-</button>
                    <span class="quantity">${item.quantity}</span>
                    <button class="qty-btn" onclick="increaseQuantity(${item.id})">+</button>
                    <span class="price">${item.price * item.quantity} THB</span>
                    <button class="remove-btn" onclick="removeFromCart(${item.id})">ลบ</button>
                </div>
            `;
            cartList.appendChild(listItem);
            totalPrice += item.price * item.quantity;
        });
    }

    totalPriceElement.innerText = totalPrice;
    updateCartBadge(cart);
}

function updateCartBadge(cart) {
    const cartBadge = document.getElementById("cartBadge");
    if (cartBadge) {
        const totalItems = cart.reduce((total, item) => total + item.quantity, 0);

        if (totalItems > 0) {
            cartBadge.textContent = totalItems;
            cartBadge.style.display = 'flex';
        } else {
            cartBadge.style.display = 'none';
        }
    }
}

function increaseQuantity(id) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    const item = cart.find(item => item.id === id);

    if (item) {
        item.quantity += 1;
        localStorage.setItem("cart", JSON.stringify(cart));
        updateCartUI(cart);
    }
}

function decreaseQuantity(id) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    const item = cart.find(item => item.id === id);

    if (item && item.quantity > 1) {
        item.quantity -= 1;
        localStorage.setItem("cart", JSON.stringify(cart));
        updateCartUI(cart);
    } else if (item && item.quantity === 1) {
        if (confirm(`ต้องการลบ ${item.name} ออกจากตะกร้าหรือไม่?`)) {
            removeFromCart(id);
        }
    }
}

function removeFromCart(id) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    const itemIndex = cart.findIndex(item => item.id === id);

    if (itemIndex !== -1) {
        const itemName = cart[itemIndex].name;
        cart.splice(itemIndex, 1);
        localStorage.setItem("cart", JSON.stringify(cart));
        updateCartUI(cart);
        showPopupMessage(`🗑️ ลบ ${itemName} ออกจากตะกร้าแล้ว`);
    }
}

function checkout() {
    const user = JSON.parse(localStorage.getItem('user'));
    const cart = JSON.parse(localStorage.getItem("cart")) || [];

    if (cart.length === 0) {
        alert('ตะกร้าสินค้าของคุณว่างเปล่า');
        return;
    }

    if (!user) {
        alert('กรุณาล็อกอินก่อนที่จะชำระเงิน');
        return;
    }

    const totalAmount = cart.reduce((total, item) => total + item.price * item.quantity, 0);
    alert(`ยอดรวมที่ต้องชำระ: ${totalAmount} THB`);
}

document.getElementById("checkoutButton").addEventListener("click", () => {
    document.getElementById("checkoutModal").style.display = "flex";
});

document.getElementById("closeModal").addEventListener("click", () => {
    document.getElementById("checkoutModal").style.display = "none";
});

document.getElementById("confirmCheckout").addEventListener("click", async () => {
    const user = JSON.parse(localStorage.getItem("user"));
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    
    if (!user) {
        alert("กรุณาล็อกอินก่อนสั่งซื้อ");
        return;
    }
    if (cart.length === 0) {
        alert("ตะกร้าของคุณว่างเปล่า");
        return;
    }

    const shippingAddress = document.getElementById("shippingAddress").value;
    const paymentMethod = document.getElementById("paymentMethod").value;

    if (!shippingAddress) {
        alert("กรุณากรอกที่อยู่");
        return;
    }

    const orderData = {
        user_id: user.id,
        items: cart,
        total_price: cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
        shipping_address: shippingAddress,
        payment_method: paymentMethod,
        status: "pending",
    };
    
    try {
        const response = await axios.post("http://127.0.0.1:8888/orders", orderData);

        if (response.status === 201) {
            alert(`🎉 สั่งซื้อสำเร็จ! เลขที่ออเดอร์: ${response.data.orderId}`);
            localStorage.removeItem("cart");
            updateCartUI([]);
            document.getElementById("checkoutModal").style.display = "none";
        } else {
            alert("❌ มีข้อผิดพลาดในการสั่งซื้อ");
        }
    } catch (error) {
        alert("❌ ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์");
        console.error(error);
    }
});