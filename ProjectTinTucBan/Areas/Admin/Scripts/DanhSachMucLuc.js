// DanhSachMucLuc.js - Quản lý danh sách mục lục trong hệ thống admin

// ----- KHỞI TẠO VÀ BIẾN TOÀN CỤC -----
// Biến toàn cục để lưu trữ dữ liệu kiểm tra
let value_check = null;
// Mặc định hiển thị khi không có dữ liệu
defaultContent = "Không có dữ liệu";
// Khởi tạo Select2 nếu plugin đã được tải
$(document).ready(function () {
    // Khởi tạo Select2 nếu plugin đã được tải
    if ($.fn.select2) {
        $(".select2").select2();
    }

    // Nạp dữ liệu bảng mục lục khi trang tải
    load_data();

    // Gán sự kiện cho nút thêm mới (static)
    $("#btnAddMucLuc").on("click", function () {
        openMucLucModalForAdd();
    });

    // Gán sự kiện cho nút lưu (static)
    $("#btnSaveMucLuc").on("click", function () {
        saveMucLuc();
    });

    // Gán sự kiện cho các nút sửa, xóa, chuyển trạng thái (dynamic - dùng event delegation)
    $('#data-table').on("click", ".btn-edit", function () {
        const id = $(this).data("id");
        openMucLucModalForEdit(id);
    });

    $('#data-table').on("click", ".btn-delete", function () {
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

    $('#data-table').on("change", ".toggle-status", function () {
        const id = $(this).data("id");
        const isChecked = $(this).prop("checked");
        toggleMucLucStatus(id, isChecked);
    });

    // Reset lại trạng thái modal khi đóng
    $("#mucLucModal").on("hidden.bs.modal", function () {
        $("#mucLucForm")[0].reset();
        $("#mucLucId").val("");
        $("#formMode").val("add");
        $("#editOnlyFields").hide();
        // Reset các trường lỗi hoặc trạng thái UI khác nếu có
    });
});

$(document).ready(function () {
    // Áp dụng cho tất cả ô trong bảng, trừ cột thao tác
    $('#data-table').on('mouseenter', 'td', function () {
        // Nếu chưa có title hoặc title khác nội dung, thì cập nhật
        if (!$(this).attr('title') || $(this).attr('title') !== $(this).text().trim()) {
            $(this).attr('title', $(this).text().trim());
        }
    });
});

// ----- HÀM TIỆN ÍCH -----
// Chuyển đổi chuỗi văn bản thành slug URL thân thiện
function convertToSlug(text) {
    // Chuyển văn bản sang chữ thường và loại bỏ dấu tiếng Việt
    var slug = text.toLowerCase()
        .replace(/á|à|ả|ạ|ã|ă|ắ|ằ|ẳ|ẵ|ặ|â|ấ|ầ|ẩ|ẫ|ậ/gi, 'a')
        .replace(/é|è|ẻ|ẽ|ẹ|ê|ế|ề|ể|ễ|ệ/gi, 'e')
        .replace(/i|í|ì|ỉ|ĩ|ị/gi, 'i')
        .replace(/ó|ò|ỏ|õ|ọ|ô|ố|ồ|ổ|ỗ|ộ|ơ|ớ|ờ|ở|ỡ|ợ/gi, 'o')
        .replace(/ú|ù|ủ|ũ|ụ|ư|ứ|ừ|ử|ữ|ự/gi, 'u')
        .replace(/ý|ỳ|ỷ|ỹ|ỵ/gi, 'y')
        .replace(/đ/gi, 'd')
        // Loại bỏ ký tự đặc biệt, thay khoảng trắng bằng dấu gạch ngang
        .replace(/[^a-z0-9 -]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');

    return slug;
}

// Mở modal ở chế độ thêm mới - thiết lập form và các giá trị mặc định
function openMucLucModalForAdd() {
    // Reset form và thiết lập chế độ
    $("#tenMucLucError").text("Tên hiển thị của mục lục trên website").removeClass("text-danger").addClass("text-muted");
    $("#thuTuShowError").text("Vị trí hiển thị (số nguyên dương)").removeClass("text-danger").addClass("text-muted");
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

// Mở modal ở chế độ chỉnh sửa - tải dữ liệu cho bản ghi đã chọn
function openMucLucModalForEdit(id) {
    if (!id) {
        Sweet_Alert("error", "ID không hợp lệ");
        return;
    }

    // Reset form và thiết lập chế độ
    $("#tenMucLucError").text("Tên hiển thị của mục lục trên website").removeClass("text-danger").addClass("text-muted");
    $("#thuTuShowError").text("Vị trí hiển thị (số nguyên dương)").removeClass("text-danger").addClass("text-muted");
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
    // Đảm bảo modal được reset config mỗi lần mở
    $("#mucLucModal").modal('hide');
    $("#mucLucModal").modal('dispose');
    $("#mucLucModal").modal({
        backdrop: 'static',
        keyboard: false
    });
    // Mở modal
    $("#mucLucModal").modal("show");

    // Lấy dữ liệu và điền vào form
    get_muc_luc_by_id(id);
}

// Lưu mục lục - xử lý cả thêm mới và chỉnh sửa
function saveMucLuc() {
    const mode = $("#formMode").val();
    const tenMucLuc = $("#tenMucLuc").val().trim();
    const thuTuShow = $("#thuTuShow").val().trim();

    // Reset lỗi
    $("#tenMucLucError").text("Tên hiển thị của mục lục trên website").removeClass("text-danger").addClass("text-muted");
    $("#thuTuShowError").text("Vị trí hiển thị (số nguyên dương)").removeClass("text-danger").addClass("text-muted");

    let hasError = false;

    // Validate tên mục lục
    if (!tenMucLuc) {
        $("#tenMucLucError").text("Vui lòng nhập tên mục lục").removeClass("text-muted").addClass("text-danger");
        hasError = true;
    } else if (tenMucLuc.length > 255) {
        $("#tenMucLucError").text("Tên mục lục không được vượt quá 255 ký tự").removeClass("text-muted").addClass("text-danger");
        hasError = true;
    }

    // Validate vị trí hiển thị
    if (!thuTuShow) {
        $("#thuTuShowError").text("Vui lòng nhập vị trí hiển thị").removeClass("text-muted").addClass("text-danger");
        hasError = true;
    } else if (isNaN(thuTuShow) || parseInt(thuTuShow) < 1 || !Number.isInteger(Number(thuTuShow))) {
        $("#thuTuShowError").text("Vị trí hiển thị phải là số nguyên dương").removeClass("text-muted").addClass("text-danger");
        hasError = true;
    }

    if (hasError) return;


    const isActive = $("#isActive").prop("checked");

    if (mode === "add") {
        add_new_in_modal();
    } else {
        update_muc_luc_in_modal();
    }
}

// ----- THAO TÁC CRUD VỚI API -----
// Xóa mục lục thông qua API
async function delete_muc_luc(id) {
    try {
        const res = await $.ajax({
            url: `/api/v1/admin/Delete-Muc-Luc`,
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

// Thêm mục lục mới từ dữ liệu trong modal
async function add_new_in_modal() {
    const tenMucLuc = $("#tenMucLuc").val();
    const thuTuShow = $("#thuTuShow").val();
    const isActive = $("#isActive").prop("checked"); // Boolean value

    try {
        const res = await $.ajax({
            url: '/api/v1/admin/Create-Muc-Luc',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                TenMucLuc: tenMucLuc,
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

// Cập nhật mục lục từ dữ liệu trong modal
async function update_muc_luc_in_modal() {
    const id = $("#mucLucId").val();
    const tenMucLuc = $("#tenMucLuc").val().trim();
    const thuTuShow = $("#thuTuShow").val().trim();
    const isActive = $("#isActive").prop("checked"); // Boolean value

    try {
        showLoading(null, "Đang cập nhật...");

        const res = await $.ajax({
            url: '/api/v1/admin/Update-Muc-Luc',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                ID: parseInt(id),
                TenMucLuc: tenMucLuc,
                ThuTuShow: parseInt(thuTuShow),
                IsActive: isActive
            })
        });

        hideLoading();

        if (res.success) {
            $("#mucLucModal").modal("hide");
            Sweet_Alert("success", res.message);
            load_data();
        } else {
            Sweet_Alert("error", res.message);
        }
    } catch (error) {
        if (error.responseJSON) {
            Sweet_Alert("error", error.responseJSON.message || "Đã xảy ra lỗi khi cập nhật mục lục");
        } else {
            Sweet_Alert("error", "Đã xảy ra lỗi khi cập nhật mục lục");
        }
    }
}

// Tải dữ liệu danh sách mục lục và hiển thị vào bảng
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
                                    <div class="d-flex justify-content-center">
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

// Lấy chi tiết mục lục theo ID để hiển thị trong form sửa
async function get_muc_luc_by_id(id) {
    try {
        showLoading('#mucLucModal .modal-body', 'Đang tải thông tin mục lục...');

        const res = await $.ajax({
            url: `/api/v1/admin/Get-Muc-Luc-By-Id/${id}`,
            type: 'GET'
        });

        await waitMinLoading('#mucLucModal .modal-body');
        hideLoading('#mucLucModal .modal-body');

        if (res.success && res.data) {
            // Điền dữ liệu vào form
            $("#tenMucLuc").val(res.data.TenMucLuc);
            $("#thuTuShow").val(res.data.ThuTuShow);

            // Thiết lập checkbox IsActive dựa trên giá trị từ server
            // Xử lý các trường hợp kiểu dữ liệu khác nhau
            const isActive = res.data.IsActive;

            if (typeof isActive === 'boolean') {
                $("#isActive").prop('checked', isActive);
            } else if (typeof isActive === 'number') {
                $("#isActive").prop('checked', isActive === 1);
            } else {
                // Nếu là kiểu dữ liệu khác
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
            $("#mucLucModal").data('bs.modal')._config.backdrop = true;
            $("#mucLucModal").data('bs.modal')._config.keyboard = true;
        } else {
            Sweet_Alert("error", res.message || "Không tìm thấy thông tin mục lục");
        }
    } catch (error) {
        Sweet_Alert("error", "Đã xảy ra lỗi khi lấy thông tin mục lục");
    }
}

// Cập nhật trạng thái kích hoạt của mục lục
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