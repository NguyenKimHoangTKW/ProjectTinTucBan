$(document).ready(function () {
    // Khởi tạo thành phần Select2 nếu có sẵn
    if ($.fn.select2) {
        $(".select2").select2();
    }

    // Thiết lập tìm kiếm nâng cao và mặc định tải dữ liệu
    setupAdvancedSearch();
    load_data();
    loadRoles();

    // Xử lý sự kiện chuyển tab trong modal
    $('#userModalTabs a').on('click', function (e) {
        e.preventDefault();
        $(this).tab('show');

        // Hiển thị/ẩn các nút phù hợp với tab
        const tabId = $(this).attr('href');
        if (tabId === '#permissions-content') {
            $("#formButtons").hide();
            $("#viewButtons").hide();
            $("#permissionButtons").show();
        } else if (tabId === '#info-content') {
            if ($("#userDetails").is(":visible")) {
                $("#formButtons").hide();
                $("#viewButtons").show();
                $("#permissionButtons").hide();
            } else {
                $("#formButtons").show();
                $("#viewButtons").hide();
                $("#permissionButtons").hide();
            }
        }
    });

    // Sự kiện cho nút "Lưu" trong modal
    $("#btnSaveUser").on("click", function () {
        const formMode = $("#formMode").val();
        if (formMode === "edit") {
            update_User_in_modal();
        }
    });

    // Sự kiện click nút chi tiết
    $(document).on("click", ".btn-detail", function () {
        const id = $(this).data("id");
        openViewUserModal(id);
    });

    // Thêm xử lý sự kiện cho nút phân quyền
    $(document).on("click", ".btn-permissions", function () {
        const id = $(this).data("id");
        const username = $(this).data("username");
        openPermissionsModal(id, username);
    });

    // Sự kiện click nút chỉnh sửa
    $(document).on("click", ".btn-edit", function () {
        const id = $(this).data("id");
        openEditUserModal(id);
    });

    // Sự kiện click nút xóa
    $(document).on("click", ".btn-delete", function () {
        const id = $(this).data("id");
        deleteUser(id);
    });

    $(document).on("change", "#changePasswordCheck", function () {

        if ($(this).is(":checked")) {
            $("#newPasswordFields").slideDown(300);
        } else {
            $("#newPasswordFields").slideUp(300);
        }
    });

    // Thêm xử lý sự kiện cho việc lưu phân quyền
    $("#btnSavePermissions").on("click", function () {
        saveUserPermissions();
    });

    // Thêm xử lý khi đóng modal để đặt lại trạng thái hoàn toàn
    $("#UserModal").on("hidden.bs.modal", function () {
        // Đặt lại tất cả phần tử modal
        $(".form-fields").show();
        $("#userDetails").hide();
        $("#formButtons").show();
        $("#viewButtons").hide();
        $("#permissionButtons").hide();
        $("#changePasswordSection").hide();
        $("#editOnlyFields").hide();

        // Reset tab về tab thông tin
        $('#userModalTabs a[href="#info-content"]').tab('show');

        // Reset form và các giá trị
        $("#UserForm")[0].reset();
        $("#userId").val("");
        $("#permissionUserId").val("");
        $("#permissionUserName").text("");
        $("#formMode").val("edit");

        // Xóa dữ liệu bảng phân quyền
        $("#functionsTableBody").html("");
        $("#noFunctionsMessage").hide();
    });

    // Xóa handler cũ trước khi đăng ký mới
    $(document).off('click', '#btnEditFromView');

    // Đăng ký sự kiện cho nút chỉnh sửa trong modal với cách xử lý tốt hơn
    $(document).on('click', '#btnEditFromView', function (e) {
        e.preventDefault();
        e.stopPropagation(); // Ngăn sự kiện lan truyền

        // Ưu tiên lấy ID từ data-id của nút
        let userId = $(this).attr("data-id");


        // Nếu không có từ button, thử lấy từ hidden field
        if (!userId || userId === "") {
            userId = $("#userId").val();

        }

        if (!userId || userId === "") {
            Sweet_Alert("error", "Không tìm thấy ID tài khoản để chỉnh sửa");
            return;
        }

        switchToEditMode(userId);
    });
});

let dataTableInstance = null;

// Tải danh sách vai trò cho dropdown
function loadRoles() {
    $.ajax({
        url: '/api/v1/admin/Get-All-Roles',
        type: 'GET',
        dataType: 'json',
        success: function (response) {
            if (response.success && response.data) {
                let options = '<option value="">-- Chọn vai trò --</option>';
                response.data.forEach(role => {
                    options += `<option value="${role.ID}">${role.TenRole}</option>`;
                });
                $("#ID_role").html(options);
                $("#searchRole").html('<option value="">-- Tất cả vai trò --</option>' + options);
            }
        },
    });
}

// Thiết lập tìm kiếm nâng cao
function setupAdvancedSearch() {
    // Sự kiện cho nút tìm kiếm
    $(document).on('click', '#btnApplySearch', function () {
        applyAdvancedSearch();
    });

    // Sự kiện cho nút đặt lại
    $(document).on('click', '#btnResetSearch', function () {
        resetAdvancedSearch();
    });

    // Sự kiện nhấn Enter trong các trường tìm kiếm
    $('#searchTenTaiKhoan, #searchTenNguoiDung, #searchRole, #searchIsBanned').on('keypress', function (e) {
        if (e.which === 13) {
            applyAdvancedSearch();
        }
    });
}

// Áp dụng tìm kiếm nâng cao
function applyAdvancedSearch() {
    const searchTenTaiKhoan = $('#searchTenTaiKhoan').val().trim().toLowerCase();
    const searchTenNguoiDung = $('#searchTenNguoiDung').val().trim().toLowerCase();
    const searchRole = $('#searchRole').val();
    const searchIsBanned = $('#searchIsBanned').val();

    if (dataTableInstance) {
        // Định nghĩa hàm tìm kiếm tùy chỉnh
        $.fn.dataTable.ext.search.push(function (settings, data, dataIndex, rowData) {
            // Data[1] = Tên tài khoản, Data[2] = Tên người dùng, Data[3] = Vai trò, Data[4] = Trạng thái
            const tenTaiKhoan = data[1].toLowerCase();
            const tenNguoiDung = data[2].toLowerCase();
            const role = rowData.ID_role ? rowData.ID_role.toString() : "";
            const isBanned = rowData.IsBanned ? rowData.IsBanned.toString() : "";

            // Kiểm tra điều kiện tìm kiếm
            const matchTen = searchTenTaiKhoan === '' || tenTaiKhoan.includes(searchTenTaiKhoan);
            const matchHoTen = searchTenNguoiDung === '' || tenNguoiDung.includes(searchTenNguoiDung);
            const matchRole = searchRole === '' || role === searchRole;
            const matchIsBanned = searchIsBanned === '' || isBanned === searchIsBanned;

            return matchTen && matchHoTen && matchRole && matchIsBanned;
        });

        // Áp dụng tìm kiếm và vẽ lại bảng
        dataTableInstance.draw();

        // Xóa bộ lọc tìm kiếm sau khi đã áp dụng
        $.fn.dataTable.ext.search.pop();

        // Thông báo kết quả tìm kiếm
        const visibleRows = dataTableInstance.rows({ search: 'applied' }).count();
        if (visibleRows === 0) {
            Sweet_Alert("info", "Không tìm thấy kết quả phù hợp");
        }
    }
}

// Đặt lại tìm kiếm nâng cao
function resetAdvancedSearch() {
    $('#searchTenTaiKhoan').val('');
    $('#searchTenNguoiDung').val('');
    $('#searchRole').val('');
    $('#searchIsBanned').val('');

    if (dataTableInstance) {
        dataTableInstance.search('').columns().search('').draw();
    }
}

// Lấy tên vai trò từ ID
function getRoleName(roleId, rolesData) {
    const role = rolesData.find(r => r.ID === roleId);
    return role ? role.TenRole : "Không xác định";
}

defaultContent = "Không có dữ liệu";

// Tải dữ liệu từ API
async function load_data() {
    try {
        // Hiển thị loading
        showLoading('#data-table', 'Đang tải dữ liệu...');

        // Tải dữ liệu vai trò
        let rolesData = [];
        try {
            const rolesResponse = await $.ajax({
                url: '/api/v1/admin/Get-All-Roles',
                type: 'GET',
                dataType: 'json'
            });

            if (rolesResponse.success && Array.isArray(rolesResponse.data)) {
                rolesData = rolesResponse.data;
            }
        } catch (error) {
            Sweet_Alert("error", "Không thể tải danh sách vai trò");
        }

        // Gọi API tải danh sách người dùng
        $.ajax({
            url: '/api/v1/admin/Get-All-Users',
            type: 'GET',
            dataType: 'json',
            cache: false,
            success: function (response) {
                // Xóa DataTable cũ nếu đã tồn tại
                if ($.fn.DataTable.isDataTable('#data-table')) {
                    $('#data-table').DataTable().destroy();
                }

                // Xóa nội dung loading và tạo lại cấu trúc table
                $('#data-table').html(`
                    <thead>
                        <tr>
                            <th>STT</th>
                            <th>Tên tài khoản</th>
                            <th>Tên người dùng</th>
                            <th>Vai trò</th>
                            <th>Trạng thái</th>
                            <th>Ngày tạo</th>
                            <th>Ngày cập nhật</th>
                            <th>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                `);

                // Xử lý dữ liệu cho hiển thị
                let processedData = [];
                if (response.data && Array.isArray(response.data)) {
                    processedData = response.data.map(item => {
                        // Tạo một object mới với các thuộc tính của item
                        const newItem = { ...item };

                        // Xử lý cả hai trường hợp viết hoa và viết thường
                        if (item.NgayTao && !isNaN(parseInt(item.NgayTao))) {
                            newItem.NgayTao = formatTimestamp(parseInt(item.NgayTao));
                        } else if (item.ngayTao && !isNaN(parseInt(item.ngayTao))) {
                            newItem.NgayTao = formatTimestamp(parseInt(item.ngayTao));
                        }

                        if (item.NgayCapNhat && !isNaN(parseInt(item.NgayCapNhat))) {
                            newItem.NgayCapNhat = formatTimestamp(parseInt(item.NgayCapNhat));
                        } else if (item.ngayCapNhat && !isNaN(parseInt(item.ngayCapNhat))) {
                            newItem.NgayCapNhat = formatTimestamp(parseInt(item.ngayCapNhat));
                        }

                        return newItem;
                    });
                }

                // Khởi tạo DataTable với dữ liệu
                dataTableInstance = $('#data-table').DataTable({
                    ...dataTableDefaults,
                    data: processedData || [],
                    columns: [
                        {
                            data: null,
                            render: function (data, type, row, meta) {
                                return meta.row + 1;
                            }
                        },
                        {
                            data: 'TenTaiKhoan',
                            defaultContent,
                            className: 'text-left'
                        },
                        {
                            data: 'Name',
                            defaultContent,
                            className: 'text-left'
                        },
                        {
                            data: 'ID_role',
                            render: function (data, type, row) {
                                const roleName = getRoleName(data, rolesData);
                                return `<span class="badge badge-primary">${roleName}</span>`;
                            }
                        },
                        {
                            data: 'IsBanned',
                            render: function (data) {
                                return data === 1 ?
                                    '<span class="badge badge-danger">Khóa</span>' :
                                    '<span class="badge badge-success">Hoạt động</span>';
                            }
                        },
                        {
                            data: 'NgayTao',
                            defaultContent
                        },
                        {
                            data: 'NgayCapNhat',
                            defaultContent
                        },
                        {
                            data: null,
                            orderable: false,
                            render: function (data) {
                                // Sử dụng hàm getUserId để trích xuất ID một cách chính xác
                                const userId = getUserId(data);

                                return `
                                    <div class="d-flex justify-content-center">
                                        <button class="btn-action btn-detail mr-1" data-id="${userId}" title="Xem chi tiết">
                                            <i class="anticon anticon-eye"></i>
                                        </button>
                                        <button class="btn-action btn-edit mr-1" data-id="${userId}" title="Chỉnh sửa">
                                            <i class="anticon anticon-edit"></i>
                                        </button>
                                        <button class="btn-action btn-delete" data-id="${userId}" title="Xóa">
                                            <i class="anticon anticon-delete"></i>
                                        </button>
                                    </div>
                                `;
                            }
                        }
                    ]
                });

                // Hiển thị thông báo nếu không có dữ liệu
                if (!response.success) {
                    Sweet_Alert("info", response.message || "Không có dữ liệu");
                }
            },
            error: function (xhr, status, error) {
                // Hiển thị thông báo lỗi
                $('#data-table').empty().html(`
                    <thead>
                        <tr>
                            <th>STT</th>
                            <th>Tên tài khoản</th>
                            <th>Tên người dùng</th>
                            <th>Vai trò</th>
                            <th>Trạng thái</th>
                            <th>Ngày tạo</th>
                            <th>Ngày cập nhật</th>
                            <th>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td colspan="8" class="text-center">Đã xảy ra lỗi: ${xhr.status} - ${xhr.statusText}</td>
                        </tr>
                    </tbody>
                `);

                Sweet_Alert("error", "Không thể tải danh sách: " + xhr.statusText);
            }
        });
    } catch (error) {

        Sweet_Alert("error", "Lỗi JavaScript: " + error.message);
    }
}

// Mở modal xem chi tiết người dùng
async function openViewUserModal(userId) {
    // Đặt lại form và thiết lập chế độ xem
    $("#UserForm")[0].reset();
    $(".form-fields").hide();
    $("#userDetails").show();
    $("#formButtons").hide();
    $("#viewButtons").show();
    $("#permissionButtons").hide();

    // Reset và hiển thị tab thông tin
    $('#userModalTabs a[href="#info-content"]').tab('show');
    $("#permissions-tab-item").hide(); // Ẩn tab phân quyền khi ở chế độ xem

    // Hiển thị modal trước với nội dung trống
    $("#UserModalLabel").text("Chi tiết tài khoản");
    $("#UserModal").modal("show");

    try {
        // Hiển thị lớp phủ loading
        showLoading("#info-content");

        // Tải dữ liệu người dùng, quyền hạn và tất cả chức năng song song
        const [userResponse, permissionsResponse, functionsResponse] = await Promise.all([
            $.ajax({
                url: `/api/v1/admin/Get-User-By-Id/${userId}`,
                type: 'GET'
            }),
            $.ajax({
                url: `/api/v1/admin/Get-User-Permissions/${userId}`,
                type: 'GET'
            }),
            $.ajax({
                url: '/api/v1/admin/Get-All-Functions',
                type: 'GET'
            })
        ]);


        if (userResponse.success && userResponse.data) {
            const user = userResponse.data;

            // Lấy ID một cách nhất quán với tất cả trường hợp
            const userIdValue = user.ID || user.Id || user.id;

            // Thiết lập ID người dùng trong trường ẩn và log ra console để kiểm tra
            $("#userId").val(userIdValue);


            // Lấy tên vai trò để hiển thị
            let roleName = "Không xác định";
            try {
                const roleResponse = await $.ajax({
                    url: '/api/v1/admin/Get-All-Roles',
                    type: 'GET'
                });

                if (roleResponse.success && roleResponse.data) {
                    const role = roleResponse.data.find(r => r.ID === user.ID_role);
                    roleName = role ? role.TenRole : "Không xác định";
                }
            } catch (error) {
                Sweet_Alert("error", "Lỗi khi tải vai trò: " + error.message);
            }

            // Ẩn lớp phủ loading
            hideLoading("#info-content");

            // Định dạng thời gian
            let ngayTao = user.NgayTao || user.ngayTao;
            let ngayCapNhat = user.NgayCapNhat || user.ngayCapNhat;
            const formattedNgayTao = ngayTao ? formatTimestamp(parseInt(ngayTao)) : "N/A";
            const formattedNgayCapNhat = ngayCapNhat ? formatTimestamp(parseInt(ngayCapNhat)) : "N/A";

            // Replace the user details HTML in openViewUserModal with this improved design:
            // In the openViewUserModal function, update the user details HTML with improved table styling:

            $("#userDetails").html(`
                <div class="modal-user-details">
                    <!-- User identity section -->
                    <div class="user-profile-header mb-4">
                        <div class="d-flex align-items-center">
                            <div class="user-avatar-circle bg-primary text-white mr-3">
                                <i class="anticon anticon-user font-size-24"></i>
                            </div>
                            <div>
                                <h5 class="mb-1">${user.TenTaiKhoan || "N/A"}</h5>
                                <p class="mb-0 text-muted">${user.TenNguoiDung || user.Name || "N/A"}</p>
                            </div>
                            <div class="ml-auto">
                                ${user.IsBanned === 1 ?
                    '<span class="badge badge-pill badge-danger px-3 py-2"><i class="anticon anticon-lock mr-1"></i>Tài khoản bị khóa</span>' :
                    '<span class="badge badge-pill badge-success px-3 py-2"><i class="anticon anticon-unlock mr-1"></i>Đang hoạt động</span>'}
                            </div>
                        </div>
                    </div>

                    <!-- User information section -->
                    <div class="card mb-4 border">
                        <div class="card-header bg-primary">
                            <h6 class="mb-0 text-white"><i class="anticon anticon-profile mr-2"></i>Thông tin cơ bản</h6>
                        </div>
                        <div class="card-body p-0">
                            <div class="table-responsive">
                                <table class="table table-hover mb-0">
                                    <tbody>
                                        <tr>
                                            <td width="30%" class="text-muted font-weight-bold bg-light">ID</td>
                                            <td class="bg-white">${userIdValue || "N/A"}</td>
                                        </tr>
                                        <tr>
                                            <td class="text-muted font-weight-bold bg-light">Tên tài khoản</td>
                                            <td class="bg-white">${user.TenTaiKhoan || "N/A"}</td>
                                        </tr>
                                        <tr>
                                            <td class="text-muted font-weight-bold bg-light">Tên người dùng</td>
                                            <td class="bg-white">${user.TenNguoiDung || user.Name || "N/A"}</td>
                                        </tr>
                                        <tr>
                                            <td class="text-muted font-weight-bold bg-light">Vai trò</td>
                                            <td class="bg-white"><span class="badge badge-primary">${roleName}</span></td>
                                        </tr>
                                        <tr>
                                            <td class="text-muted font-weight-bold bg-light">Gmail</td>
                                            <td class="bg-white">
                                                ${user.Gmail ? `<a href="mailto:${user.Gmail}" class="text-primary">
                                                    <i class="anticon anticon-mail mr-1"></i>${user.Gmail}
                                                </a>` : "N/A"}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td class="text-muted font-weight-bold bg-light">Số điện thoại</td>
                                            <td class="bg-white">
                                                ${user.SDT ? `<a href="tel:${user.SDT}" class="text-primary">
                                                    <i class="anticon anticon-phone mr-1"></i>${user.SDT}
                                                </a>` : "N/A"}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
        
                    <!-- Timestamps section -->
                    <div class="card mb-4 border">
                        <div class="card-header bg-primary">
                            <h6 class="mb-0 text-white"><i class="anticon anticon-history mr-2"></i>Thông tin thời gian</h6>
                        </div>
                        <div class="card-body bg-white">
                            <div class="row">
                                <div class="col-md-6 mb-2">
                                    <label class="font-weight-bold text-muted">Ngày tạo:</label>
                                    <div class="d-flex align-items-center">
                                        <i class="anticon anticon-calendar text-primary mr-2"></i>
                                        <span>${formattedNgayTao}</span>
                                    </div>
                                </div>
                                <div class="col-md-6 mb-2">
                                    <label class="font-weight-bold text-muted">Ngày cập nhật:</label>
                                    <div class="d-flex align-items-center">
                                        <i class="anticon anticon-sync text-primary mr-2"></i>
                                        <span>${formattedNgayCapNhat}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
        
                    <!-- Permissions section -->
                    <div class="card border">
                        <div class="card-header bg-primary">
                            <h6 class="mb-0 text-white"><i class="anticon anticon-safety-certificate mr-2"></i>Phân quyền</h6>
                        </div>
                        <div class="card-body bg-white">
                            <div id="viewPermissionsTable" class="table-responsive" style="display: none;">
                                <table class="table table-bordered user-permissions-table">
                                    <thead>
                                        <tr>
                                            <th>Tên chức năng</th>
                                            <th>Mã chức năng</th>
                                            <th>Mô tả</th>
                                        </tr>
                                    </thead>
                                    <tbody id="viewPermissionsTableBody">
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Add some custom CSS for the user modal -->
                <style>
                    .modal-user-details {
                        font-size: 14px;
                    }
                    .user-avatar-circle {
                        width: 60px;
                        height: 60px;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }
                    .modal-user-details .card {
                        border-radius: 4px;
                        overflow: hidden;
                    }
                    .modal-user-details .card-header {
                        padding: 12px 15px;
                        border-bottom: none;
                        background-color: #5a8dee !important;
                    }
                    .modal-user-details .card-header h6 {
                        color: white !important;
                        font-weight: 500;
                    }
                    .modal-user-details .table {
                        margin-bottom: 0;
                    }
                    .modal-user-details .table td,
                    .modal-user-details .table th {
                        padding: 12px 15px;
                        vertical-align: middle;
                    }
        
                    /* Specific styling for the permissions table */
                    .user-permissions-table {
                        width: 100%;
                        border-collapse: collapse;
                    }
                    .user-permissions-table thead tr {
                        background-color: #5a8dee !important;
                    }
                    .user-permissions-table thead th {
                        font-weight: normal;
                        border-bottom: none !important;
                        text-align: center;
                        padding: 10px;
                    }
                    .user-permissions-table tbody td {
                        padding: 10px;
                        border: 1px solid #dee2e6;
                    }
                    .user-permissions-table tbody tr:nth-child(odd) {
                        background-color: #f8f9fa;
                    }
                    .user-permissions-table tbody tr:nth-child(even) {
                        background-color: white;
                    }
                </style>
            `);

            // Tạo nút với ID rõ ràng và đảm bảo data-id có giá trị
            $("#viewButtons").html(`
                <button type="button" class="btn btn-primary m-1" id="btnEditFromView" data-id="${userIdValue}">
                    <i class="anticon anticon-edit m-r-5"></i>
                    <span>Chỉnh sửa</span>
                </button>
                <button type="button" class="btn btn-secondary m-1" data-dismiss="modal">
                    <i class="anticon anticon-close m-r-5"></i>
                    <span>Đóng</span>
                </button>
            `);

            // Kiểm tra nút sau khi tạo

            // Hiển thị quyền với cách tiếp cận cải tiến
            if (permissionsResponse.success && functionsResponse.success) {
                // Get user permissions and convert ID_Function to numbers for better comparison
                const userPermissions = permissionsResponse.data || [];
                const allFunctions = functionsResponse.data || [];


                // Clear both states first
                $("#viewPermissionsTable").hide();
                $("#noPermissionsMessage").hide();

                if (userPermissions.length > 0 && allFunctions.length > 0) {
                    // Extract function IDs from user permissions
                    const userFunctionIds = [];
                    userPermissions.forEach(p => {
                        if (p.ID_Function) {
                            userFunctionIds.push(parseInt(p.ID_Function));
                        }
                    });



                    // Filter functions that match the user's permissions
                    const userFunctions = allFunctions.filter(func =>
                        userFunctionIds.includes(parseInt(func.ID))
                    );


                    if (userFunctions.length > 0) {
                        // Build table HTML
                        let permissionsHtml = '';
                        userFunctions.forEach(func => {
                            permissionsHtml += `
                                <tr>
                                    <td>${func.TenChucNang || ''}</td>
                                    <td>${func.MaChucNang || ''}</td>
                                    <td>${func.MoTa || ''}</td>
                                </tr>
                            `;
                        });

                        // Update the table
                        $("#viewPermissionsTableBody").html(permissionsHtml);
                        $("#viewPermissionsTable").show();
                    } else {
                        // Show no permissions message
                        $("#noPermissionsMessage").show();
                    }
                } else {
                    // Show no permissions message
                    $("#noPermissionsMessage").show();
                }
            } else {
                // Show no permissions message in case of API errors
                $("#noPermissionsMessage").show();
            }
        } else {
            Sweet_Alert("error", "Không tìm thấy thông tin tài khoản");
            hideLoading("#info-content");
        }
    } catch (error) {
        hideLoading("#info-content");
        Sweet_Alert("error", "Không thể tải thông tin tài khoản");
    }
}



// Thay thế hàm switchToEditMode hiện tại bằng phiên bản được cải tiến này
function switchToEditMode(userId) {

    try {
        // Hiển thị loading trong khi thay đổi
        showLoading("#info-content");

        // QUAN TRỌNG: Đặt một timeout ngắn để đảm bảo DOM được cập nhật
        setTimeout(function () {
            // Thiết lập giao diện cho chế độ chỉnh sửa - Đảm bảo lệnh thực thi đúng thứ tự
            $(".form-fields").show();
            $("#userDetails").hide();
            $("#formButtons").show();
            $("#viewButtons").hide();
            $("#permissionButtons").hide();

            // Hiển thị tab phân quyền
            $("#permissions-tab-item").show();
            $('#userModalTabs a[href="#info-content"]').tab('show');

            // Cập nhật tiêu đề
            $("#UserModalLabel").text("Cập nhật tài khoản");

        }, 100);

        // Tải dữ liệu người dùng
        $.ajax({
            url: `/api/v1/admin/Get-User-By-Id/${userId}`,
            type: 'GET',
            success: function (response) {
                // Ẩn loading
                hideLoading("#info-content");

                if (response.success && response.data) {
                    const user = response.data;

                    // Đảm bảo giao diện vẫn đang ở chế độ chỉnh sửa
                    $(".form-fields").show();
                    $("#userDetails").hide();
                    $("#formButtons").show();
                    $("#viewButtons").hide();

                    // Thiết lập chế độ form và ID
                    $("#formMode").val("edit");
                    $("#userId").val(getUserId(user));
                    $("#permissionUserId").val(getUserId(user));
                    $("#permissionUserName").text(user.TenTaiKhoan || "");

                    // Điền thông tin vào các trường form
                    $("#tenTaiKhoan").val(user.TenTaiKhoan || "");
                    $("#tenNguoiDung").val(user.TenNguoiDung || user.Name || "");
                    $("#ID_role").val(user.ID_role || "");
                    $("#Gmail").val(user.Gmail || "");
                    $("#SDT").val(user.SDT || "");
                    $("#IsBanned").val(user.IsBanned || 0);

                    // Định dạng và hiển thị thời gian
                    let ngayTao = user.NgayTao || user.ngayTao;
                    let ngayCapNhat = user.NgayCapNhat || user.ngayCapNhat;
                    $("#NgayTao").val(ngayTao ? formatTimestamp(parseInt(ngayTao)) : "N/A");
                    $("#NgayCapNhat").val(ngayCapNhat ? formatTimestamp(parseInt(ngayCapNhat)) : "N/A");

                    // Hiển thị các phần chỉ dành cho chỉnh sửa
                    if ($("#editOnlyFields").length) $("#editOnlyFields").show();
                    if ($("#changePasswordSection").length) $("#changePasswordSection").show();
                    if ($("#newPasswordFields").length) $("#newPasswordFields").hide();
                    $("#changePasswordCheck").prop("checked", false);

                    // Tải dữ liệu phân quyền trong tab phân quyền
                    loadUserPermissionsData(userId);
                } else {
                    Sweet_Alert("error", "Không tìm thấy thông tin tài khoản");
                }
            },
            error: function (xhr, status, error) {
                hideLoading("#info-content");
                Sweet_Alert("error", "Không thể tải thông tin tài khoản: " + (xhr.responseText || "Lỗi không xác định"));
            }
        });
    } catch (error) {
        hideLoading("#info-content");
        Sweet_Alert("error", "Lỗi khi chuyển chế độ chỉnh sửa: " + error.message);
    }
}

// Mở modal chỉnh sửa người dùng
async function openEditUserModal(userId) {
    // Đặt lại form và thiết lập chế độ chỉnh sửa
    $("#UserForm")[0].reset();

    // Thiết lập giao diện cho chế độ chỉnh sửa
    $(".form-fields").show();
    $("#userDetails").hide();
    $("#formButtons").show();
    $("#viewButtons").hide();
    $("#permissionButtons").hide();

    // Reset và hiển thị tab thông tin
    $('#userModalTabs a[href="#info-content"]').tab('show');
    $("#permissions-tab-item").show(); // Hiển thị tab phân quyền khi ở chế độ chỉnh sửa

    // Hiển thị modal trước với chỉ báo đang tải
    $("#UserModalLabel").text("Đang tải thông tin...");
    $("#UserModal").modal("show");

    try {
        // Hiển thị lớp phủ loading
        showLoading("#info-content");

        // Lấy dữ liệu người dùng
        const response = await $.ajax({
            url: `/api/v1/admin/Get-User-By-Id/${userId}`,
            type: 'GET'
        });

        // Ẩn loading
        hideLoading("#info-content");

        if (response.success && response.data) {
            const user = response.data;

            // Xử lý ID một cách nhất quán 
            if (!user.ID && !user.Id && !user.id) {
                Sweet_Alert("error", "Không tìm thấy ID người dùng");
                return;
            }

            // Thiết lập chế độ form và ID
            $("#formMode").val("edit");
            $("#userId").val(getUserId(user));
            $("#permissionUserId").val(getUserId(user)); // Đồng bộ ID cho tab phân quyền
            $("#permissionUserName").text(user.TenTaiKhoan || ""); // Đồng bộ tên người dùng cho tab phân quyền

            // Điền thông tin vào các trường form với giá trị dự phòng
            $("#tenTaiKhoan").val(user.TenTaiKhoan || "");
            $("#tenNguoiDung").val(user.TenNguoiDung || user.Name || "");
            $("#ID_role").val(user.ID_role || "");
            $("#Gmail").val(user.Gmail || "");
            $("#SDT").val(user.SDT || "");
            $("#IsBanned").val(user.IsBanned || 0);

            // Định dạng và hiển thị thời gian
            let ngayTao = user.NgayTao || user.ngayTao;
            let ngayCapNhat = user.NgayCapNhat || user.ngayCapNhat;
            $("#NgayTao").val(ngayTao ? formatTimestamp(parseInt(ngayTao)) : "N/A");
            $("#NgayCapNhat").val(ngayCapNhat ? formatTimestamp(parseInt(ngayCapNhat)) : "N/A");

            // Cập nhật tiêu đề modal và nội dung nút
            $("#UserModalLabel").text("Cập nhật tài khoản");
            $("#btnSaveText").text("Cập nhật");

            // Hiển thị các phần chỉ dành cho chỉnh sửa nếu chúng tồn tại
            if ($("#editOnlyFields").length) $("#editOnlyFields").show();
            if ($("#changePasswordSection").length) $("#changePasswordSection").show();
            if ($("#newPasswordFields").length) $("#newPasswordFields").hide();
            $("#changePasswordCheck").prop("checked", false);

            // Tải dữ liệu phân quyền trong tab phân quyền (nếu người dùng chuyển sang)
            loadUserPermissionsData(userId);
        } else {
            Sweet_Alert("error", "Không tìm thấy thông tin tài khoản");
            $("#UserModal").modal("hide");
        }
    } catch (error) {
        hideLoading("#info-content");
        Sweet_Alert("error", "Không thể tải thông tin tài khoản: " + (error.message || "Lỗi không xác định"));
        $("#UserModal").modal("hide");
    }
}

// Tải dữ liệu phân quyền (được tách ra để tái sử dụng)
async function loadUserPermissionsData(userId) {
    try {
        // Hiển thị loading
        showLoading("#permissions-content");

        // Tải dữ liệu chức năng và quyền của người dùng
        const [functionsResponse, userPermissionsResponse] = await Promise.all([
            $.ajax({
                url: '/api/v1/admin/Get-All-Functions',
                type: 'GET',
                dataType: 'json'
            }),
            $.ajax({
                url: `/api/v1/admin/Get-User-Permissions/${userId}`,
                type: 'GET',
                dataType: 'json'
            })
        ]);

        // Ẩn loading
        hideLoading("#permissions-content");

        // Xử lý dữ liệu
        if (!functionsResponse.success || !functionsResponse.data || functionsResponse.data.length === 0) {
            $("#functionsTableBody").html(`
                <tr>
                    <td colspan="4" class="text-center">
                        <div class="alert alert-info mb-0">
                            <i class="anticon anticon-info-circle mr-2"></i>Không có dữ liệu chức năng
                        </div>
                    </td>
                </tr>
            `);
            $("#noFunctionsMessage").show();
            return;
        }

        // Ẩn thông báo "không có chức năng" nếu có dữ liệu
        $("#noFunctionsMessage").hide();

        // Lấy quyền của người dùng
        const userPermissions = userPermissionsResponse.success && userPermissionsResponse.data ?
            userPermissionsResponse.data.map(p => p.ID_Function) : [];

        // Tạo HTML cho bảng
        let tableHtml = '';
        functionsResponse.data.forEach(func => {
            const isChecked = userPermissions.includes(func.ID) ? 'checked' : '';
            tableHtml += `
                <tr>
                    <td>
                        <div class="custom-control custom-checkbox">
                            <input type="checkbox" class="custom-control-input function-checkbox" 
                                   id="func_${func.ID}" data-function-id="${func.ID}" ${isChecked}>
                            <label class="custom-control-label" for="func_${func.ID}"></label>
                        </div>
                    </td>
                    <td>${func.TenChucNang || ''}</td>
                    <td>${func.MaChucNang || ''}</td>
                    <td>${func.MoTa || ''}</td>
                </tr>
            `;
        });

        // Cập nhật bảng với dữ liệu
        $("#functionsTableBody").html(tableHtml);

        // Cập nhật trạng thái của checkbox "chọn tất cả"
        updateCheckAllState();
    } catch (error) {
        hideLoading("#permissions-content");
        $("#functionsTableBody").html(`
            <tr>
                <td colspan="4" class="text-center">
                    <div class="alert alert-danger mb-0">
                        <i class="anticon anticon-warning mr-2"></i>Không thể tải dữ liệu phân quyền
                    </div>
                </td>
            </tr>
        `);
    }
}


// Cập nhật thông tin người dùng
async function update_User_in_modal() {
    try {

        // Lấy giá trị từ form
        const userId = $("#userId").val();
        const tenTaiKhoan = $("#tenTaiKhoan").val().trim();
        const tenNguoiDung = $("#tenNguoiDung").val().trim();
        const email = $("#Gmail").val().trim();
        const sdt = $("#SDT").val().trim();
        const roleId = $("#ID_role").val();
        const isBanned = $("#IsBanned").val();

        // Xác thực cơ bản
        if (!tenTaiKhoan) {
            Sweet_Alert("error", "Vui lòng nhập tên tài khoản");
            return;
        }

        if (!tenNguoiDung) {
            Sweet_Alert("error", "Vui lòng nhập tên người dùng");
            return;
        }

        if (!email) {
            Sweet_Alert("error", "Vui lòng nhập địa chỉ Gmail");
            return;
        }

        if (!roleId) {
            Sweet_Alert("error", "Vui lòng chọn vai trò");
            return;
        }

        // Xác thực email bằng regex
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            Sweet_Alert("error", "Định dạng Gmail không hợp lệ");
            return;
        }

        // Vô hiệu hóa nút trong quá trình gọi API
        $("#btnSaveUser").prop('disabled', true);
        $("#btnSaveText").html('<i class="anticon anticon-loading"></i> Đang xử lý...');

        // Tạo dữ liệu cập nhật - Bao gồm cả hai tên trường để tương thích
        const updateData = {
            ID: parseInt(userId),
            TenTaiKhoan: tenTaiKhoan,
            TenNguoiDung: tenNguoiDung,
            Name: tenNguoiDung,  // Thêm trường này để đảm bảo Name cũng được cập nhật
            Gmail: email,
            SDT: sdt || null,
            ID_role: parseInt(roleId),
            IsBanned: parseInt(isBanned)
        };

        // Thêm mật khẩu nếu đang thay đổi - Cải thiện phần này
        if ($("#changePasswordCheck").is(":checked")) {
            const password = $("#matKhauMoi").val();
            const confirmPassword = $("#xacNhanMatKhauMoi").val();

            if (!password) {
                Sweet_Alert("error", "Vui lòng nhập mật khẩu mới");
                $("#btnSaveUser").prop('disabled', false);
                $("#btnSaveText").html('Cập nhật');
                return;
            }

            if (password !== confirmPassword) {
                Sweet_Alert("error", "Mật khẩu không khớp");
                $("#btnSaveUser").prop('disabled', false);
                $("#btnSaveText").html('Cập nhật');
                return;
            }

            // Thử nhiều tên trường khác nhau để tăng khả năng tương thích với API
            updateData.MatKhauMoi = password;
            updateData.MatKhau = password;  // Thêm trường phổ biến
            updateData.Password = password; // Thêm tên trường tiếng Anh
            updateData.NewPassword = password; // Thêm tên trường tiếng Anh khác
        }
        // Gọi API để cập nhật người dùng với timeout dài hơn
        const response = await $.ajax({
            url: '/api/v1/admin/Update-User',
            type: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify(updateData),
            timeout: 30000 // 30 giây timeout
        });



        // Kích hoạt lại nút
        $("#btnSaveUser").prop('disabled', false);
        $("#btnSaveText").html('Cập nhật');

        if (response.success) {
            // Đóng modal và làm mới dữ liệu
            $("#UserModal").modal("hide");
            Sweet_Alert("success", response.message || "Cập nhật tài khoản thành công");
            load_data();
        } else {
            Sweet_Alert("error", response.message || "Có lỗi xảy ra khi cập nhật tài khoản");
        }
    } catch (error) {
        $("#btnSaveUser").prop('disabled', false);
        $("#btnSaveText").html('Cập nhật');

        if (error.responseJSON && error.responseJSON.message) {
            Sweet_Alert("error", error.responseJSON.message);
        } else {
            Sweet_Alert("error", "Có lỗi xảy ra khi cập nhật tài khoản: " +
                (error.statusText || error.message || "Lỗi không xác định"));
        }
    }
}

// Xóa người dùng
function deleteUser(userId) {
    Swal.fire({
        title: 'Xác nhận xóa?',
        text: "Bạn có chắc chắn muốn xóa tài khoản này?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Xác nhận xóa',
        cancelButtonText: 'Hủy'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const res = await $.ajax({
                    url: '/api/v1/admin/Delete-User',
                    type: 'POST',
                    contentType: 'application/json',
                    data: JSON.stringify({
                        ID: parseInt(userId)
                    })
                });

                if (res.success) {
                    Sweet_Alert("success", res.message || "Xóa tài khoản thành công");
                    load_data();
                } else {
                    Sweet_Alert("error", res.message || "Không thể xóa tài khoản");
                }
            } catch (error) {
                if (error.responseJSON && error.responseJSON.message) {
                    Sweet_Alert("error", error.responseJSON.message);
                } else {
                    Sweet_Alert("error", "Đã xảy ra lỗi khi xóa tài khoản");
                }
            }
        }
    });
}

// Mở modal phân quyền - Đã cập nhật để sử dụng modal chung với tab
async function openPermissionsModal(userId, username) {
    // Thiết lập thông tin người dùng
    $("#userId").val(userId);
    $("#permissionUserId").val(userId);
    $("#permissionUserName").text(username);

    // Hiển thị modal và cập nhật tiêu đề
    $("#UserModalLabel").text("Phân quyền tài khoản: " + username);
    $("#UserModal").modal("show");

    // Hiển thị tab phân quyền
    $("#permissions-tab-item").show();
    $('#userModalTabs a[href="#permissions-content"]').tab('show');

    // Hiển thị nút phân quyền
    $("#formButtons").hide();
    $("#viewButtons").hide();
    $("#permissionButtons").show();

    // Tải dữ liệu phân quyền
    await loadUserPermissionsData(userId);
}

// Cập nhật trạng thái checkbox "chọn tất cả"
function updateCheckAllState() {
    const totalCheckboxes = $("#functionsTableBody .function-checkbox").length;
    const checkedCheckboxes = $("#functionsTableBody .function-checkbox:checked").length;

    if (totalCheckboxes === 0) {
        $("#checkAllFunctions").prop("checked", false);
        return;
    }

    $("#checkAllFunctions").prop({
        "checked": totalCheckboxes === checkedCheckboxes,
        "indeterminate": checkedCheckboxes > 0 && checkedCheckboxes < totalCheckboxes
    });
}

// Xử lý sự thay đổi checkbox riêng lẻ
$(document).on("change", ".function-checkbox", function () {
    updateCheckAllState();
});

// Xử lý checkbox "chọn tất cả"
$(document).on("change", "#checkAllFunctions", function () {
    const isChecked = $(this).prop("checked");
    $(".function-checkbox").prop("checked", isChecked);
});

// Lưu phân quyền người dùng - Cập nhật để sử dụng modal chung
async function saveUserPermissions() {
    try {
        const userId = $("#permissionUserId").val();

        if (!userId) {
            Sweet_Alert("error", "Không tìm thấy thông tin người dùng");
            return;
        }

        // Lấy tất cả ID chức năng đã chọn
        const selectedFunctionIds = [];
        $("#functionsTableBody .function-checkbox:checked").each(function () {
            selectedFunctionIds.push($(this).data("function-id"));
        });

        // Vô hiệu hóa nút trong quá trình gọi API
        $("#btnSavePermissions").prop('disabled', true);
        $("#btnSavePermissions").html('<i class="anticon anticon-loading"></i> Đang xử lý...');

        const response = await $.ajax({
            url: '/api/v1/admin/Update-User-Permissions',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                userId: parseInt(userId),
                functionIds: selectedFunctionIds
            })
        });

        // Kích hoạt lại nút
        $("#btnSavePermissions").prop('disabled', false);
        $("#btnSavePermissions").html('<i class="anticon anticon-save m-r-5"></i><span>Lưu phân quyền</span>');

        if (response.success) {
            $("#UserModal").modal("hide");
            Sweet_Alert("success", response.message || "Phân quyền đã được cập nhật thành công");
        } else {
            Sweet_Alert("error", response.message || "Có lỗi xảy ra khi cập nhật phân quyền");
        }
    } catch (error) {
        // Kích hoạt lại nút
        $("#btnSavePermissions").prop('disabled', false);
        $("#btnSavePermissions").html('<i class="anticon anticon-save m-r-5"></i><span>Lưu phân quyền</span>');

        Sweet_Alert("error", "Có lỗi xảy ra khi cập nhật phân quyền");
    }
}

// Lấy ID người dùng từ đối tượng dữ liệu
function getUserId(userData) {
    // Thử các tên thuộc tính ID có thể có
    const id = userData.ID || userData.Id || userData.id;

    if (!id) {
        return null;
    }

    return id;
}