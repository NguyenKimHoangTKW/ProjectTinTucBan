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

    // Thêm mới và cập nhật khối
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
                url: '/api/v1/admin/khoi/update/' + id,
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
                }
            });
        } else {
            // Thêm mới
            $.ajax({
                url: '/api/v1/admin/khoi/create',
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
                }
            });
        }
    });

    // Gán sự kiện cho toggle trạng thái
    $(document).on('change', '.toggle-trangthai-khoi', function () {
        var id = $(this).data('id');
        var isActive = $(this).is(':checked');
        var thuTu = $(this).data('thutu');

        if (isActive) {
            $('.toggle-trangthai-khoi[data-thutu="' + thuTu + '"]').not(this).each(function () {
                if ($(this).is(':checked')) {
                    $(this).prop('checked', false);
                    var otherId = $(this).data('id');
                    $.ajax({
                        url: '/api/v1/admin/khoi/toggle-trang-thai/' + otherId,
                        type: 'PUT',
                        data: JSON.stringify({ IsActive: false }),
                        contentType: 'application/json'
                    });
                }
            });
        }

        $.ajax({
            url: '/api/v1/admin/khoi/toggle-trang-thai/' + id,
            type: 'PUT',
            data: JSON.stringify({ IsActive: isActive }),
            contentType: 'application/json',
            success: function () {
                loadKhoi();
            },
            error: function () {
                Swal.fire('Lỗi!', 'Không thể cập nhật trạng thái khối.', 'error');
            }
        });
    });
});
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
                "render": function (data, type, row, meta) {
                    return meta.row + meta.settings._iDisplayStart + 1;
                }
            },
            {
                "data": "tenKhoi",
                "render": function(data) { return escapeHtml(data); }
            },
            {
                "data": "thuTuShow",
                "render": function(data) { return escapeHtml(data); }
            },
            {
                "data": null,
                "orderable": false,
                "className": "text-center",
                "render": function (data, type, row) {
                    return `
                        <label class="switch">
                            <input type="checkbox" class="toggle-trangthai-khoi" data-id="${row.id}" data-thuTu="${row.thuTuShow}" ${row.isActive ? 'checked' : ''}>
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
                    let html = `
            <div class="text-center d-flex flex-row justify-content-center">
                <button class="btn-action btn-edit btn-sua" data-id="${data.id}" title="Sửa">
                    <i class="anticon anticon-edit"></i>
                </button>
        `;
                    if (!data.isActive) {
                        html += `
                <button class="btn-action btn-delete btn-xoa" data-id="${data.id}" title="Xóa">
                    <i class="anticon anticon-delete"></i>
                </button>
            `;
                    }
                    html += `</div>`;
                    return html;
                }
            }
        ],
        "columnDefs": [
            {
                "targets": [1, 3, 4, 5, 6, 7],
                "className": "text-center"
            },
            {
                "targets": [2],
                "className": "text-left"
            }
        ],
        "order": []
    });
}

// Load danh sách khối
function loadKhoi() {
    $.ajax({
        url: '/api/v1/admin/khoi/get-all',
        type: 'GET',
        success: function (data) {
            dataTable.clear().rows.add(data).draw();
        },
        error: function (xhr) {
            Swal.fire('Lỗi!', 'Không thể tải dữ liệu khối.', 'error');
        }
    });
}

// Hàm chỉnh sửa khối
function editKhoi(id) {
    $.ajax({
        url: '/api/v1/admin/khoi/get/' + id,
        type: 'GET',
        success: function (item) {
            $('#ID').val(item.id);
            $('#TenKhoi').val(item.tenKhoi);
            $('#ThuTuShow').val(item.thuTuShow);
            $('#khoiModal').modal('show');
        },
        error: function (xhr) {
            Swal.fire('Lỗi!', 'Không thể tải thông tin khối.', 'error');
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
                url: '/api/v1/admin/khoi/delete/' + id,
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
                }
            });
        }
    });
}