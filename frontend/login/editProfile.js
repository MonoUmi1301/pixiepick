const API = CONFIG.API_URL;

document.addEventListener("DOMContentLoaded", () => {
    const editProfileForm = document.getElementById("editProfileForm");
    const cancelBtn = document.getElementById("cancelBtn");

    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) {
        alert("กรุณาล็อกอินก่อน");
        window.location.href = "../login/login.html";
        return;
    }

    fetch(`${API}/users/profile/${user.id}`)
        .then(res => res.json())
        .then(data => {
            document.getElementById("firstname").value = data.firstname || "";
            document.getElementById("lastname").value = data.lastname || "";
            document.getElementById("email").value = data.email || "";
            document.getElementById("age").value = data.age || "";
            const gender = document.querySelector(`input[name="gender"][value="${data.gender}"]`);
            if (gender) gender.checked = true;
            document.getElementById("interests").value = data.interests || "";
            document.getElementById("description").value = data.description || "";
            document.getElementById("paymentMethod").value = data.payment_method || "";
        })
        .catch(() => {
            document.getElementById("firstname").value = user.firstname || "";
            document.getElementById("lastname").value = user.lastname || "";
            document.getElementById("email").value = user.email || "";
            document.getElementById("paymentMethod").value = user.payment_method || "";
        });

    editProfileForm.addEventListener("submit", async function (event) {
        event.preventDefault();
        const updatedUser = {
            email: document.getElementById("email").value,
            firstname: document.getElementById("firstname").value,
            lastname: document.getElementById("lastname").value,
            age: document.getElementById("age").value || null,
            gender: document.querySelector('input[name="gender"]:checked')?.value || null,
            interests: document.getElementById("interests").value || null,
            description: document.getElementById("description").value || null,
            payment_method: document.getElementById("paymentMethod").value || null,
        };
        try {
            const response = await fetch(`${API}/users/update`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updatedUser),
            });
            if (response.ok) {
                const result = await response.json();
                localStorage.setItem("user", JSON.stringify({ ...user, ...updatedUser }));
                alert(result.message || "บันทึกโปรไฟล์สำเร็จ");
                window.location.href = "../homepage.html";
            } else {
                const err = await response.json();
                alert(err.message || "ไม่สามารถบันทึกโปรไฟล์ได้");
            }
        } catch (error) {
            console.error("Error:", error);
            alert("ไม่สามารถบันทึกโปรไฟล์ได้ กรุณาลองใหม่อีกครั้ง");
        }
    });

    cancelBtn.addEventListener("click", function () {
        if (confirm("คุณต้องการยกเลิกการแก้ไขโปรไฟล์หรือไม่?"))
            window.location.href = "../homepage.html";
    });
});
