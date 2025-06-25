function unixToDateString(unix) {
    if (!unix || unix == 0) return '';
    var date = new Date(unix * 1000);
    // Định dạng: dd/MM/yyyy
    return date.toLocaleDateString('vi-VN');
}

function loadKhoi() {
    $.get('/api/Khoi', function (data) {
        var rows = '';
        $.each(data, function (i, item) {
            rows += `<tr>
                    <td>${item.id}</td>
                    <td>${item.tenKhoi}</td>
                    <td>${item.thuTuShow ?? ''}</td>
                    <td>${unixToDateString(item.ngayDang)}</td>
                    <td>${unixToDateString(item.ngayCapNhat)}</td>
                    <td>
                        <button onclick="editKhoi(${item.id})">Sửa</button>
                        <button onclick="deleteKhoi(${item.id})">Xóa</button>
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
    });
}

function deleteKhoi(id) {
    if (confirm('Bạn chắc chắn muốn xóa?')) {
        $.ajax({
            url: '/api/Khoi/' + id,
            type: 'DELETE',
            success: function () {
                loadKhoi();
            }
        });
    }
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
});