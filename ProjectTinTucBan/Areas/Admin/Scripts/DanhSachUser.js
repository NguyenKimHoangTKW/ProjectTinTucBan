$(document).ready(function () {
    // Khởi tạo thành phần Select2 nếu có sẵn

    if ($.fn.select2) {
        $(".select2").select2();
    }

    // Thiết lập tìm kiếm nâng cao và mặc định tải dữ liệu
    setupAdvancedSearch();
    load_data();
    loadRoles();  // Load roles for dropdown

    // Event handlers for the "Add User" button
    $("#btnAddUser").on("click", function () {
        openAddUserModal();
    });

    // Event handler for the "Save" button in the modal
    $("#btnSaveUser").on("click", function () {
        const formMode = $("#formMode").val();
        if (formMode === "add") {
            add_new_User_in_modal();
        } else {
            update_User_in_modal();
        }
    });

    // Add this event handler for permissions button
    $(document).on("click", ".btn-permissions", function () {
        const id = $(this).data("id");
        const username = $(this).data("username");
        openPermissionsModal(id, username);
    });

    // Add event handler for saving permissions
    $("#btnSavePermissions").on("click", function () {
        saveUserPermissions();
    });

    // Edit button click event
    $(document).on("click", ".btn-edit", function () {
        const id = $(this).data("id");
        openEditUserModal(id);
    });

    // Delete button click event
    $(document).on("click", ".btn-delete", function () {
        const id = $(this).data("id");
        deleteUser(id);
    });

    // Change password checkbox event
    $("#changePasswordCheck").change(function () {
        if ($(this).is(":checked")) {
            $("#newPasswordFields").show();
        } else {
            $("#newPasswordFields").hide();
        }
    });
});

let dataTableInstance = null;

// Load roles for dropdown
function loadRoles() {
    $.ajax({
        url: `${BASE_URL}/Get-All-Roles`,
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
    $('#searchTenTaiKhoan, #searchGmail, #searchRole, #searchIsBanned').on('keypress', function (e) {
        if (e.which === 13) {
            applyAdvancedSearch();
        }
    });
}

// Áp dụng tìm kiếm nâng cao
function applyAdvancedSearch() {
    const searchTenTaiKhoan = $('#searchTenTaiKhoan').val().trim().toLowerCase();
    const searchGmail = $('#searchGmail').val().trim().toLowerCase();
    const searchRole = $('#searchRole').val();
    const searchIsBanned = $('#searchIsBanned').val();

    if (dataTableInstance) {
        // Định nghĩa hàm tìm kiếm tùy chỉnh
        $.fn.dataTable.ext.search.push(function (settings, data, dataIndex, rowData) {
            // Data[1] = Tên tài khoản, Data[2] = Gmail, Data[4] = Vai trò ID, Data[5] = Trạng thái
            const tenTaiKhoan = data[1].toLowerCase();
            const gmail = data[2].toLowerCase();
            const role = rowData.ID_role ? rowData.ID_role.toString() : "";
            const isBanned = rowData.IsBanned ? rowData.IsBanned.toString() : "";

            // Kiểm tra điều kiện tìm kiếm
            const matchTen = searchTenTaiKhoan === '' || tenTaiKhoan.includes(searchTenTaiKhoan);
            const matchGmail = searchGmail === '' || gmail.includes(searchGmail);
            const matchRole = searchRole === '' || role === searchRole;
            const matchIsBanned = searchIsBanned === '' || isBanned === searchIsBanned;

            return matchTen && matchGmail && matchRole && matchIsBanned;
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
    $('#searchGmail').val('');
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

// Load data from API
async function load_data() {
    try {
        // Hiển thị loading
        $('#data-table').empty().html('<div class="text-center my-4"><p>Đang tải dữ liệu...</p></div>');

        // Tải dữ liệu vai trò
        let rolesData = [];
        try {
            const rolesResponse = await $.ajax({
                url: `${BASE_URL}/Get-All-Roles`,
                type: 'GET',
                dataType: 'json'
            });

            if (rolesResponse.success && Array.isArray(rolesResponse.data)) {
                rolesData = rolesResponse.data;
            }
        } catch (error) {
            Sweet_Alert("error", "Loading data: " + error.message);
        }

        // Gọi API tải danh sách người dùng
        $.ajax({
            url: `${BASE_URL}/Get-All-Users`,
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
                            <th>Gmail</th>
                            <th>Số điện thoại</th>
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
                            newItem.NgayTao = unixTimestampToDate(parseInt(item.NgayTao));
                        } else if (item.ngayTao && !isNaN(parseInt(item.ngayTao))) {
                            newItem.NgayTao = unixTimestampToDate(parseInt(item.ngayTao));
                        }

                        if (item.NgayCapNhat && !isNaN(parseInt(item.NgayCapNhat))) {
                            newItem.NgayCapNhat = unixTimestampToDate(parseInt(item.NgayCapNhat));
                        } else if (item.ngayCapNhat && !isNaN(parseInt(item.ngayCapNhat))) {
                            newItem.NgayCapNhat = unixTimestampToDate(parseInt(item.ngayCapNhat));
                        }

                        return newItem;
                    });
                }

                // Khởi tạo DataTable với dữ liệu
                dataTableInstance = $('#data-table').DataTable({
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
                            data: 'Gmail',
                            defaultContent,
                            className: 'text-left'
                        },
                        {
                            data: 'SDT',
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
                            defaultContent,
                            className: 'text-left'
                        },
                        {
                            data: 'NgayCapNhat',
                            defaultContent,
                            className: 'text-left'
                        },
                        {
                            data: null,
                            orderable: false,
                            render: function (data) {
                                return `
                                    <div class="d-flex justify-content-center">
                                        <button class="btn-action btn-permissions mr-1" data-id="${data.ID}" data-username="${data.TenTaiKhoan}" title="Phân quyền">
                                            <i class="anticon anticon-unordered-list"></i>
                                        </button>
                                        <button class="btn-action btn-edit mr-1" data-id="${data.ID}" title="Sửa">
                                            <i class="anticon anticon-edit"></i>
                                        </button>
                                        <button class="btn-action btn-delete" data-id="${data.ID}" title="Xóa">
                                            <i class="anticon anticon-delete"></i>
                                        </button>
                                    </div>
                                `;
                            }
                        }
                    ],
                    pageLength: 5,
                    lengthMenu: [5, 10, 15, 25, 50],
                    language: {
                        paginate: {
                            next: "Tiếp",
                            previous: "Trước"
                        },
                        search: "Tìm nhanh:",
                        lengthMenu: "Hiển thị _MENU_ mục",
                        emptyTable: "Không có dữ liệu",
                        zeroRecords: "Không tìm thấy kết quả phù hợp",
                        info: "Hiển thị _START_ đến _END_ của _TOTAL_ mục",
                        infoEmpty: "Hiển thị 0 đến 0 của 0 mục",
                        infoFiltered: "(lọc từ _MAX_ mục)"
                    }
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
                            <th>Gmail</th>
                            <th>Số điện thoại</th>
                            <th>Vai trò</th>
                            <th>Trạng thái</th>
                            <th>Ngày tạo</th>
                            <th>Ngày cập nhật</th>
                            <th>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td colspan="9" class="text-center">Đã xảy ra lỗi: ${xhr.status} - ${xhr.statusText}</td>
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

// Format Unix timestamp to readable date
function unixTimestampToDate(unixTimestamp) {
    if (!unixTimestamp) return "N/A";

    var date = new Date(unixTimestamp * 1000);
    var weekdays = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    var dayOfWeek = weekdays[date.getDay()];
    var month = ("0" + (date.getMonth() + 1)).slice(-2);
    var day = ("0" + date.getDate()).slice(-2);
    var year = date.getFullYear();
    var hours = ("0" + date.getHours()).slice(-2);
    var minutes = ("0" + date.getMinutes()).slice(-2);
    var seconds = ("0" + date.getSeconds()).slice(-2);
    var formattedDate = dayOfWeek + ', ' + day + "-" + month + "-" + year + " " + hours + ":" + minutes + ":" + seconds;
    return formattedDate;
}


// Open modal for editing an existing user
async function openEditUserModal(userId) {
    try {
        // Chỉ sử dụng API Get-All-Users và tìm người dùng cụ thể
        const allUsersResponse = await $.ajax({
            url: `${BASE_URL}/Get-All-Users`,
            type: 'GET',
            dataType: 'json'
        });

        if (allUsersResponse.success && allUsersResponse.data) {
            // Tìm người dùng theo ID trong danh sách
            const user = allUsersResponse.data.find(u => u.ID === userId);

            if (user) {
                // Set form mode and ID
                $("#formMode").val("edit");
                $("#userId").val(user.ID);

                // Fill in form fields
                $("#tenTaiKhoan").val(user.TenTaiKhoan);
                $("#ID_role").val(user.ID_role);
                $("#Gmail").val(user.Gmail);
                $("#SDT").val(user.SDT || '');
                $("#IsBanned").val(user.IsBanned);

                // Format and display timestamps
                let ngayTao = user.NgayTao || user.ngayTao;
                let ngayCapNhat = user.NgayCapNhat || user.ngayCapNhat;
                $("#NgayTao").val(ngayTao ? unixTimestampToDate(parseInt(ngayTao)) : "Không có dữ liệu");
                $("#NgayCapNhat").val(ngayCapNhat ? unixTimestampToDate(parseInt(ngayCapNhat)) : "NKhông có dữ liệuA");

                // Update modal title and button text
                $("#UserModalLabel").text("Cập nhật tài khoản");
                $("#btnSaveText").text("Cập nhật");


                $("#editOnlyFields").show();


                // Show the modal
                $("#UserModal").modal("show");
            } else {
                Sweet_Alert("error", "Không tìm thấy thông tin tài khoản");
            }
        } else {
            Sweet_Alert("error", "Không thể tải thông tin tài khoản");
        }
    } catch (error) {
        Sweet_Alert("error", "Không thể tải thông tin tài khoản");
    }
}

// Function to update user information
async function update_User_in_modal() {
    try {
        // Get values from form
        const userId = $("#userId").val();
        const tenTaiKhoan = $("#tenTaiKhoan").val().trim();
        const email = $("#Gmail").val().trim();
        const sdt = $("#SDT").val().trim();
        const roleId = $("#ID_role").val();
        const isBanned = $("#IsBanned").val();

        // Basic validation
        if (!tenTaiKhoan) {
            Sweet_Alert("error", "Vui lòng nhập tên tài khoản");
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

        // Email validation using regex
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            Sweet_Alert("error", "Định dạng Gmail không hợp lệ");
            return;
        }

        // Disable button during API call
        $("#btnSaveUser").prop('disabled', true);
        $("#btnSaveText").html('<i class="anticon anticon-loading"></i> Đang xử lý...');

        // Create update data
        const updateData = {
            ID: parseInt(userId),
            TenTaiKhoan: tenTaiKhoan,
            Gmail: email,
            SDT: sdt || null,
            ID_role: parseInt(roleId),
            IsBanned: parseInt(isBanned)
        };

        // Call API to update user
        const response = await $.ajax({
            url: `${BASE_URL}/Update-User`,
            type: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify(updateData)
        });

        $("#btnSaveUser").prop('disabled', false);
        $("#btnSaveText").html('Cập nhật');

        if (response.success) {
            // Close modal and refresh data
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
            Sweet_Alert("error", "Có lỗi xảy ra khi cập nhật tài khoản");
        }

    }
}

// Delete a user
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
                    url: `${BASE_URL}/Delete-User`,
                    type: 'POST',
                    contentType: 'application/json',
                    data: JSON.stringify({
                        ID: parseInt(userId)
                    })
                });

                if (res.success) {
                    Sweet_Alert("success", res.message || "Xóa tài khoản thành công");
                    load_data(); // Reload the data table
                } else {
                    Sweet_Alert("error", res.message || "Không thể xóa tài khoản");
                }
            } catch (error) {
                // Show detailed error from server if available
                if (error.responseJSON && error.responseJSON.message) {
                    Sweet_Alert("error", error.responseJSON.message);
                } else if (error.statusText) {
                    Sweet_Alert("error", `Lỗi: ${error.status} - ${error.statusText}`);
                } else {
                    Sweet_Alert("error", "Đã xảy ra lỗi khi xóa tài khoản");
                }
            }
        }
    });
}

// Display SweetAlert notifications
function Sweet_Alert(icon, title) {
    Swal.fire({
        position: "center",
        icon: icon,
        title: title,
        showConfirmButton: false,
        timer: 2500
    });
}


// Open the permissions modal
async function openPermissionsModal(userId, username) {
    try {
        $("#permissionUserId").val(userId);
        $("#permissionUserName").text(username);

        // Show loading indicator
        $("#functionsTableBody").html(`
            <tr>
                <td colspan="4" class="text-center">
                    <div class="spinner-border text-primary" role="status">
                        <span class="sr-only">Đang tải...</span>
                    </div>
                </td>
            </tr>
        `);

        // Get all functions and user permissions
        const [functionsResponse, userPermissionsResponse] = await Promise.all([
            $.ajax({
                url: `${BASE_URL}/Get-All-Functions`,
                type: 'GET',
                dataType: 'json'
            }),
            $.ajax({
                url: `/api/v1/admin/Get-User-Permissions/${userId}`,
                type: 'GET',
                dataType: 'json'
            })
        ]);

        // Check if we have functions data
        if (!functionsResponse.success || !functionsResponse.data || functionsResponse.data.length === 0) {
            $("#functionsTableBody").html(`
                <tr>
                    <td colspan="4" class="text-center">Không có dữ liệu chức năng</td>
                </tr>
            `);
            $("#UserPermissionModal").modal("show");
            return;
        }

        // Get user permissions (might be empty if user has no permissions)
        const userPermissions = userPermissionsResponse.success && userPermissionsResponse.data ?
            userPermissionsResponse.data.map(p => p.ID_Function) :
            [];

        // Populate the functions table
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
                    <td>${func.TenChucNang}</td>
                    <td>${func.MaChucNang}</td>
                    <td>${func.MoTa}</td>
                </tr>
            `;
        });

        $("#functionsTableBody").html(tableHtml);

        // Update "check all" checkbox state
        updateCheckAllState();

        // Show the modal
        $("#UserPermissionModal").modal("show");
    } catch (error) {
        Sweet_Alert("error", "Không thể tải dữ liệu phân quyền");
    }
}

// Function to update the state of "check all" checkbox
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

// Handle individual checkbox changes
$(document).on("change", ".function-checkbox", function () {
    updateCheckAllState();
});

// Save user permissions
async function saveUserPermissions() {
    try {
        const userId = $("#permissionUserId").val();

        // Get all checked function IDs
        const selectedFunctionIds = [];
        $("#functionsTableBody .function-checkbox:checked").each(function () {
            selectedFunctionIds.push($(this).data("function-id"));
        });

        const response = await $.ajax({
            url: `${BASE_URL}/Update-User-Permissions`,
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                userId: parseInt(userId),
                functionIds: selectedFunctionIds
            })
        });

        if (response.success) {
            $("#UserPermissionModal").modal("hide");
            Sweet_Alert("success", response.message || "Phân quyền đã được cập nhật thành công");
        } else {
            Sweet_Alert("error", response.message || "Có lỗi xảy ra khi cập nhật phân quyền");
        }
    } catch (error) {
        Sweet_Alert("error", "Có lỗi xảy ra khi cập nhật phân quyền");
    }
}