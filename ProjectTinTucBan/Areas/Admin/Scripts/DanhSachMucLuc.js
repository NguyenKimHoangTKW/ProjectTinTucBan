const BASE_URL = '/api/v1/admin';
$(document).ready(function () {
    if ($.fn.select2) {
        $(".select2").select2();
    }
});

let value_check = null;


load_data();

$(document).ready(function () {
    // Các sự kiện cho modal
    setupMucLucModalEvents();
});

// Thiết lập các sự kiện cho modal
function setupMucLucModalEvents() {
    // Mở modal để thêm mới
    $(document).on("click", "#btnAddMucLuc", function () {
        openMucLucModalForAdd();
    });

    // Mở modal để chỉnh sửa
    $(document).on("click", "#btnEdit", function () {
        const id = $(this).data("id");
        openMucLucModalForEdit(id);
    });

    // Xử lý khi nhấn nút lưu
    $(document).on("click", "#btnSaveMucLuc", function () {
        saveMucLuc();
    });

    // Thiết lập slug generation khi nhập tên mục lục
    $(document).on("input", "#tenMucLuc", function () {
        const tenMucLuc = $(this).val();
        if (tenMucLuc) {
            const linkSuggest = convertToSlug(tenMucLuc);
            $("#link").val('/' + linkSuggest);
        } else {
            $("#link").val('');
        }
    });

    // Xử lý khi chuyển đổi trạng thái
    $(document).on("change", ".toggle-status", function () {
        const id = $(this).data("id");
        const isChecked = $(this).prop("checked");
        toggleMucLucStatus(id, isChecked);
    });
}

// Mở modal ở chế độ thêm mới
function openMucLucModalForAdd() {
    // Reset form và thiết lập chế độ
    $("#mucLucForm")[0].reset();
    $("#mucLucId").val("");
    $("#formMode").val("add");

    // Mặc định IsActive là true
    $("#isActive").prop("checked", true);

    // Ẩn phần chỉ hiển thị khi sửa
    $("#editOnlyFields").hide();

    // Cập nhật tiêu đề và nút lưu
    $("#mucLucModalLabel").text("Thêm mục lục mới");
    $("#btnSaveText").text("Thêm mới");

    // Mở modal
    $("#mucLucModal").modal("show");
}

// Mở modal ở chế độ chỉnh sửa
function openMucLucModalForEdit(id) {

    if (!id) {
        Sweet_Alert("error", "ID không hợp lệ");
        return;
    }

    // Reset form và thiết lập chế độ
    $("#mucLucForm")[0].reset();
    $("#mucLucId").val(id);
    $("#formMode").val("edit");

    // Cập nhật tiêu đề và nút lưu
    $("#mucLucModalLabel").text("Chỉnh sửa mục lục");
    $("#btnSaveText").text("Lưu thay đổi");

    // Hiển thị phần chỉ dành cho chỉnh sửa
    $("#editOnlyFields").show();

    // Xóa loading indicator cũ nếu có
    $("#formLoading").remove();

    // Mở modal
    $("#mucLucModal").modal("show");

    // Lấy dữ liệu và điền vào form
    get_muc_luc_by_id(id);
}

// Lưu mục lục (xử lý cả thêm mới và chỉnh sửa)
function saveMucLuc() {
    const mode = $("#formMode").val();
    const tenMucLuc = $("#tenMucLuc").val();

    if (!tenMucLuc) {
        Sweet_Alert("error", "Vui lòng nhập tên mục lục");
        return;
    }

    // Generate link từ tên
    const link = '/' + convertToSlug(tenMucLuc);
    $("#link").val(link);

    const thuTuShow = $("#thuTuShow").val();
    const isActive = $("#isActive").prop("checked");

    if (mode === "add") {
        // Thêm mới
        add_new_in_modal();
    } else {
        // Chỉnh sửa
        update_muc_luc_in_modal();
    }
}

// Delete button click
$(document).on("click", "#btnDelete", function () {
    const id = $(this).data("id");
    const tenMucLuc = $(this).data("ten");
    Swal.fire({
        title: "Bạn đang thao tác xóa mục lục?",
        text: "Bằng việc đồng ý, bạn sẽ xóa mục lục này, bạn có đồng ý không?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Có, tôi đồng ý!"
    }).then((result) => {
        if (result.isConfirmed) {
            delete_muc_luc(id);
        }
    });
});

// Delete muc luc
async function delete_muc_luc(id) {
    try {
        const res = await $.ajax({
            url: `${BASE_URL}/Delete-Muc-Luc`,
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                ID: id
            })
        });

        if (res.success) {
            load_data();
            Sweet_Alert("success", res.message);
        } else {
            Sweet_Alert("error", res.message);
        }
    } catch (error) {
        Sweet_Alert("error", "Đã xảy ra lỗi khi xóa mục lục");
    }
}

// Add new muc luc từ modal
async function add_new_in_modal() {
    const tenMucLuc = $("#tenMucLuc").val();
    const link = $("#link").val();
    const thuTuShow = $("#thuTuShow").val();
    const isActive = $("#isActive").prop("checked"); // Boolean value

    try {
        const res = await $.ajax({
            url: '/api/v1/admin/Create-Muc-Luc',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                TenMucLuc: tenMucLuc,
                Link: link,
                ThuTuShow: parseInt(thuTuShow),
                IsActive: isActive // Boolean value
            })
        });

        if (res.success) {
            $("#mucLucModal").modal("hide");
            Sweet_Alert("success", res.message);
            load_data();
        } else {
            Sweet_Alert("error", res.message);
        }
    } catch (error) {
        // Hiển thị thông báo lỗi chi tiết từ máy chủ nếu có
        if (error.responseJSON) {
            Sweet_Alert("error", error.responseJSON.message || "Đã xảy ra lỗi khi thêm mục lục");
        } else {
            Sweet_Alert("error", "Đã xảy ra lỗi khi thêm mục lục");
        }
    }
}

// Update muc luc từ modal
async function update_muc_luc_in_modal() {
    const id = $("#mucLucId").val();
    const tenMucLuc = $("#tenMucLuc").val();
    const link = $("#link").val();
    const thuTuShow = $("#thuTuShow").val();
    const isActive = $("#isActive").prop("checked"); // Boolean value

    try {
        const res = await $.ajax({
            url: '/api/v1/admin/Update-Muc-Luc',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                ID: parseInt(id),
                TenMucLuc: tenMucLuc,
                Link: link,
                ThuTuShow: parseInt(thuTuShow),
                IsActive: isActive // Boolean value
            })
        });

        if (res.success) {
            $("#mucLucModal").modal("hide");
            Sweet_Alert("success", res.message);
            load_data();
        } else {
            Sweet_Alert("error", res.message);
        }
    } catch (error) {

        // Hiển thị thông báo lỗi chi tiết từ máy chủ nếu có
        if (error.responseJSON) {
            Sweet_Alert("error", error.responseJSON.message || "Đã xảy ra lỗi khi cập nhật mục lục");
        } else {
            Sweet_Alert("error", "Đã xảy ra lỗi khi cập nhật mục lục");
        }
    }
}
defaultContent = "Không có dữ liệu";
// Load data table
async function load_data() {
    try {
        // Hiển thị loading
        showLoading('#data-table', 'Đang tải dữ liệu...');

        // Gọi API
        $.ajax({
            url: '/api/v1/admin/Get-All-Muc-Luc',
            type: 'GET',
            dataType: 'json',
            cache: false,
            success: function (response) {
                // Xóa DataTable cũ nếu đã tồn tại
                if ($.fn.DataTable.isDataTable('#data-table')) {
                    $('#data-table').DataTable().destroy();
                }

                // Xóa nội dung loading và tạo cấu trúc table
                $('#data-table').html(`
                    <thead>
                        <tr>
                            <th>STT</th>
                            <th>Tên mục lục</th>
                            <th>Link</th>
                            <th>Vị trí hiển thị</th>
                            <th>Trạng thái</th>
                            <th>Ngày đăng</th>
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
                        const newItem = { ...item };

                        // Chuyển đổi timestamp thành định dạng ngày tháng
                        if (item.NgayDang) {
                            newItem.NgayDang = formatTimestamp(parseInt(item.NgayDang));
                        }
                        if (item.NgayCapNhat) {
                            newItem.NgayCapNhat = formatTimestamp(parseInt(item.NgayCapNhat));
                        }

                        return newItem;
                    });
                }

                // Khởi tạo DataTable với dữ liệu
                $('#data-table').DataTable({
                    data: processedData || [],
                    columns: [
                        {
                            data: null,
                            render: function (data, type, row, meta) {
                                return meta.row + 1;
                            }
                        },
                        {
                            data: 'TenMucLuc', defaultContent,
                            render: function (data, type, row) {
                                return type === 'display' ? escapeHtml(data) : data;
                            }
                        },
                        { data: 'Link', defaultContent },
                        { data: 'ThuTuShow', defaultContent },
                        {
                            data: 'IsActive', defaultContent,
                            render: function (data, type, row) {
                                const isChecked = (data === 1 || data === true) ? 'checked' : '';
                                return `
                                    <label class="switch">
                                        <input type="checkbox" class="toggle-status" data-id="${row.ID}" ${isChecked}>
                                        <span class="slider"></span>
                                    </label>
                                `;
                            }
                        },
                        { data: 'NgayDang', defaultContent },
                        { data: 'NgayCapNhat', defaultContent },
                        {
                            data: null,
                            orderable: false,
                            render: function (data) {
                                return `
                                    <div class="d-flex">
                                        <button class="btn-action btn-edit mr-2" id="btnEdit" data-id="${data.ID}" data-ten="${(data.TenMucLuc || '').replace(/"/g, '&quot;')}">
                                            <i class="anticon anticon-edit"></i>
                                        </button>
                                        <button class="btn-action btn-delete" id="btnDelete" data-id="${data.ID}" data-ten="${(data.TenMucLuc || '').replace(/"/g, '&quot;')}">
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
                            <th>Tên mục lục</th>
                            <th>Link</th>
                            <th>Vị trí hiển thị</th>
                            <th>Trạng thái</th>
                            <th>Ngày đăng</th>
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

// Get muc luc details for edit form
async function get_muc_luc_by_id(id) {
    try {
        showLoading('#mucLucModal .modal-body', 'Đang tải thông tin mục lục...');

        const res = await $.ajax({
            url: `${BASE_URL}/Get-Muc-Luc-By-Id/${id}`,
            type: 'GET'
        });
        hideLoading('#mucLucModal .modal-body');

        if (res.success && res.data) {

            // Fill form fields with data
            $("#tenMucLuc").val(res.data.TenMucLuc);
            $("#link").val(res.data.Link);
            $("#link").prop('readonly', true); // Make link read-only
            $("#thuTuShow").val(res.data.ThuTuShow);

            // Set IsActive checkbox correctly based on the IsActive value from the server
            // Handle different possible data types (boolean or numeric)
            const isActive = res.data.IsActive;

            if (typeof isActive === 'boolean') {
                $("#isActive").prop('checked', isActive);
            } else if (typeof isActive === 'number') {
                $("#isActive").prop('checked', isActive === 1);
            } else {
                // If for some reason it's a string or other type
                $("#isActive").prop('checked', isActive === true || isActive === 1 || isActive === "1" || isActive === "true");
            }

            // Chuyển đổi timestamp ngày đăng sang định dạng ngày tháng
            if (res.data.NgayDang && !isNaN(parseInt(res.data.NgayDang))) {
                $("#ngayDang").val(formatTimestamp(parseInt(res.data.NgayDang)));
            } else {
                $("#ngayDang").val(res.data.NgayDang || "");
            }

            // Chuyển đổi timestamp ngày cập nhật sang định dạng ngày tháng
            if (res.data.NgayCapNhat && !isNaN(parseInt(res.data.NgayCapNhat))) {
                $("#ngayCapNhat").val(formatTimestamp(parseInt(res.data.NgayCapNhat)));
            } else {
                $("#ngayCapNhat").val(res.data.NgayCapNhat || "");
            }
        } else {
            Sweet_Alert("error", res.message || "Không tìm thấy thông tin mục lục");
        }
    } catch (error) {
        Sweet_Alert("error", "Đã xảy ra lỗi khi lấy thông tin mục lục");
    }
}



// Convert string to URL-friendly slug
function convertToSlug(text) {
    // Convert text to lowercase and remove Vietnamese diacritics
    var slug = text.toLowerCase()
        .replace(/á|à|ả|ạ|ã|ă|ắ|ằ|ẳ|ẵ|ặ|â|ấ|ầ|ẩ|ẫ|ậ/gi, 'a')
        .replace(/é|è|ẻ|ẽ|ẹ|ê|ế|ề|ể|ễ|ệ/gi, 'e')
        .replace(/i|í|ì|ỉ|ĩ|ị/gi, 'i')
        .replace(/ó|ò|ỏ|õ|ọ|ô|ố|ồ|ổ|ỗ|ộ|ơ|ớ|ờ|ở|ỡ|ợ/gi, 'o')
        .replace(/ú|ù|ủ|ũ|ụ|ư|ứ|ừ|ử|ữ|ự/gi, 'u')
        .replace(/ý|ỳ|ỷ|ỹ|ỵ/gi, 'y')
        .replace(/đ/gi, 'd')
        // Remove special characters, replace spaces with hyphens
        .replace(/[^a-z0-9 -]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');

    return slug;
}

// Thay đổi trạng thái mục lục
async function toggleMucLucStatus(id, isActive) {
    try {
        const res = await $.ajax({
            url: '/api/v1/admin/Update-Muc-Luc-Status',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                ID: parseInt(id),
                IsActive: isActive // Boolean value
            })
        });

        if (res.success) {
            Sweet_Alert("success", res.message || "Đã cập nhật trạng thái");
            load_data();
        } else {
            // Nếu thất bại, revert lại trạng thái của switch
            $(`.toggle-status[data-id="${id}"]`).prop("checked", !isActive);
            Sweet_Alert("error", res.message || "Không thể cập nhật trạng thái");
        }
    } catch (error) {
        // Nếu có lỗi, revert lại trạng thái của switch
        $(`.toggle-status[data-id="${id}"]`).prop("checked", !isActive);

        if (error.responseJSON) {
            Sweet_Alert("error", error.responseJSON.message || "Đã xảy ra lỗi khi cập nhật trạng thái");
        } else {
            Sweet_Alert("error", "Đã xảy ra lỗi khi cập nhật trạng thái");
        }
    }
}
