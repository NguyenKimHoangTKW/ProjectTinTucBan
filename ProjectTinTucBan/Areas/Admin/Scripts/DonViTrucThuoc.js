$(document).ready(function () {
    loadDanhSachKhoi().then(function () {
        initDataTable();
        loadDonViTrucThuoc();
    });

    $('#filterKhoi').change(function () {
        loadDonViTrucThuoc($(this).val());
    });

    $('#btnShowDonViModal').click(function () {
        $('#ID').val('');
        $('#donViForm')[0].reset();
        $('#donViModal').modal('show');
    });

    $('#donViForm').submit(function (e) {
        e.preventDefault();

        var id = $('#ID').val();
        var donVi = {
            ID_Khoi: $('#ID_Khoi').val(),
            TenDonVi: $('#TenDonVi').val(),
            ThuTuShow: $('#ThuTuShow').val(),
            Link: $('#Link').val()
        };

        if (id) {
            // Cập nhật
            $.ajax({
                url: '/api/v1/admin/donvi-truc-thuoc/' + id,
                type: 'PUT',
                data: JSON.stringify(donVi),
                contentType: 'application/json',
                success: function () {
                    $('#donViForm')[0].reset();
                    $('#ID').val('');
                    $('#donViModal').modal('hide');
                    loadDonViTrucThuoc($('#filterKhoi').val());
                    Swal.fire('Thành công!', 'Đã cập nhật đơn vị.', 'success');
                },
                error: function (xhr) {
                    Swal.fire('Lỗi!', getErrorMessage(xhr), 'error');
                }
            });
        } else {
            // Thêm mới
            $.ajax({
                url: '/api/v1/admin/donvi-truc-thuoc/create',
                type: 'POST',
                data: JSON.stringify(donVi),
                contentType: 'application/json',
                success: function () {
                    $('#donViForm')[0].reset();
                    $('#donViModal').modal('hide');
                    loadDonViTrucThuoc($('#filterKhoi').val());
                    Swal.fire('Thành công!', 'Đã thêm đơn vị mới.', 'success');
                },
                error: function (xhr) {
                    Swal.fire('Lỗi!', getErrorMessage(xhr), 'error');
                }
            });
        }
    });

    $('#btnClear').click(function () {
        $('#donViForm')[0].reset();
        $('#ID').val('');
    });

    $(document).on('click', '.btn-sua-donvi', function () {
        var id = $(this).data('id');
        editDonVi(id);
    });

    $(document).on('click', '.btn-xoa-donvi', function () {
        var id = $(this).data('id');
        deleteDonVi(id);
    });

    // Sửa trạng thái đơn vị
    $(document).on('change', '.toggle-trangthai-donvi', function () {
        var id = $(this).data('id');
        var isActive = $(this).is(':checked');
        var thuTu = $(this).data('thutu');

        // Nếu bật 1 checkbox, tắt các checkbox khác cùng thứ tự
        if (isActive) {
            $('.toggle-trangthai-donvi[data-thutu="' + thuTu + '"]').not(this).each(function () {
                if ($(this).is(':checked')) {
                    $(this).prop('checked', false);
                    // Gửi API cập nhật trạng thái về false cho các đơn vị khác cùng thứ tự
                    var otherId = $(this).data('id');
                    $.ajax({
                        url: '/api/v1/admin/donvi-truc-thuoc/toggle-trang-thai/' + otherId,
                        type: 'PUT',
                        data: JSON.stringify({ IsActive: false }),
                        contentType: 'application/json'
                    });
                }
            });
        }

        // Gửi API cập nhật trạng thái cho đơn vị này
        $.ajax({
            url: '/api/v1/admin/donvi-truc-thuoc/toggle-trang-thai/' + id,
            type: 'PUT',
            data: JSON.stringify({ IsActive: isActive }),
            contentType: 'application/json',
            success: function () {
                // Có thể reload lại bảng nếu muốn đồng bộ trạng thái
                // loadDonViTrucThuoc($('#filterKhoi').val());
            },
            error: function (xhr) {
                Swal.fire('Lỗi!', getErrorMessage(xhr), 'error');
            }
        });
    });

    $('#table_load_donvi').on('draw.dt', function () {
        var PageInfo = $('#table_load_donvi').DataTable().page.info();
        $('#table_load_donvi').DataTable().column(1, { page: 'current' }).nodes().each(function (cell, i) {
            cell.innerHTML = i + 1 + PageInfo.start;
        });
    });
});

// Hàm chuyển Unix timestamp thành chuỗi ngày giờ
function unixToDateTimeString(unix) {
    if (!unix || unix == 0) return '';
    var date = new Date(unix * 1000);
    var day = ('0' + date.getDate()).slice(-2);
    var month = ('0' + (date.getMonth() + 1)).slice(-2);
    var year = date.getFullYear();
    var hours = ('0' + date.getHours()).slice(-2);
    var minutes = ('0' + date.getMinutes()).slice(-2);
    var seconds = ('0' + date.getSeconds()).slice(-2);
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
}

// Hàm xử lý error message từ server
function getErrorMessage(xhr) {
    try {
        if (xhr.responseJSON && xhr.responseJSON.Message) {
            return xhr.responseJSON.Message;
        } else if (xhr.responseText) {
            // Thử parse JSON từ responseText
            var errorResponse = JSON.parse(xhr.responseText);
            if (errorResponse.Message) {
                return errorResponse.Message;
            }
        }
        return xhr.responseText || 'Có lỗi xảy ra.';
    } catch (e) {
        return xhr.responseText || 'Có lỗi xảy ra.';
    }
}

var danhSachKhoi = [];
var dataTable;

// Load danh sách Khối
function loadDanhSachKhoi() {
    return $.ajax({
        url: '/api/v1/admin/khoi/get-all',
        type: 'GET',
        success: function (data) {

            danhSachKhoi = data;
            var options = '<option value="">-- Tất cả Khối --</option>';
            var formOptions = '<option value="">-- Chọn Khối --</option>';
            $.each(data, function (i, item) {
                options += `<option value="${item.id}">${item.tenKhoi}</option>`;
                formOptions += `<option value="${item.id}">${item.tenKhoi}</option>`;
            });
            $('#filterKhoi').html(options);
            $('#ID_Khoi').html(formOptions);
        },
        error: function (xhr) {

        }
    });
}
$(document).ready(function () {
    // Ghi đè hoàn toàn cấu hình ngôn ngữ DataTables
    $.fn.dataTable.ext.errMode = 'none';

    // Thiết lập ngôn ngữ mặc định cho tất cả DataTable
    $.extend(true, $.fn.dataTable.defaults, {
        language: {
            "decimal": "",
            "emptyTable": "Không có dữ liệu trong bảng",
            "info": "Hiển thị _START_ đến _END_ của _TOTAL_ mục",
            "infoEmpty": "Hiển thị 0 đến 0 của 0 mục",
            "infoFiltered": "(được lọc từ _MAX_ tổng số mục)",
            "infoPostFix": "",
            "thousands": ",",
            "lengthMenu": "Hiển thị _MENU_ mục",
            "loadingRecords": "Đang tải...",
            "processing": "Đang xử lý...",
            "search": "Tìm kiếm:",
            "zeroRecords": "Không tìm thấy kết quả phù hợp",
            "paginate": {
                "first": "Đầu",
                "last": "Cuối",
                "next": "Tiếp",
                "previous": "Trước"
            },
            "aria": {
                "sortAscending": ": Kích hoạt để sắp xếp cột tăng dần",
                "sortDescending": ": Kích hoạt để sắp xếp cột giảm dần"
            }
        }
    });

    // Khởi tạo lại DataTable nếu đã tồn tại
    if ($.fn.DataTable.isDataTable('#table_load_donvi')) {
        $('#table_load_donvi').DataTable().destroy();
    }
});

// Khởi tạo DataTable
function initDataTable() {
    dataTable = $('#table_load_donvi').DataTable({
        ...dataTableDefaults,
        "processing": true,
        "serverSide": false,
        "searching": true,
        "ordering": true,
        "paging": true,
        "data": [],
        "columns": [
            { "data": "id", "visible": false },
            {
                "data": null,
                "orderable": false,
                "searchable": false,
                "defaultContent": ""
            },
            {
                "data": "tenDonVi",
                "render": function(data) { return escapeHtml(data); }
            },
            {
                "data": "idKhoi",
                "render": function (data) {
                    var khoi = danhSachKhoi.find(k => k.id === data);
                    return khoi ? escapeHtml(khoi.tenKhoi) : '';
                }
            },
            {
                "data": "thuTuShow",
                "render": function(data) { return escapeHtml(data); }
            },
            {
                "data": "trangThai",
                "orderable": false,
                "className": "text-center",
                "render": function (data, type, row) {
                    return `
                        <label class="switch">
                            <input type="checkbox" class="toggle-trangthai-donvi" data-id="${row.id}" data-thuTu="${row.thuTuShow}" ${data ? 'checked' : ''}>
                            <span class="slider"></span>
                        </label>
                    `;
                }
            },
            {
                "data": "link",
                "render": function(data) { return escapeHtml(data); }
            },
            {
                "data": "ngayDang",
                "render": function (data) {
                    return unixToDateTimeString(data);
                }
            },
            {
                "data": "ngayCapNhat",
                "render": function (data) {
                    return unixToDateTimeString(data);
                }
            },
            {
                "data": null,
                "orderable": false,
                "render": function (data) {
                    return `
                        <div class="text-center d-flex flex-row justify-content-center">
                            <button class="btn-action btn-edit btn-sua-donvi" data-id="${data.id}" title="Sửa">
                                <i class="anticon anticon-edit"></i>
                            </button>
                            <button class="btn-action btn-delete btn-xoa-donvi" data-id="${data.id}" title="Xóa">
                                <i class="anticon anticon-delete"></i>
                            </button>
                        </div>
                    `;
                }
            }
        ],
        "columnDefs": [
            {
                "targets": [1],
                "width": "50px",
                "className": "text-center"
            },
            {
                "targets": [4],
                "className": "text-center"
            },
            {
                "targets": [5],
                "width": "100px",
                "className": "text-center"
            },
            {
                "targets": [9],
                "width": "120px",
                "className": "text-center"
            }
        ],
        "order": []
    });
}

// Load danh sách đơn vị trực thuộc
function loadDonViTrucThuoc(idKhoi) {
    var url = idKhoi
        ? '/api/v1/admin/donvi-truc-thuoc/by-khoi/' + idKhoi
        : '/api/v1/admin/donvi-truc-thuoc/get-all';
    $.ajax({
        url: url,
        type: 'GET',
        success: function (data) {
            dataTable.clear().rows.add(data).draw();
            dataTable.order([]).draw(); // Reset sorting
            dataTable.page('first').draw('page'); // Reset về trang đầu
        },
        error: function (xhr) {
            Swal.fire('Lỗi!', getErrorMessage(xhr), 'error');
        }
    });
}

// Hàm chỉnh sửa đơn vị
function editDonVi(id) {
    $.ajax({
        url: '/api/v1/admin/donvi-truc-thuoc/' + id,
        type: 'GET',
        success: function (item) {
            $('#ID').val(item.id);
            $('#ID_Khoi').val(item.idKhoi);
            $('#TenDonVi').val(item.tenDonVi);
            $('#ThuTuShow').val(item.thuTuShow);
            $('#Link').val(item.link);
            $('#donViModal').modal('show');
        },
        error: function (xhr) {
            Swal.fire('Lỗi!', getErrorMessage(xhr), 'error');
        }
    });
}

// Hàm xóa đơn vị
function deleteDonVi(id) {
    Swal.fire({
        title: 'Bạn chắc chắn muốn xóa?',
        text: "Hành động này không thể hoàn tác!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Xóa',
        cancelButtonText: 'Hủy'
    }).then((result) => {
        if (result.isConfirmed) {
            $.ajax({
                url: '/api/v1/admin/donvi-truc-thuoc/' + id,
                type: 'DELETE',
                success: function () {
                    loadDonViTrucThuoc($('#filterKhoi').val());
                    Swal.fire(
                        'Đã xóa!',
                        'Đơn vị trực thuộc đã được xóa thành công.',
                        'success'
                    );
                },
                error: function (xhr) {
                    Swal.fire('Lỗi!', getErrorMessage(xhr), 'error');
                }
            });
        }
    });
}