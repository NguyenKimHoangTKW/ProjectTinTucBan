$(document).ready(function () {
    // Khi nhấn icon edit
    $('.edit-icon').on('click', function () {
        var field = $(this).data('field');
        var value = $('#' + field + 'Input').val();
        $('#modalInput').val(value);
        $('#modalField').val(field);
        $('#editModal').modal('show');
    });

    // Khi nhấn Lưu trong modal
    $('#saveModalBtn').on('click', function () {
        var field = $('#modalField').val();
        var value = $('#modalInput').val();
        $('#' + field + 'Input').val(value);
        $('#editModal').modal('hide');
    });

    // Khi nhấn Lưu thay đổi ở form chính
    $('#mainSaveBtn').on('click', function (e) {
        e.preventDefault();
        submitEditTaiKhoanForm();
    });

    function submitEditTaiKhoanForm() {
        var form = $('#editTaiKhoanForm');
        var formData = form.serialize();
        $.ajax({
            url: form.attr('action'),
            type: 'POST',
            data: formData,
            success: function (response) {
                Swal.fire({
                    icon: 'success',
                    title: 'Thành công',
                    text: 'Đã thay đổi thành công!'
                });
            },
            error: function () {
                Swal.fire({
                    icon: 'error',
                    title: 'Lỗi',
                    text: 'Có lỗi xảy ra, vui lòng thử lại.'
                });
            }
        });
    }
});