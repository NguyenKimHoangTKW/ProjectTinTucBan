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