$(document).ready(function () {
    // Initialize Select2 components if available
    if ($.fn.select2) {
        $(".select2").select2();
    }

    // Thiết lập tìm kiếm nâng cao và mặc định tải dữ liệu
    setupAdvancedSearch();
    load_data();

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
            Sweet_Alert("info", "Không tìm thấy kết quả phù hợp");
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

// Load data from API
async function load_data() {
    try {
        // Hiển thị loading
        $('#data-table').empty().html('<div class="text-center my-4"><p>Đang tải dữ liệu...</p></div>');

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
                        { data: 'TenRole' },
                        { data: 'MoTa' },
                        {
                            data: 'NgayTao',
                            defaultContent: "N/A"
                        },
                        {
                            data: 'NgayCapNhat',
                            defaultContent: "N/A"
                        },
                        {
                            data: null,
                            orderable: false,
                            render: function (data) {
                                return `
                                    <div class="d-flex justify-content-center">
                                        <button class="btn-action btn-edit" data-id="${data.ID}">
                                            <i class="anticon anticon-edit"></i>
                                        </button>
                                        <button class="btn-action btn-delete" data-id="${data.ID}">
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

                console.error("Error loading data:", error);
                Sweet_Alert("error", "Không thể tải danh sách: " + xhr.statusText);
            }
        });
    } catch (error) {
        console.error("JavaScript error:", error);
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
            url: `/api/v1/admin/Get-Roles-By-Id/${roleId}`,
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

            // Handle both case variations for timestamps
            let ngayTao = role.NgayTao || role.ngayTao;
            let ngayCapNhat = role.NgayCapNhat || role.ngayCapNhat;

            // Format and display timestamps using our custom function
            $("#ngayTao").val(ngayTao ? unixTimestampToDate(parseInt(ngayTao)) : "N/A");
            $("#ngayCapNhat").val(ngayCapNhat ? unixTimestampToDate(parseInt(ngayCapNhat)) : "N/A");

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
    const tenRole = $("#tenRole").val().trim();
    const moTa = $("#moTa").val().trim();

    // Validate inputs
    if (!tenRole) {
        Sweet_Alert("warning", "Vui lòng nhập tên quyền admin");
        return;
    }

    if (!moTa) {
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
    const tenRole = $("#tenRole").val().trim();
    const moTa = $("#moTa").val().trim();

    // Validate inputs
    if (!tenRole) {
        Sweet_Alert("warning", "Vui lòng nhập tên quyền admin");
        return;
    }

    if (!moTa) {
        Sweet_Alert("warning", "Vui lòng nhập mô tả cho quyền admin");
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
                    url: '/api/v1/admin/Delete-Roles',
                    type: 'POST',
                    contentType: 'application/json',
                    data: JSON.stringify({ ID: parseInt(roleId) })
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
function Sweet_Alert(icon, title) {
    Swal.fire({
        position: "center",
        icon: icon,
        title: title,
        showConfirmButton: false,
        timer: 2500
    });
}