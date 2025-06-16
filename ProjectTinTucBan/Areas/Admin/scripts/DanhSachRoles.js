$(document).ready(function () {
    // Initialize Select2 components if available
    if ($.fn.select2) {
        $(".select2").select2();
    }


    load_data();

    console.log("Document ready - Checking path: " + window.location.pathname);


    // Event handlers for the "Add Role" button
    $("#btnAddRoles").on("click", function () {
        openAddRoleModal();
    });

    // Event handler for the "Save" button in the modal
    $("#btnSaveRole").on("click", function () {
        const formMode = $("#formMode").val();
        if (formMode === "add") {
            add_new_Role_in_modal();
        } else {
            update_Role_in_modal();
        }
    });
});

// Initialize DataTable with roles data
function initializeDataTable() {
    $('#data-table').DataTable({
        responsive: true,
        language: {
            search: "Tìm kiếm:",
            lengthMenu: "Hiển thị _MENU_ mục",
            info: "Hiển thị _START_ đến _END_ của _TOTAL_ mục",
            infoEmpty: "Hiển thị 0 đến 0 của 0 mục",
            infoFiltered: "(lọc từ _MAX_ mục)",
            paginate: {
                first: "Đầu",
                previous: "Trước",
                next: "Tiếp",
                last: "Cuối"
            }
        },
        pageLength: 10,
        ordering: true,
        paging: true,
        searching: true,
        info: true
    });
}

// Load data from API
async function load_data() {
    try {
        const response = await $.ajax({
            url: '/api/v1/admin/Get-All-Roles',
            type: 'GET'
        });

        // Clear existing data and destroy DataTable
        const dataTable = $('#data-table').DataTable();
        dataTable.clear().destroy();

        // Recreate the table with new data
        if (response.success && response.data) {
            const tableBody = $('#data-table tbody');
            tableBody.empty();

            response.data.forEach((item, index) => {
                // Format dates for display
                const ngayTao = formatUnixTimestamp(item.NgayTao);
                const ngayCapNhat = formatUnixTimestamp(item.NgayCapNhat);

                // Append the row
                tableBody.append(`
                    <tr>
                        <td>${index + 1}</td>
                        <td>${item.TenRole}</td>
                        <td>${item.MoTa}</td>
                        <td>${ngayTao}</td>
                        <td>${ngayCapNhat}</td>
                        <td>
                            <div class="d-flex justify-content-center">
                                <button class="btn btn-action btn-edit mr-2" onclick="openEditRoleModal(${item.ID})">
                                    <i class="anticon anticon-edit"></i>
                                </button>
                                <button class="btn btn-action btn-delete" onclick="deleteRole(${item.ID})">
                                    <i class="anticon anticon-delete"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `);
            });
        }

        // Re-initialize DataTable
        initializeDataTable();
    } catch (error) {
        console.error("Error loading data:", error);
        Sweet_Alert("error", "Không thể tải dữ liệu quyền admin");
    }
}

// Format Unix timestamp to readable date
function formatUnixTimestamp(timestamp) {
    if (!timestamp) return "N/A";

    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Open modal for adding a new role
function openAddRoleModal() {
    // Reset the form
    $("#RolesForm")[0].reset();
    $("#roleId").val("");
    $("#formMode").val("add");
    $("#RolesModalLabel").text("Thêm quyền admin mới");
    $("#btnSaveText").text("Thêm mới");
    $("#editOnlyFields").hide();

    // Show the modal
    $("#RolesModal").modal("show");
}

// Open modal for editing an existing role
async function openEditRoleModal(roleId) {
    try {
        const response = await $.ajax({
            url: `/api/v1/admin/Get-Roles-By-Id/${roleId}`, // SỬA URL này cho đúng với API
            type: 'GET'
        });

        if (response.success && response.data) {
            const role = response.data;

            // Set form mode and ID
            $("#formMode").val("edit");
            $("#roleId").val(role.ID);

            // Fill in form fields
            $("#tenRole").val(role.TenRole);
            $("#moTa").val(role.MoTa);

            // Format and display timestamps
            $("#ngayTao").val(formatUnixTimestamp(role.NgayTao));
            $("#ngayCapNhat").val(formatUnixTimestamp(role.NgayCapNhat));

            // Update modal title and button text
            $("#RolesModalLabel").text("Cập nhật quyền admin");
            $("#btnSaveText").text("Cập nhật");

            // Show the time fields
            $("#editOnlyFields").show();

            // Show the modal
            $("#RolesModal").modal("show");
        } else {
            Sweet_Alert("error", "Không tìm thấy thông tin quyền admin");
        }
    } catch (error) {
        console.error("Error loading role data:", error);
        Sweet_Alert("error", "Không thể tải thông tin quyền admin");
    }
}

// Add new role using modal data
async function add_new_Role_in_modal() {
    const tenRole = $("#tenRole").val();
    const moTa = $("#moTa").val();

    // Validate inputs
    if (!tenRole.trim()) {
        Sweet_Alert("warning", "Vui lòng nhập tên quyền admin");
        return;
    }

    if (!moTa.trim()) {
        Sweet_Alert("warning", "Vui lòng nhập mô tả cho quyền admin");
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
            Sweet_Alert("success", res.message);
            load_data();
        } else {
            Sweet_Alert("error", res.message);
        }
    } catch (error) {
        // Extract error message from response if available
        if (error.responseJSON) {
            Sweet_Alert("error", error.responseJSON.message || "Đã xảy ra lỗi khi thêm quyền admin");
        } else {
            Sweet_Alert("error", "Đã xảy ra lỗi khi thêm quyền admin");
        }
        console.error(error);
    }
}

// Update existing role using modal data
async function update_Role_in_modal() {
    const roleId = $("#roleId").val();
    const tenRole = $("#tenRole").val();
    const moTa = $("#moTa").val();

    // Validate inputs
    if (!tenRole.trim()) {
        Sweet_Alert("warning", "Vui lòng nhập tên quyền admin");
        return;
    }

    if (!moTa.trim()) {
        Sweet_Alert("warning", "Vui lòng nhập mô tả cho quyền admin");
        return;
    }

    try {
        const res = await $.ajax({
            url: '/api/v1/admin/Update-Roles', // SỬA URL này cho đúng với API
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                ID: roleId,
                TenRole: tenRole,
                MoTa: moTa
            })
        });

        if (res.success) {
            $("#RolesModal").modal("hide");
            Sweet_Alert("success", res.message);
            load_data();
        } else {
            Sweet_Alert("error", res.message);
        }
    } catch (error) {
        if (error.responseJSON) {
            Sweet_Alert("error", error.responseJSON.message || "Đã xảy ra lỗi khi cập nhật quyền admin");
        } else {
            Sweet_Alert("error", "Đã xảy ra lỗi khi cập nhật quyền admin");
        }
        console.error(error);
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
                    url: '/api/v1/admin/Delete-Roles', // SỬA URL này cho đúng với API
                    type: 'POST',
                    contentType: 'application/json',
                    data: JSON.stringify({ ID: roleId })
                });

                if (res.success) {
                    Sweet_Alert("success", res.message);
                    load_data();
                } else {
                    Sweet_Alert("error", res.message);
                }
            } catch (error) {
                if (error.responseJSON) {
                    Sweet_Alert("error", error.responseJSON.message || "Đã xảy ra lỗi khi xóa quyền admin");
                } else {
                    Sweet_Alert("error", "Đã xảy ra lỗi khi xóa quyền admin");
                }
                console.error(error);
            }
        }
    });
}

// Display SweetAlert notifications
function Sweet_Alert(icon, message) {
    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer);
            toast.addEventListener('mouseleave', Swal.resumeTimer);
        }
    });

    Toast.fire({
        icon: icon,
        title: message
    });
}