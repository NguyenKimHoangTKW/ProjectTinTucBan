// Hàm chuyển Unix timestamp thành chuỗi ngày giờ
function unixToDateTimeString(unix) {
    if (!unix || unix == 0) return '';
    var date = new Date(unix * 1000);
    // Định dạng: dd/MM/yyyy HH:mm:ss
    var day = ('0' + date.getDate()).slice(-2);
    var month = ('0' + (date.getMonth() + 1)).slice(-2);
    var year = date.getFullYear();
    var hours = ('0' + date.getHours()).slice(-2);
    var minutes = ('0' + date.getMinutes()).slice(-2);
    var seconds = ('0' + date.getSeconds()).slice(-2);
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
}

var dataTable;

// Khởi tạo DataTable
function initDataTable() {
    dataTable = $('#table_load_khoi').DataTable({
        "processing": true,
        "serverSide": false,
        "searching": true,
        "ordering": true,
        "paging": true,
        "lengthMenu": [10, 25, 50, 100],
        "data": [],
        "columns": [
            { "data": "id", "visible": false }, // Cột ID ẩn
            {
                "data": null,
                "orderable": false,
                "searchable": false,
                "render": function (data, type, row, meta) {
                    return meta.row + meta.settings._iDisplayStart + 1;
                }
            },
            { "data": "tenKhoi" },
            { "data": "thuTuShow" },
            {
                "data": null, // Không phụ thuộc dữ liệu từ server
                "orderable": false,
                "className": "text-center",
                "render": function (data, type, row) {
                    return `
                        <label class="switch">
                            <input type="checkbox" class="toggle-trangthai-khoi" data-id="${row.id}" data-thutu="${row.thuTuShow}" ${row.isActive ? 'checked' : ''}>
                            <span class="slider"></span>
                        </label>
                    `;
                }
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
                            <button class="btn-action btn-edit btn-sua" data-id="${data.id}" title="Sửa">
                                <i class="anticon anticon-edit"></i>
                            </button>
                            <button class="btn-action btn-delete btn-xoa" data-id="${data.id}" title="Xóa">
                                <i class="anticon anticon-delete"></i>
                            </button>
                        </div>
                    `;
                }
            }
        ],
        "columnDefs": [
            {
                "targets": [1], // Cột STT
                "width": "50px",
                "className": "text-center"
            },
            {
                "targets": [3], // Cột Thứ tự
                "className": "text-center"
            },
            {
                "targets": [4], // Cột Trạng thái
                "width": "100px",
                "className": "text-center"
            },
            {
                "targets": [7], // Cột Hành động
                "width": "120px",
                "className": "text-center"
            }
        ],
        "order": []
    });
}

// Load danh sách khối
function loadKhoi() {
    $.ajax({
        url: '/api/Khoi',
        type: 'GET',
        success: function (data) {
            console.log('Loaded khoi data:', data); // Debug log
            dataTable.clear().rows.add(data).draw();
        },
        error: function (xhr) {
            console.error('Error loading khoi:', xhr); // Debug log
            Swal.fire('Lỗi!', 'Không thể tải dữ liệu khối.', 'error');
        }
    });
}

// Hàm chỉnh sửa khối
function editKhoi(id) {
    $.ajax({
        url: '/api/Khoi/' + id,
        type: 'GET',
        success: function (item) {
            $('#ID').val(item.id);
            $('#TenKhoi').val(item.tenKhoi);
            $('#ThuTuShow').val(item.thuTuShow);
            $('#khoiModal').modal('show');
        },
        error: function (xhr) {
            Swal.fire('Lỗi!', 'Không thể tải thông tin khối.', 'error');
            console.error(xhr);
        }
    });
}

// Hàm xóa khối
function deleteKhoi(id) {
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
                url: '/api/Khoi/' + id,
                type: 'DELETE',
                success: function () {
                    loadKhoi();
                    Swal.fire(
                        'Đã xóa!',
                        'Khối đã được xóa thành công.',
                        'success'
                    );
                },
                error: function (xhr) {
                    Swal.fire('Lỗi!', 'Không thể xóa khối.', 'error');
                    console.error(xhr);
                }
            });
        }
    });
}

$(document).ready(function () {
    // Khởi tạo DataTable
    initDataTable();
    // Load dữ liệu ban đầu
    loadKhoi();

    // Mở modal thêm mới
    $('#btnShowKhoiModal').click(function () {
        $('#ID').val('');
        $('#khoiForm')[0].reset();
        $('#khoiModal').modal('show');
    });

    // Xử lý form submit
    $('#khoiForm').submit(function (e) {
        e.preventDefault();

        var id = $('#ID').val();
        var khoi = {
            TenKhoi: $('#TenKhoi').val(),
            ThuTuShow: $('#ThuTuShow').val()
        };

        if (id) {
            // Cập nhật
            $.ajax({
                url: '/api/Khoi/' + id,
                type: 'PUT',
                data: JSON.stringify(khoi),
                contentType: 'application/json',
                success: function () {
                    $('#khoiForm')[0].reset();
                    $('#ID').val('');
                    $('#khoiModal').modal('hide');
                    loadKhoi();
                    Swal.fire('Thành công!', 'Đã cập nhật khối.', 'success');
                },
                error: function (xhr) {
                    Swal.fire('Lỗi!', 'Không thể cập nhật khối.', 'error');
                    console.error(xhr);
                }
            });
        } else {
            // Thêm mới
            $.ajax({
                url: '/api/Khoi',
                type: 'POST',
                data: JSON.stringify(khoi),
                contentType: 'application/json',
                success: function () {
                    $('#khoiForm')[0].reset();
                    $('#khoiModal').modal('hide');
                    loadKhoi();
                    Swal.fire('Thành công!', 'Đã thêm khối mới.', 'success');
                },
                error: function (xhr) {
                    Swal.fire('Lỗi!', 'Không thể thêm khối mới.', 'error');
                    console.error(xhr);
                } 
            });
        }
    });

    // Nút xóa form
    $('#btnClear').click(function () {
        $('#khoiForm')[0].reset();
        $('#ID').val('');
    });

    // Gán sự kiện cho nút sửa, xóa
    $(document).on('click', '.btn-sua', function () {
        var id = $(this).data('id');
        editKhoi(id);
    });

    $(document).on('click', '.btn-xoa', function () {
        var id = $(this).data('id');
        deleteKhoi(id);
    });

    // Gán sự kiện cho toggle trạng thái
    $(document).on('change', '.toggle-trangthai-khoi', function () {
        var id = $(this).data('id');
        var isActive = $(this).is(':checked');
        var thuTu = $(this).data('thutu');

        // Nếu bật 1 checkbox, tắt các checkbox khác cùng thứ tự và cập nhật trạng thái về false trên server
        if (isActive) {
            $('.toggle-trangthai-khoi[data-thutu="' + thuTu + '"]').not(this).each(function () {
                if ($(this).is(':checked')) {
                    $(this).prop('checked', false);
                    var otherId = $(this).data('id');
                    $.ajax({
                        url: '/api/Khoi/ToggleTrangThai/' + otherId,
                        type: 'PUT',
                        data: JSON.stringify({ IsActive: false }),
                        contentType: 'application/json'
                    });
                }
            });
        }

        // Gửi trạng thái mới lên server
        $.ajax({
            url: '/api/Khoi/ToggleTrangThai/' + id,
            type: 'PUT',
            data: JSON.stringify({ IsActive: isActive }),
            contentType: 'application/json',
            success: function () {
                // Có thể reload lại bảng nếu muốn đồng bộ trạng thái
                // loadKhoi();
            },
            error: function () {
                Swal.fire('Lỗi!', 'Không thể cập nhật trạng thái khối.', 'error');
            }
        });
    });
});
