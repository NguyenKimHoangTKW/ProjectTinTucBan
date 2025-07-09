
﻿document.addEventListener('DOMContentLoaded', function () {
    var logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', function () {
            // Call the API to clear session
            fetch('/api/v1/admin/clear_session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                credentials: 'same-origin'
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        // Redirect to login page on success
                        window.location.href = '/Admin/InterfaceAdmin/Index';
                    } else {
                        console.error('Logout failed');
                        alert('Đăng xuất không thành công, vui lòng thử lại.');
                    }
                })
                .catch(error => {
                    console.error('Error during logout:', error);
                    alert('Có lỗi xảy ra khi đăng xuất, vui lòng thử lại.');
                });
        });
    }
});