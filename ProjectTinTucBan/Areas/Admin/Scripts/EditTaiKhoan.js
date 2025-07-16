$(function () {
    // Hiển thị modal khi click icon chỉnh sửa
    $('.edit-icon').click(function () {
        var field = $(this).data('field');
        var value = $('#' + field + 'Input').val();
        $('#modalField').val(field);
        $('#modalInput').val(value);
        $('#editModal').modal('show');
    });

    // Lưu thay đổi từ modal vào input
    $('#saveModalBtn').click(function () {
        var field = $('#modalField').val();
        var value = $('#modalInput').val();
        $('#' + field + 'Input').val(value);
        $('#editModal').modal('hide');
    });

    // Gửi dữ liệu lên API khi bấm Lưu thay đổi
    $('#mainSaveBtn').click(function (e) {
        e.preventDefault();

        var id = $('.edit-container').data('id');
        if (!id) {
            Swal.fire('Lỗi', 'Không xác định được ID tài khoản!', 'error');
            return;
        }
        var data = {
            ID: id,
            Name: $('#NameInput').val(),
            SDT: $('#SDTInput').val(),
            Gmail: $('#GmailInput').val()
        };

        $.ajax({
            url: '/api/Admin/TaiKhoan/Update/' + id,
            type: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify(data),
            success: function (res) {
                Swal.fire('Thành công', res.message, 'success');
            },
            error: function (xhr) {
                var msg = xhr.responseJSON && xhr.responseJSON.message ? xhr.responseJSON.message : 'Có lỗi xảy ra!';
                Swal.fire('Lỗi', msg, 'error');
            }
        });
    });
});