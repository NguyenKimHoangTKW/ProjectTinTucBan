$(document).ready(function () {
    // Kiểm tra session khi trang đã tải xong
    checkUserSession();

    // Hàm kiểm tra session
    function checkUserSession() {
        $.ajax({
            url: '/api/v1/admin/current-user',
            type: 'GET',
            dataType: 'json',
            success: function (response) {
                if (response.success && response.isLoggedIn) {
                    // Hiển thị thông tin người dùng nếu đã đăng nhập
                    displayUserInfo(response.user);
                } else {
                    // Nếu chưa đăng nhập, có thể chuyển hướng đến trang đăng nhập
                    handleNotLoggedIn();
                }
            },
            error: function (xhr, status, error) {
                handleSessionError();
            }
        });
    }

    // Hiển thị thông tin người dùng
    function displayUserInfo(user) {
        // Hiển thị thông tin người dùng trên trang

        // Hiển thị một thông báo hoặc cập nhật UI với thông tin người dùng
        var userInfoHtml = `
            <div class="session-info alert alert-success">
                <h5>Thông tin đăng nhập</h5>
                <ul>
                    <li><strong>Tên đăng nhập:</strong> ${user.username}</li>
                    <li><strong>Email:</strong> ${user.email}</li>
                    <li><strong>Vai trò:</strong> ${getRoleName(user.role)}</li>
                </ul>
            </div>
        `;

        // Chèn thông tin vào một phần tử trên trang (ví dụ: trước thống kê)
        $(".main-content .container-fluid").prepend(userInfoHtml);
    }

    // Xử lý khi không có session
    function handleNotLoggedIn() {

        // Hiển thị cảnh báo
        var warningHtml = `
            <div class="session-warning alert alert-warning">
                <h5>Cảnh báo</h5>
                <p>Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn.</p>
                <a href="/Admin/InterfaceAdmin/Login" class="btn btn-primary">Đăng nhập ngay</a>
            </div>
        `;
        $(".main-content .container-fluid").prepend(warningHtml);

        // Tùy chọn: có thể tự động chuyển hướng sau vài giây
        // setTimeout(function() {
        //     window.location.href = '/Admin/InterfaceAdmin/Login';
        // }, 3000);
    }

    // Xử lý lỗi khi kiểm tra session
    function handleSessionError() {
        var errorHtml = `
            <div class="session-error alert alert-danger">
                <h5>Lỗi</h5>
                <p>Đã xảy ra lỗi khi kiểm tra thông tin đăng nhập. Vui lòng tải lại trang.</p>
            </div>
        `;
        $(".main-content .container-fluid").prepend(errorHtml);
    }

    // Hàm hỗ trợ: lấy tên vai trò từ ID
    function getRoleName(roleId) {
        switch (roleId) {
            case 1:
                return "Quản trị viên";
            case 4:
                return "Biên tập viên";
            default:
                return "Chưa phân quyền";
        }
    }
});