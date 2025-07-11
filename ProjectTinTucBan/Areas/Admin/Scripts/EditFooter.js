// Thêm hàm chuyển đổi
function parseDateToUnix(dateStr) {
    if (!dateStr) return null;
    var parts = dateStr.split('/');
    if (parts.length !== 3) return null;
    var d = new Date(parts[2], parts[1] - 1, parts[0]);
    if (isNaN(d.getTime())) return null;
    return Math.floor(d.getTime() / 1000);
}
function unixToDateStr(unix) {
    if (!unix || isNaN(unix)) return '';
    var d = new Date(unix * 1000);
    var day = ('0' + d.getDate()).slice(-2);
    var month = ('0' + (d.getMonth() + 1)).slice(-2);
    var year = d.getFullYear();
    return day + '/' + month + '/' + year;
}

$(function () {
    var footerId = $('#footerId').val();

    // Sửa Footer (PUT)
    $('#editFooterForm').submit(function (e) {
        e.preventDefault();
        var data = {
            ID: footerId,
            FullName: $('input[name="fullName"]').val(),
            EnglishName: $('input[name="englishName"]').val(),
            NgayThanhLap: parseDateToUnix($('input[name="established"]').val()),
            DiaChi: $('input[name="address"]').val(),
            DienThoai: $('input[name="phone"]').val(),
            Email: $('input[name="email"]').val(),
            VideoUrl: $('input[name="videoUrl"]').val(),
            FooterCopyright: $('input[name="footerCopyright"]').val(),
            FooterNote: $('input[name="footerNote"]').val(),
            NgayCapNhat: new Date().getFullYear()
        };
        $.ajax({
            url: '/api/admin/footerapi/' + footerId,
            type: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify(data),
            success: function (res) {
                $('#alert-success').text('Cập nhật thành công!').show();
                $('#alert-error').hide();
            },
            error: function () {
                $('#alert-error').text('Có lỗi xảy ra khi cập nhật!').show();
                $('#alert-success').hide();
            }
        });
    });

    // Xóa Footer (DELETE)
    $('#btnDelete').click(function () {
        if (!confirm('Bạn có chắc chắn muốn xóa Footer này?')) return;
        $.ajax({
            url: '/api/admin/footerapi/' + footerId,
            type: 'DELETE',
            success: function () {
                $('#alert-success').text('Đã xóa Footer!').show();
                $('#alert-error').hide();
            },
            error: function () {
                $('#alert-error').text('Có lỗi xảy ra khi xóa!').show();
                $('#alert-success').hide();
            }
        });
    });

    // Lấy Footer theo ID (GET)
    window.loadFooter = function (id) {
        $.get('/api/admin/footerapi/' + id, function (data) {
            $('input[name="fullName"]').val(data.FullName);
            $('input[name="englishName"]').val(data.EnglishName);
            // Chuyển Unix timestamp thành chuỗi ngày
            $('input[name="established"]').val(unixToDateStr(data.NgayThanhLap));
            $('input[name="address"]').val(data.DiaChi);
            $('input[name="phone"]').val(data.DienThoai);
            $('input[name="email"]').val(data.Email);
            $('input[name="videoUrl"]').val(data.VideoUrl);
            $('input[name="footerCopyright"]').val(data.FooterCopyright);
            $('input[name="footerNote"]').val(data.FooterNote);
        });
    }

    // Lấy danh sách Footer (GET ALL)
    window.loadAllFooters = function () {
        $.get('/api/admin/footerapi', function (list) {
            // Xử lý hiển thị danh sách nếu cần
        });
    }

    // Thêm mới Footer (POST)
    window.createFooter = function () {
        var data = {
            FullName: $('input[name="fullName"]').val(),
            EnglishName: $('input[name="englishName"]').val(),
            NgayThanhLap: parseDateToUnix($('input[name="established"]').val()),
            DiaChi: $('input[name="address"]').val(),
            DienThoai: $('input[name="phone"]').val(),
            Email: $('input[name="email"]').val(),
            VideoUrl: $('input[name="videoUrl"]').val(),
            FooterCopyright: $('input[name="footerCopyright"]').val(),
            FooterNote: $('input[name="footerNote"]').val()
        };
        $.ajax({
            url: '/api/admin/footerapi',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(data),
            success: function (res) {
                $('#alert-success').text('Thêm mới thành công!').show();
                $('#alert-error').hide();
            },
            error: function () {
                $('#alert-error').text('Có lỗi xảy ra khi thêm mới!').show();
                $('#alert-success').hide();
            }
        });
    }
});