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

var danhSachKhoi = [];
var dataTable;

// Load danh sách Khối
function loadDanhSachKhoi() {
    return $.ajax({
        url: '/api/Khoi',
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
        }
    });
}

// Khởi tạo DataTable
function initDataTable() {
    dataTable = $('#data-table').DataTable({
        "processing": true,
        "serverSide": false,
        "searching": true,
        "ordering": true,
        "paging": true,
        "lengthMenu": [10, 25, 50, 100],
        "data": [],
        "columns": [
            {
                "data": null,
                "orderable": false,
                "searchable": false,
                "render": function (data, type, row, meta) {
                    return meta.row + meta.settings._iDisplayStart + 1;
                }
            },
            { "data": "tenDonVi" },
            {
                "data": "idKhoi",
                "render": function (data) {
                    var khoi = danhSachKhoi.find(k => k.id === data);
                    return khoi ? khoi.tenKhoi : '';
                }
            },
            { "data": "thuTuShow" },
            { "data": "link" },
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
                "targets": [0], // Cột STT
                "width": "50px",
                "className": "text-center"
            }
        ],
        "language": {
            "lengthMenu": "Hiển thị _MENU_ dòng",
            "zeroRecords": "Không tìm thấy dữ liệu",
            "info": "Trang _PAGE_ / _PAGES_",
            "infoEmpty": "Không có dữ liệu",
            "infoFiltered": "(lọc từ _MAX_ dòng)",
            "search": "Tìm kiếm:",
            "paginate": {
                "first": "Đầu",
                "last": "Cuối",
                "next": "Sau",
                "previous": "Trước"
            }
        }
    });
}

// Load danh sách đơn vị trực thuộc
function loadDonViTrucThuoc(idKhoi) {
    var url = idKhoi
        ? '/api/Admin/DonViTrucThuoc/ByKhoi/' + idKhoi
        : '/api/Admin/DonViTrucThuoc';
    $.ajax({
        url: url,
        type: 'GET',
        success: function (data) {
            dataTable.clear().rows.add(data).draw();
        },
        error: function (xhr) {
            Swal.fire('Lỗi!', xhr.responseText || 'Không thể tải dữ liệu.', 'error');
            console.error(xhr);
        }
    });
}

// Hàm chỉnh sửa đơn vị
function editDonVi(id) {
    $.ajax({
        url: '/api/Admin/DonViTrucThuoc/' + id,
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
            Swal.fire('Lỗi!', xhr.responseText || 'Không thể tải thông tin đơn vị.', 'error');
            console.error(xhr);
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
                url: '/api/Admin/DonViTrucThuoc/' + id,
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
                    Swal.fire('Lỗi!', xhr.responseText || 'Không thể xóa đơn vị.', 'error');
                    console.error(xhr);
                }
            });
        }
    });
}

$(document).ready(function () {
    loadDanhSachKhoi().then(function () {
        initDataTable();
        loadDonViTrucThuoc();
    });

    $('#filterKhoi').change(function () {
        loadDonViTrucThuoc($(this).val());
    });

    $('#btnLoadDonVi').click(function () {
        loadDonViTrucThuoc($('#filterKhoi').val());
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
                url: '/api/Admin/DonViTrucThuoc/' + id,
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
                    Swal.fire('Lỗi!', xhr.responseText || 'Không thể cập nhật đơn vị.', 'error');
                    console.error(xhr);
                }
            });
        } else {
            // Thêm mới
            $.ajax({
                url: '/api/Admin/DonViTrucThuoc',
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
                    Swal.fire('Lỗi!', xhr.responseText || 'Không thể thêm đơn vị mới.', 'error');
                    console.error(xhr);
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
});