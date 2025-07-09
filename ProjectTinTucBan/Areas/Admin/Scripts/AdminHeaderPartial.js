$(document).ready(function () {
    // Bắt sự kiện click vào nút đăng xuất
    $('#logoutButton').on('click', function () {
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
                    // Chuyển hướng đến trang đăng nhập khi thành công
                    window.location.href = '/Admin/InterfaceAdmin/Index';
                } else {
                    Sweet_Alert('Đăng xuất không thành công, vui lòng thử lại.');
                }
            },
            error: function (xhr, status, error) {
                Sweet_Alert('Có lỗi xảy ra khi đăng xuất, vui lòng thử lại.');
            }
        });
    });
});