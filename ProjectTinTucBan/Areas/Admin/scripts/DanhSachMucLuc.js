// Initialize Select2 components if available
$(document).ready(function () {
    if ($.fn.select2) {
        $(".select2").select2();
    }
});

let value_check = null;

$(document).ready(function () {
    console.log("Document ready - Checking path: " + window.location.pathname);

    // Chỉ gọi load_data() trên trang danh sách mục lục
    if (window.location.pathname.toLowerCase().includes('index_mucluc_admin')) {
        console.log("Loading data for Index_MucLuc_Admin page");
        setTimeout(function () {
            load_data();
        }, 300); // Delay nhỏ để đảm bảo DOM đã sẵn sàng
    }

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
}

// Mở modal ở chế độ thêm mới
function openMucLucModalForAdd() {
    // Reset form và thiết lập chế độ
    $("#mucLucForm")[0].reset();
    $("#mucLucId").val("");
    $("#formMode").val("add");

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
    // Reset form và thiết lập chế độ
    $("#mucLucForm")[0].reset();
    $("#mucLucId").val(id);
    $("#formMode").val("edit");

    // Cập nhật tiêu đề và nút lưu
    $("#mucLucModalLabel").text("Chỉnh sửa mục lục");
    $("#btnSaveText").text("Lưu thay đổi");

    // Hiển thị phần chỉ dành cho chỉnh sửa
    $("#editOnlyFields").show();

    // Lấy dữ liệu và điền vào form
    get_muc_luc_by_id(id);

    // Mở modal
    $("#mucLucModal").modal("show");
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
            url: '/api/v1/admin/Delete-Muc-Luc',
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
        console.error(error);
    }
}

// Add new muc luc từ modal
async function add_new_in_modal() {
    const tenMucLuc = $("#tenMucLuc").val();
    const link = $("#link").val();
    const thuTuShow = $("#thuTuShow").val();

    try {
        const res = await $.ajax({
            url: '/api/v1/admin/Create-Muc-Luc',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                TenMucLuc: tenMucLuc,
                Link: link,
                ThuTuShow: parseInt(thuTuShow)
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
        // Trích xuất thông báo lỗi từ response
        console.log("Error object:", error);

        // Hiển thị thông báo lỗi chi tiết từ máy chủ nếu có
        if (error.responseJSON) {
            Sweet_Alert("error", error.responseJSON.message || "Đã xảy ra lỗi khi thêm mục lục");
        } else {
            Sweet_Alert("error", "Đã xảy ra lỗi khi thêm mục lục");
        }

        console.error(error);
    }
}

// Update muc luc từ modal
async function update_muc_luc_in_modal() {
    const id = $("#mucLucId").val();
    const tenMucLuc = $("#tenMucLuc").val();
    const link = $("#link").val();
    const thuTuShow = $("#thuTuShow").val();

    try {
        const res = await $.ajax({
            url: '/api/v1/admin/Update-Muc-Luc',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                ID: parseInt(id),
                TenMucLuc: tenMucLuc,
                Link: link,
                ThuTuShow: parseInt(thuTuShow)
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
        // Trích xuất thông báo lỗi từ response
        console.log("Error object:", error);

        // Hiển thị thông báo lỗi chi tiết từ máy chủ nếu có
        if (error.responseJSON) {
            Sweet_Alert("error", error.responseJSON.message || "Đã xảy ra lỗi khi thêm mục lục");
        } else {
            Sweet_Alert("error", "Đã xảy ra lỗi khi thêm mục lục");
        }

        console.error(error);
    }
}

// Load data table
async function load_data() {
    try {
        console.log("Bắt đầu tải danh sách mục lục");

        // Hiển thị loading và xóa table hiện tại
        $('#data-table').empty().html('<div class="text-center my-4"><p>Đang tải dữ liệu...</p></div>');

        // Gọi API với tham số cache: false để đảm bảo không sử dụng cache
        $.ajax({
            url: '/api/v1/admin/Get-All-Muc-Luc',
            type: 'GET',
            dataType: 'json',
            cache: false,
            success: function (response) {
                console.log("API trả về:", response);

                // Xóa nội dung loading
                $('#data-table').empty();

                // Tạo lại cấu trúc table
                $('#data-table').html(`
                    <thead>
                        <tr>
                            <th>STT</th>
                            <th>Tên mục lục</th>
                            <th>Link</th>
                            <th>Vị trí hiển thị</th>
                            <th>Ngày đăng</th>
                            <th>Ngày cập nhật</th>
                            <th>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                `);

                // Khởi tạo DataTable với dữ liệu
                if ($.fn.DataTable.isDataTable('#data-table')) {
                    $('#data-table').DataTable().destroy();
                }

                // Chuyển đổi dữ liệu timestamp thành định dạng ngày tháng
                let processedData = [];
                if (response.data && Array.isArray(response.data)) {
                    processedData = response.data.map(item => {
                        // Tạo một object mới với các thuộc tính của item
                        const newItem = { ...item };

                        // Nếu NgayDang và NgayCapNhat là số int (unix timestamp), chuyển đổi chúng
                        if (item.NgayDang && !isNaN(parseInt(item.NgayDang))) {
                            newItem.NgayDang = unixTimestampToDate(parseInt(item.NgayDang));
                        }

                        if (item.NgayCapNhat && !isNaN(parseInt(item.NgayCapNhat))) {
                            newItem.NgayCapNhat = unixTimestampToDate(parseInt(item.NgayCapNhat));
                        }

                        return newItem;
                    });
                }

                $('#data-table').DataTable({
                    data: processedData || [],
                    columns: [
                        {
                            data: null,
                            render: function (data, type, row, meta) {
                                return meta.row + 1;
                            }
                        },
                        { data: 'TenMucLuc' },
                        { data: 'Link' },
                        { data: 'ThuTuShow' },
                        { data: 'NgayDang' },
                        { data: 'NgayCapNhat' },
                        {
                            data: null,
                            orderable: false,
                            render: function (data) {
                                return `
                                      <div class="d-flex">
                                        <button class="btn-action btn-edit mr-2" id="btnEdit" data-id="${data.ID || ''}" data-ten="${(data.TenMucLuc || '').replace(/"/g, '&quot;')}">
                                            <i class="anticon anticon-edit"></i>
                                        </button>
                                        <button class="btn-action btn-delete" id="btnDelete" data-id="${data.ID || ''}" data-ten="${(data.TenMucLuc || '').replace(/"/g, '&quot;')}">
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
                        search: "Tìm kiếm:",
                        lengthMenu: "Hiển thị _MENU_ mục",
                        emptyTable: "Không có dữ liệu",
                        zeroRecords: "Không tìm thấy kết quả phù hợp"
                    }
                });

                if (!response.success) {
                    Sweet_Alert("info", response.message || "Không có dữ liệu");
                }
            },
            error: function (xhr, status, error) {
                console.error("Lỗi khi tải dữ liệu:", error);
                console.error("Chi tiết:", xhr);

                // Hiển thị thông báo lỗi
                $('#data-table').empty().html(`
                    <thead>
                        <tr>
                            <th>STT</th>
                            <th>Tên mục lục</th>
                            <th>Link</th>
                            <th>Vị trí hiển thị</th>
                            <th>Ngày đăng</th>
                            <th>Ngày cập nhật</th>
                            <th>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td colspan="7" class="text-center">Đã xảy ra lỗi: ${xhr.status} - ${xhr.statusText}</td>
                        </tr>
                    </tbody>
                `);

                Sweet_Alert("error", "Không thể tải danh sách: " + xhr.statusText);
            }
        });
    } catch (error) {
        console.error("Lỗi JS:", error);
        Sweet_Alert("error", "Lỗi JavaScript: " + error.message);
    }
}

// Get muc luc details for edit form
async function get_muc_luc_by_id(id) {
    try {
        const res = await $.ajax({
            url: `/api/v1/admin/Get-Muc-Luc-By-Id/${id}`,
            type: 'GET'
        });

        if (res.success && res.data) {
            // Fill form fields with data
            $("#tenMucLuc").val(res.data.TenMucLuc);
            $("#link").val(res.data.Link);
            $("#link").prop('readonly', true); // Make link read-only
            $("#thuTuShow").val(res.data.ThuTuShow);

            // Chuyển đổi timestamp ngày đăng sang định dạng ngày tháng
            if (res.data.NgayDang && !isNaN(parseInt(res.data.NgayDang))) {
                $("#ngayDang").val(unixTimestampToDate(parseInt(res.data.NgayDang)));
            } else {
                $("#ngayDang").val(res.data.NgayDang || "");
            }

            // Chuyển đổi timestamp ngày cập nhật sang định dạng ngày tháng
            if (res.data.NgayCapNhat && !isNaN(parseInt(res.data.NgayCapNhat))) {
                $("#ngayCapNhat").val(unixTimestampToDate(parseInt(res.data.NgayCapNhat)));
            } else {
                $("#ngayCapNhat").val(res.data.NgayCapNhat || "");
            }
        } else {
            Sweet_Alert("error", res.message || "Không tìm thấy thông tin mục lục");
        }
    } catch (error) {
        Sweet_Alert("error", "Đã xảy ra lỗi khi lấy thông tin mục lục");
        console.error(error);
    }
}

// Helper function for alerts
function Sweet_Alert(icon, title) {
    Swal.fire({
        position: "center",
        icon: icon,
        title: title,
        showConfirmButton: false,
        timer: 2500
    });
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

function unixTimestampToDate(unixTimestamp) {
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