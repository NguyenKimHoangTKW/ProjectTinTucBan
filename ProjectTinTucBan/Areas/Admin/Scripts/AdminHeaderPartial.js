$(document).ready(function () {
    // Bắt sự kiện click vào nút đăng xuất
    $('#logoutButton, #logoutButtons').on('click', function () {
        // Gọi API để xóa session
        $.ajax({
            url: '/api/v1/admin/clear_session',
            type: 'POST',
            dataType: 'json',
            contentType: 'application/json',
            xhrFields: {
                withCredentials: true
            },
            success: function (data) {
                if (data.success) {
                    // Sử dụng jQuery thay vì JS thuần để chuyển hướng
                    $(location).attr('href', '/Home/Login');
                } else {
                    Sweet_Alert('error', 'Đăng xuất không thành công, vui lòng thử lại.');
                }
            },
            error: function (xhr, status, error) {
                Sweet_Alert('error', 'Có lỗi xảy ra khi đăng xuất, vui lòng thử lại.');
            }
        });
    });
});