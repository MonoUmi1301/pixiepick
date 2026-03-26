document.addEventListener("DOMContentLoaded", () => { 
    const editProfileForm = document.getElementById("editProfileForm");
    const cancelBtn = document.getElementById("cancelBtn");

    const user = JSON.parse(localStorage.getItem("user"));
    if (user) {
        document.getElementById("firstname").value = user.firstname;
        document.getElementById("lastname").value = user.lastname;
        document.getElementById("email").value = user.email;
        document.getElementById("age").value = user.age || "";
        const gender = document.querySelector(`input[name="gender"][value="${user.gender}"]`);
        if (gender) gender.checked = true;
        document.getElementById("interests").value = user.interests || "";
        document.getElementById("description").value = user.description || "";
        document.getElementById("paymentMethod").value = user.paymentMethod || "";
    }

    editProfileForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const updatedUser = {
            email: document.getElementById("email").value,
            firstname: document.getElementById("firstname").value,
            lastname: document.getElementById("lastname").value,
            age: document.getElementById("age").value || null,
            gender: document.querySelector('input[name="gender"]:checked')?.value || null,
            interests: document.getElementById("interests").value 
                ? JSON.stringify(document.getElementById("interests").value.split(","))
                : null,
            description: document.getElementById("description").value || null,
            payment_method: document.getElementById("paymentMethod").value || null,
        };

        try {
            const response = await fetch("http://127.0.0.1:8888/users/update", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updatedUser),
            });

            if (response.ok) {
                const result = await response.json();
                alert(result.message);
                window.location.href = "../homepage.html";
            } else {
                throw new Error("Failed to update profile.");
            }
        } catch (error) {
            console.error("Error:", error);
            alert("ไม่สามารถบันทึกโปรไฟล์ได้ กรุณาลองใหม่อีกครั้ง");
        }
    });

    cancelBtn.addEventListener("click", function () {
        if (confirm("คุณต้องการยกเลิกการแก้ไขโปรไฟล์หรือไม่?")) {
            window.location.href = "../homepage.html"; 
        }
    });
});