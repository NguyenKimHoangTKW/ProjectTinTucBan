let table; // Khai báo biến toàn cục
$(document).ready(function () {
    // ✅ Khởi tạo DataTable 1 lần duy nhất
    table = $('#tableHDSD').DataTable({
        columns: [
            { data: null }, // STT
            {
                data: 'tenTaiLieu',
                render: function (data, type, row) {
                    const shortName = data.length > 20 ? data.substring(0, 20) + '...' : data;
                    return `<span title="${data}">${shortName}</span>`;
                }
            },
            { data: 'ngayTao' },
            {
                data: null,
                render: function (data, type, row) {
                    return `
                    <a href="${row.url}" target="_blank" class="btn btn-sm btn-primary me-1">
                        <i class="anticon anticon-eye"></i>
                    </a>
                    <button class="btn btn-sm btn-danger btn-xoa-tai-lieu" data-stt="${row.stt}">
                        <i class="anticon anticon-delete"></i>
                    </button>
                `;
                }
            }
        ],
        columnDefs: [{
            targets: 0,
            render: (data, type, row, meta) => meta.row + 1
        }],
        data: []
    });

    // ✅ Gọi dữ liệu tài liệu ban đầu
    loadDanhSachTaiLieu();
});

// ✅ Sự kiện chọn file => tự động điền tên vào input
$('#fileTaiLieu').on('change', function () {
    const file = this.files[0];
    if (file) {
        const fileName = file.name;
        const baseName = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
        $('input[name="TenTaiLieu"]').val(baseName);
    }
});

$('#formTaiLieu').on('submit', function (e) {
    e.preventDefault();

    const fileInput = $('#fileTaiLieu')[0];
    if (fileInput.files.length === 0) {
        Sweet_Alert('error', 'Vui lòng chọn tệp tài liệu.');
        return;
    }

    const file = fileInput.files[0];
    const fileName = file.name;
    const baseName = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('Ten_TaiLieu', baseName);

    $.ajax({
        url: '/api/v1/admin/hdsd/upload',
        type: 'POST',
        data: formData,
        processData: false,
        contentType: false,
        success: function (res) {
            if (res.success) {
                Sweet_Alert('success', 'Tài liệu đã được thêm.');
                $('#modalThemTaiLieu').modal('hide');
                $('#formTaiLieu')[0].reset();
                loadDanhSachTaiLieu();
            } else {
                Sweet_Alert('error', res.message || 'Không thể thêm tài liệu.');
            }
        },
        error: function () {
            Sweet_Alert('error', 'Lỗi khi gọi API upload.');
        }
    });
});

// ✅ Hàm load danh sách tài liệu từ API
function loadDanhSachTaiLieu() {
    $.ajax({
        url: '/api/v1/admin/hdsd/get-all', // Đảm bảo API này tồn tại
        type: 'GET',
        dataType: 'json',
        success: function (res) {
            if (res.success) {
                table.clear().rows.add(res.data).draw();
            } else {
                Swal.fire('Lỗi', res.message || 'Không tải được danh sách tài liệu.', 'error');
            }
        },
        error: function () {
            Swal.fire('Lỗi', 'Không thể tải danh sách tài liệu.', 'error');
        }
    });
}
// ✅ Sự kiện mở modal thêm tài liệu
$(document).on('click', '#btnThemTaiLieu', function () {
    $('#modalThemTaiLieu').modal('show');
}); 

$(document).on('click', '.btn-xoa-tai-lieu', function () {
    const stt = $(this).data('stt');

    Swal.fire({
        title: 'Xác nhận xóa',
        text: 'Bạn có chắc muốn xóa tài liệu này?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Xóa',
        cancelButtonText: 'Hủy'
    }).then((result) => {
        if (result.isConfirmed) {
            $.ajax({
                url: '/api/v1/admin/hdsd/delete?stt=' + stt,
                type: 'DELETE',
                success: function (res) {
                    if (res.success) {
                        Swal.fire('Thành công', res.message, 'success');
                        loadDanhSachTaiLieu();
                    } else {
                        Swal.fire('Lỗi', res.message || 'Không thể xóa.', 'error');
                    }
                },
                error: function () {
                    Swal.fire('Lỗi', 'Không thể gọi API xóa.', 'error');
                }
            });
        }
    });
});

