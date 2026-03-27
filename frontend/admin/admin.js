const API_BASE = `${CONFIG.API_URL}/api`;

document.addEventListener("DOMContentLoaded", function () {
    const adminSection = document.getElementById("admin-section");
    const searchBtn = document.getElementById("searchBtn");
    const showAllBtn = document.getElementById("showAllUsers");
    const logoutBtn = document.getElementById("logoutBtn");
    const usersList = document.getElementById("usersList");
    const editModal = document.getElementById("editModal");
    const closeEditModal = document.getElementById("closeEditModal");
    const editForm = document.getElementById("editUserForm");
    const ordersModal = document.getElementById("ordersModal");
    const closeOrdersModal = document.getElementById("closeOrdersModal");
    const deleteModal = document.getElementById("deleteConfirmModal");
    const confirmDelete = document.getElementById("confirmDelete");
    const cancelDelete = document.getElementById("cancelDelete");

    let selectedUserId = null;

    // ตรวจสอบ login และ role ก่อนโหลดหน้า
    const currentUser = JSON.parse(localStorage.getItem("user"));
    if (!currentUser) {
        alert("กรุณาล็อกอินก่อน");
        window.location.href = "../login/login.html";
        return;
    }

    axios.get(`${CONFIG.API_URL}/api/check-role?user_id=${currentUser.id}`)
        .then(res => {
            if (res.data.role === "admin") {
                if (adminSection) adminSection.style.display = "block";
                loadAllUsers();
            } else {
                alert("คุณไม่มีสิทธิ์เข้าถึงหน้านี้");
                window.location.href = "../homepage.html";
            }
        })
        .catch(() => {
            alert("ไม่สามารถตรวจสอบสิทธิ์ได้");
            window.location.href = "../homepage.html";
        });

    function loadAllUsers() {
        axios.get(`${API_BASE}/all-users`)
            .then(res => displayUsers(res.data))
            .catch(err => console.error("Error loading users:", err));
    }

    searchBtn?.addEventListener("click", () => {
        const q = document.getElementById("searchInput").value.trim();
        if (!q) return;
        axios.get(`${API_BASE}/search?query=${encodeURIComponent(q)}`)
            .then(res => displayUsers(res.data))
            .catch(err => console.error("Search error:", err));
    });

    showAllBtn?.addEventListener("click", loadAllUsers);

    logoutBtn?.addEventListener("click", () => {
        localStorage.removeItem("user");
        window.location.href = "../homepage.html";
    });

    function displayUsers(users) {
        usersList.innerHTML = "";
        if (!users.length) {
            usersList.innerHTML = `<p class="no-data">ไม่พบข้อมูลผู้ใช้</p>`;
            return;
        }
        users.forEach(user => {
            const el = document.createElement("div");
            el.className = "user-entry";
            el.innerHTML = `
                <p>ID: ${user.id}, อีเมล: ${user.email}, ชื่อ: ${user.first_name} ${user.last_name}</p>
                <button class="btn btn-primary" onclick="editUser(${user.id})">แก้ไข</button>
                <button class="btn btn-secondary" onclick="viewOrders(${user.id})">ดูคำสั่งซื้อ</button>
                <button class="btn btn-danger" onclick="confirmDeleteUser(${user.id})">ลบ</button>
            `;
            usersList.appendChild(el);
        });
    }

    window.editUser = function (userId) {
        selectedUserId = userId;
        axios.get(`${API_BASE}/user/${userId}`)
            .then(res => {
                const u = res.data;
                editForm.editUserId.value = u.id;
                editForm.editEmail.value = u.email;
                editForm.editFirstname.value = u.first_name;
                editForm.editLastname.value = u.last_name;
                editForm.editAge.value = u.age || "";
                editForm.editGender.value = u.gender || "";
                editForm.editInterests.value = u.interests || "";
                editForm.editDescription.value = u.description || "";
                editForm.editPaymentMethod.value = u.payment_method || "";
                editModal.style.display = "block";
            })
            .catch(err => console.error("Error loading user:", err));
    };

    editForm.addEventListener("submit", function (e) {
        e.preventDefault();
        const data = {
            email: editForm.editEmail.value,
            first_name: editForm.editFirstname.value,
            last_name: editForm.editLastname.value,
            age: editForm.editAge.value,
            gender: editForm.editGender.value,
            interests: editForm.editInterests.value,
            description: editForm.editDescription.value,
            payment_method: editForm.editPaymentMethod.value
        };
        axios.put(`${API_BASE}/user/${selectedUserId}`, data)
            .then(() => { editModal.style.display = "none"; alert("บันทึกข้อมูลสำเร็จ"); loadAllUsers(); })
            .catch(err => console.error("Error updating user:", err));
    });

    closeEditModal.addEventListener("click", () => { editModal.style.display = "none"; });

    window.viewOrders = function (userId) {
        axios.get(`${API_BASE}/user/${userId}/orders`)
            .then(res => {
                const list = document.getElementById("userOrdersList");
                list.innerHTML = !res.data.length
                    ? "<p class='no-data'>ไม่มีคำสั่งซื้อ</p>"
                    : res.data.map(o => `<p>Order #${o.id} - ${o.status} - ${o.total} บาท</p>`).join('');
                ordersModal.style.display = "block";
            })
            .catch(err => console.error("Error loading orders:", err));
    };

    closeOrdersModal.addEventListener("click", () => { ordersModal.style.display = "none"; });

    window.confirmDeleteUser = function (userId) {
        selectedUserId = userId;
        deleteModal.style.display = "block";
    };

    confirmDelete.addEventListener("click", () => {
        axios.delete(`${API_BASE}/user/${selectedUserId}`)
            .then(() => { deleteModal.style.display = "none"; alert("ลบผู้ใช้สำเร็จ"); loadAllUsers(); })
            .catch(err => console.error("Error deleting user:", err));
    });

    cancelDelete.addEventListener("click", () => { deleteModal.style.display = "none"; });
});
