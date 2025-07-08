$(document).ready(function () {
    // Initialize Select2 components if available
    if ($.fn.select2) {
        $(".select2").select2();
    }

    // Thiết lập tìm kiếm nâng cao và mặc định tải dữ liệu
    setupAdvancedSearch();
    load_data();

    // Event handler for the "Save" button in the modal
    $("#btnSaveRole").on("click", function () {
        const formMode = $("#formMode").val();
        if (formMode === "add") {
            add_new_Role_in_modal();
        } else {
            update_Role_in_modal();
        }
    });

    // Event handlers for the "Add Role" button
    $("#btnAddRoles").on("click", function () {
        openAddRoleModal();
    });

    // Detail button click event
    $(document).on("click", ".btn-detail", function () {
        const id = $(this).data("id");
        openViewRoleModal(id);
    });

    // Edit button click event
    $(document).on("click", ".btn-edit", function () {
        const id = $(this).data("id");
        openEditRoleModal(id);
    });

    // Delete button click event
    $(document).on("click", ".btn-delete", function () {
        const id = $(this).data("id");
        deleteRole(id);
    });

    // Mở edit từ trong detail
    $(document).on("click", "#btnEditFromView", function (e) {
        e.preventDefault();
        const roleId = $("#roleId").val();

        if (!roleId) {
            AdminShared.Sweet_Alert("error", "Không tìm thấy ID quyền để chỉnh sửa");
            return;
        }

        // Store ID for later use
        const storedId = roleId;

        // Close the current modal
        $("#RolesModal").modal("hide");

        // Use setTimeout to ensure the modal is closed before opening edit modal
        setTimeout(function () {
            openEditRoleModal(storedId);
        }, 500);
    });

    // Add modal close handler to reset state completely
    $("#RolesModal").on("hidden.bs.modal", function () {
        // Force complete reset of all modal elements
        $(".form-fields").show();
        $("#roleDetails").hide();
        $("#formButtons").show();
        $("#viewButtons").hide();
        $("#editOnlyFields").hide();

        $("#RolesForm")[0].reset();
        $("#roleId").val("");
    });
});

let dataTableInstance = null;

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
    $('#searchTenRole, #searchMoTa').on('keypress', function (e) {
        if (e.which === 13) {
            applyAdvancedSearch();
        }
    });
}

// Áp dụng tìm kiếm nâng cao
function applyAdvancedSearch() {
    const searchTenRole = $('#searchTenRole').val().trim().toLowerCase();
    const searchMoTa = $('#searchMoTa').val().trim().toLowerCase();

    if (dataTableInstance) {
        // Định nghĩa hàm tìm kiếm tùy chỉnh
        $.fn.dataTable.ext.search.push(function (settings, data, dataIndex, rowData) {
            // Data[1] = Tên quyền, Data[2] = Mô tả
            const tenRole = data[1].toLowerCase();
            const moTa = data[2].toLowerCase();

            // Kiểm tra điều kiện tìm kiếm
            const matchTen = searchTenRole === '' || tenRole.includes(searchTenRole);
            const matchMoTa = searchMoTa === '' || moTa.includes(searchMoTa);

            return matchTen && matchMoTa;
        });

        // Áp dụng tìm kiếm và vẽ lại bảng
        dataTableInstance.draw();

        // Xóa bộ lọc tìm kiếm sau khi đã áp dụng
        $.fn.dataTable.ext.search.pop();

        // Thông báo kết quả tìm kiếm
        const visibleRows = dataTableInstance.rows({ search: 'applied' }).count();
        if (visibleRows === 0) {
            AdminShared.Sweet_Alert("info", "Không tìm thấy kết quả phù hợp");
        }
    }
}

// Đặt lại tìm kiếm nâng cao
function resetAdvancedSearch() {
    $('#searchTenRole').val('');
    $('#searchMoTa').val('');

    if (dataTableInstance) {
        dataTableInstance.search('').columns().search('').draw();
    }
}

defaultContent = "Không có dữ liệu";

// Load data from API
async function load_data() {
    try {
        // Hiển thị loading
        AdminShared.showLoading('#data-table', 'Đang tải dữ liệu...');

        // Gọi API
        $.ajax({
            url: '/api/v1/admin/Get-All-Roles',
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
                            <th>Tên quyền</th>
                            <th>Mô tả</th>
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
                            newItem.NgayTao = AdminShared.formatTimestamp(parseInt(item.NgayTao));
                        } else if (item.ngayTao && !isNaN(parseInt(item.ngayTao))) {
                            newItem.NgayTao = AdminShared.formatTimestamp(parseInt(item.ngayTao));
                        }

                        if (item.NgayCapNhat && !isNaN(parseInt(item.NgayCapNhat))) {
                            newItem.NgayCapNhat = AdminShared.formatTimestamp(parseInt(item.NgayCapNhat));
                        } else if (item.ngayCapNhat && !isNaN(parseInt(item.ngayCapNhat))) {
                            newItem.NgayCapNhat = AdminShared.formatTimestamp(parseInt(item.ngayCapNhat));
                        }

                        return newItem;
                    });
                }

                // Khởi tạo DataTable với dữ liệu
                dataTableInstance = $('#data-table').DataTable({
                    ...AdminShared.dataTableDefaults,
                    data: processedData || [],
                    columns: [
                        {
                            data: null,
                            render: function (data, type, row, meta) {
                                return meta.row + 1;
                            }
                        },
                        { data: 'TenRole', defaultContent },
                        { data: 'MoTa', defaultContent },
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
                                return `
                                    <div class="d-flex justify-content-center">
                                        <button class="btn-action btn-detail mr-2" data-id="${data.ID}" title="Xem chi tiết">
                                            <i class="anticon anticon-eye"></i>
                                        </button>
                                        <button class="btn-action btn-edit mr-2" data-id="${data.ID}" title="Chỉnh sửa">
                                            <i class="anticon anticon-edit"></i>
                                        </button>
                                        <button class="btn-action btn-delete" data-id="${data.ID}" title="Xóa">
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
                    AdminShared.Sweet_Alert("info", response.message || "Không có dữ liệu");
                }
            },
            error: function (xhr, status, error) {
                // Hiển thị thông báo lỗi
                $('#data-table').empty().html(`
                    <thead>
                        <tr>
                            <th>STT</th>
                            <th>Tên quyền</th>
                            <th>Mô tả</th>
                            <th>Ngày tạo</th>
                            <th>Ngày cập nhật</th>
                            <th>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td colspan="6" class="text-center">Đã xảy ra lỗi: ${xhr.status} - ${xhr.statusText}</td>
                        </tr>
                    </tbody>
                `);

                AdminShared.Sweet_Alert("error", "Không thể tải danh sách: " + xhr.statusText);
            }
        });
    } catch (error) {
        AdminShared.Sweet_Alert("error", "Lỗi JavaScript: " + error.message);
    }
}

// Open modal for adding a new role
function openAddRoleModal() {
    // Reset form and modal state completely
    $("#RolesForm")[0].reset();
    $("#roleId").val("");
    $("#formMode").val("add");

    // Explicitly set what to show/hide
    $(".form-fields").show();
    $("#roleDetails").hide();
    $("#formButtons").show();
    $("#viewButtons").hide();
    $("#editOnlyFields").hide();

    // Set modal title and button text
    $("#RolesModalLabel").text("Thêm quyền admin mới");
    $("#btnSaveText").text("Thêm mới");

    // Show the modal
    $("#RolesModal").modal("show");
}

// Open modal for editing an existing role
async function openEditRoleModal(roleId) {
    // Reset modal state first
    $("#RolesForm")[0].reset();

    // Explicitly set what to show/hide
    $(".form-fields").show();
    $("#roleDetails").hide();
    $("#formButtons").show();
    $("#viewButtons").hide();

    // Show loading overlay
    AdminShared.showModalLoading(".modal-body");

    try {
        const response = await $.ajax({
            url: `/api/v1/admin/Get-Roles-By-Id/${roleId}`,
            type: 'GET'
        });

        // Hide loading after data is loaded
        AdminShared.hideModalLoading(".modal-body");

        if (response.success && response.data) {
            const role = response.data;

            // Set form mode and ID
            $("#formMode").val("edit");
            $("#roleId").val(role.ID);

            // Fill in form fields
            $("#tenRole").val(role.TenRole);
            $("#moTa").val(role.MoTa);

            // Handle both case variations for timestamps
            let ngayTao = role.NgayTao || role.ngayTao;
            let ngayCapNhat = role.NgayCapNhat || role.ngayCapNhat;

            // Format and display timestamps using our shared function
            $("#ngayTao").val(ngayTao ? AdminShared.formatTimestamp(parseInt(ngayTao)) : "Chưa cập nhật");
            $("#ngayCapNhat").val(ngayCapNhat ? AdminShared.formatTimestamp(parseInt(ngayCapNhat)) : "Chưa cập nhật");

            // Update modal title and button text
            $("#RolesModalLabel").text("Cập nhật quyền admin");
            $("#btnSaveText").text("Cập nhật");

            // Show the time fields
            $("#editOnlyFields").show();

            // Show the modal
            $("#RolesModal").modal("show");
        } else {
            AdminShared.Sweet_Alert("error", "Không tìm thấy thông tin quyền admin");
        }
    } catch (error) {
        // Hide loading on error
        AdminShared.hideModalLoading(".modal-body");

        AdminShared.Sweet_Alert("error", "Không thể tải thông tin quyền admin");
    }
}

// Add new role using modal data
async function add_new_Role_in_modal() {
    const tenRole = $("#tenRole").val().trim();
    const moTa = $("#moTa").val().trim();

    // Validate inputs
    if (!tenRole) {
        AdminShared.Sweet_Alert("warning", "Vui lòng nhập tên quyền admin");
        return;
    }

    if (!moTa) {
        AdminShared.Sweet_Alert("warning", "Vui lòng nhập mô tả cho quyền admin");
        return;
    }

    try {
        const res = await $.ajax({
            url: '/api/v1/admin/Create-Roles',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                TenRole: tenRole,
                MoTa: moTa
            })
        });

        if (res.success) {
            $("#RolesModal").modal("hide");
            AdminShared.Sweet_Alert("success", res.message);
            load_data();
        } else {
            AdminShared.Sweet_Alert("error", res.message);
        }
    } catch (error) {
        // Extract error message from response if available
        if (error.responseJSON) {
            AdminShared.Sweet_Alert("error", error.responseJSON.message || "Đã xảy ra lỗi khi thêm quyền admin");
        } else {
            AdminShared.Sweet_Alert("error", "Đã xảy ra lỗi khi thêm quyền admin");
        }
    }
}

// Update existing role using modal data
async function update_Role_in_modal() {
    const roleId = $("#roleId").val();
    const tenRole = $("#tenRole").val().trim();
    const moTa = $("#moTa").val().trim();

    // Validate inputs
    if (!tenRole) {
        AdminShared.Sweet_Alert("warning", "Vui lòng nhập tên quyền admin");
        return;
    }

    if (!moTa) {
        AdminShared.Sweet_Alert("warning", "Vui lòng nhập mô tả cho quyền admin");
        return;
    }

    try {
        const res = await $.ajax({
            url: '/api/v1/admin/Update-Roles',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                ID: parseInt(roleId),
                TenRole: tenRole,
                MoTa: moTa
            })
        });

        if (res.success) {
            $("#RolesModal").modal("hide");
            AdminShared.Sweet_Alert("success", res.message);
            load_data();
        } else {
            AdminShared.Sweet_Alert("error", res.message);
        }
    } catch (error) {
        if (error.responseJSON) {
            AdminShared.Sweet_Alert("error", error.responseJSON.message || "Đã xảy ra lỗi khi cập nhật quyền admin");
        } else {
            AdminShared.Sweet_Alert("error", "Đã xảy ra lỗi khi cập nhật quyền admin");
        }
    }
}

// Delete a role
function deleteRole(roleId) {
    Swal.fire({
        title: 'Xác nhận xóa?',
        text: "Bạn có chắc chắn muốn xóa quyền admin này?",
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
                    url: '/api/v1/admin/Delete-Roles',
                    type: 'POST',
                    contentType: 'application/json',
                    data: JSON.stringify({ ID: parseInt(roleId) })
                });

                if (res.success) {
                    AdminShared.Sweet_Alert("success", res.message);
                    load_data();
                } else {
                    AdminShared.Sweet_Alert("error", res.message);
                }
            } catch (error) {
                if (error.responseJSON) {
                    AdminShared.Sweet_Alert("error", error.responseJSON.message || "Đã xảy ra lỗi khi xóa quyền admin");
                } else {
                    AdminShared.Sweet_Alert("error", "Đã xảy ra lỗi khi xóa quyền admin");
                }
            }
        }
    });
}

// Xử lý mở và show trang detail role
async function openViewRoleModal(roleId) {
    // Reset form and explicitly set what to show/hide for view mode
    $("#RolesForm")[0].reset();

    // Pre-set the view mode settings BEFORE loading data
    $(".form-fields").hide();
    $("#roleDetails").show();
    $("#formButtons").hide();
    $("#viewButtons").show();
    $("#editOnlyFields").hide();

    // Show loading overlay
    AdminShared.showModalLoading(".modal-body");

    try {
        const response = await $.ajax({
            url: `/api/v1/admin/Get-Roles-By-Id/${roleId}`,
            type: 'GET'
        });

        // Hide loading after data is loaded
        AdminShared.hideModalLoading(".modal-body");

        if (response.success && response.data) {
            const role = response.data;

            // Set role ID in hidden field
            $("#roleId").val(role.ID);

            // Fill the view-only fields
            $("#viewRoleId").text(role.ID);
            $("#viewTenRole").text(role.TenRole);
            $("#viewMoTa").text(role.MoTa);

            // Handle both case variations for timestamps
            let ngayTao = role.NgayTao || role.ngayTao;
            let ngayCapNhat = role.NgayCapNhat || role.ngayCapNhat;

            // Format and display timestamps using our shared function
            $("#viewNgayTao").text(ngayTao ? AdminShared.formatTimestamp(parseInt(ngayTao)) : "N/A");
            $("#viewNgayCapNhat").text(ngayCapNhat ? AdminShared.formatTimestamp(parseInt(ngayCapNhat)) : "N/A");

            // Update modal title
            $("#RolesModalLabel").text("Chi tiết quyền Admin");

            // Show the modal
            $("#RolesModal").modal("show");
        } else {
            AdminShared.Sweet_Alert("error", "Không tìm thấy thông tin quyền admin");
        }
    } catch (error) {
        // Hide loading on error
        AdminShared.hideModalLoading(".modal-body");

        AdminShared.Sweet_Alert("error", "Không thể tải thông tin quyền admin");
    }
}