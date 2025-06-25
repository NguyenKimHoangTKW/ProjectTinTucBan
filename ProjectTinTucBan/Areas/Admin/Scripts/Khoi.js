function unixToDateString(unix) {
    if (!unix || unix == 0) return '';
    var date = new Date(unix * 1000);
    // Định dạng: dd/MM/yyyy
    return date.toLocaleDateString('vi-VN');
}

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

function loadKhoi() {
    $.get('/api/Khoi', function (data) {
        var rows = '';
        $.each(data, function (i, item) {
            rows += `<tr>
                    <td>${item.id}</td>
                    <td>${item.tenKhoi}</td>
                    <td>${item.thuTuShow ?? ''}</td>
                    <td>${unixToDateTimeString(item.ngayDang)}</td>
                    <td>${unixToDateTimeString(item.ngayCapNhat)}</td>
                    <td>
                        <div class="text-center d-flex flex-column align-items-center">
                            <button class="btn btn-warning btn-sm py-1 px-2 w-100 btn-sua" data-id="${item.id}" style="max-width: 80px;">Sửa</button>
                            <button class="btn btn-danger btn-sm py-1 px-2 w-100 mt-1 btn-xoa" data-id="${item.id}" style="max-width: 80px;">Xóa</button>
                        </div>
                    </td>
                </tr>`;
        });
        $('#tblKhoi tbody').html(rows);
    });
}

function editKhoi(id) {
    $.get('/api/Khoi/' + id, function (item) {
        $('#ID').val(item.id);
        $('#TenKhoi').val(item.tenKhoi);
        $('#ThuTuShow').val(item.thuTuShow);
        // Mở modal lớn
        $('.bd-example-modal-lg').modal('show');
    });
}

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
                }
            });
        }
    });
}

$(function () {
    $('#btnLoad').click(loadKhoi);
    loadKhoi();

    $('#khoiForm').submit(function (e) {
        e.preventDefault();
        var id = $('#ID').val();
        var khoi = {
            tenKhoi: $('#TenKhoi').val(),
            thuTuShow: $('#ThuTuShow').val()
        };
        if (id) {
            khoi.id = id;
            $.ajax({
                url: '/api/Khoi/' + id,
                type: 'PUT',
                data: JSON.stringify(khoi),
                contentType: 'application/json',
                success: function () {
                    loadKhoi();
                    $('#khoiForm')[0].reset();
                    $('#ID').val('');
                }
            });
        } else {
            $.ajax({
                url: '/api/Khoi',
                type: 'POST',
                data: JSON.stringify(khoi),
                contentType: 'application/json',
                success: function () {
                    loadKhoi();
                    $('#khoiForm')[0].reset();
                }
            });
        }
    });

    $('#btnClear').click(function () {
        $('#khoiForm')[0].reset();
        $('#ID').val('');
    });

    $('#btnShowKhoiModal').click(function () {
        $('#khoiForm')[0].reset();
        $('#ID').val('');
    });
});

// Gán lại sự kiện sau mỗi lần load bảng
$(document).on('click', '.btn-sua', function () {
    var id = $(this).data('id');
    editKhoi(id);
});

$(document).on('click', '.btn-xoa', function () {
    var id = $(this).data('id');
    deleteKhoi(id);
});

<style>
@media (max-width: 575.98px) {
    .modal-dialog {
        max-width: 98vw !important;
        margin: 0 auto;
    }
    .modal-content {
        border-radius: 0.5rem;
    }
    .modal-footer {
        padding-left: 0.5rem;
        padding-right: 0.5rem;
    }
}
</style>