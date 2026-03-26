const API_BASE = "http://127.0.0.1:8888/api";

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

  axios.get(`${API_BASE}/all-users`)
    .then(res => displayUsers(res.data))
    .catch(err => console.error("Error loading users on page load:", err));

  axios.get(`${API_BASE}/check-role`)
    .then(res => {
      if (res.data.role === "admin") {
        if (adminSection) adminSection.style.display = "block";
      }
    })
    .catch(err => console.error("Error checking role:", err));

  searchBtn?.addEventListener("click", () => {
    const query = document.getElementById("searchInput").value.trim();
    if (!query) return;
    axios.get(`${API_BASE}/search?query=${encodeURIComponent(query)}`)
      .then(res => displayUsers(res.data))
      .catch(err => console.error("Error searching users:", err));
  });

  showAllBtn?.addEventListener("click", () => {
    axios.get(`${API_BASE}/all-users`)
      .then(res => displayUsers(res.data))
      .catch(err => console.error("Error fetching all users:", err));
  });

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
      const userEl = document.createElement("div");
      userEl.className = "user-entry";
      userEl.innerHTML = `
        <p>ID: ${user.id}, อีเมล: ${user.email}, ชื่อ: ${user.first_name} ${user.last_name}</p>
        <button class="btn btn-primary" onclick="editUser(${user.id})">แก้ไข</button>
        <button class="btn btn-secondary" onclick="viewOrders(${user.id})">ดูคำสั่งซื้อ</button>
        <button class="btn btn-danger" onclick="confirmDeleteUser(${user.id})">ลบ</button>
      `;
      usersList.appendChild(userEl);
    });
  }

  window.editUser = function (userId) {
    selectedUserId = userId;
    axios.get(`${API_BASE}/user/${userId}`)
      .then(res => {
        const user = res.data;
        editForm.editUserId.value = user.id;
        editForm.editEmail.value = user.email;
        editForm.editFirstname.value = user.first_name;
        editForm.editLastname.value = user.last_name;
        editForm.editAge.value = user.age || "";
        editForm.editGender.value = user.gender || "";
        editForm.editInterests.value = user.interests || "";
        editForm.editDescription.value = user.description || "";
        editForm.editPaymentMethod.value = user.payment_method || "";
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
      .then(() => {
        editModal.style.display = "none";
        alert("บันทึกข้อมูลสำเร็จ");
        showAllBtn.click();
      })
      .catch(err => console.error("Error updating user:", err));
  });

  closeEditModal.addEventListener("click", () => {
    editModal.style.display = "none";
  });

  window.viewOrders = function (userId) {
    axios.get(`${API_BASE}/user/${userId}/orders`)
      .then(res => {
        const ordersList = document.getElementById("userOrdersList");
        ordersList.innerHTML = "";
        if (!res.data.length) {
          ordersList.innerHTML = "<p class='no-data'>ไม่มีคำสั่งซื้อ</p>";
        } else {
          res.data.forEach(order => {
            ordersList.innerHTML += `<p>Order #${order.id} - ${order.status} - ${order.total} บาท</p>`;
          });
        }
        ordersModal.style.display = "block";
      })
      .catch(err => console.error("Error loading orders:", err));
  };

  closeOrdersModal.addEventListener("click", () => {
    ordersModal.style.display = "none";
  });

  window.confirmDeleteUser = function (userId) {
    selectedUserId = userId;
    deleteModal.style.display = "block";
  };

  confirmDelete.addEventListener("click", () => {
    axios.delete(`${API_BASE}/user/${selectedUserId}`)
      .then(() => {
        deleteModal.style.display = "none";
        alert("ลบผู้ใช้สำเร็จ");
        showAllBtn.click();
      })
      .catch(err => console.error("Error deleting user:", err));
  });

  cancelDelete.addEventListener("click", () => {
    deleteModal.style.display = "none";
  });
});