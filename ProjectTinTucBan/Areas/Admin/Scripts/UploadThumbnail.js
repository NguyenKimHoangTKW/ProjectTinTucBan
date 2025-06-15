//const BASE_URL = `/api/v1/admin`;

$(document).ready(function () {
    $('#ThumbnailFile').on('change', async function () {
        const file = this.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await $.ajax({
                url: `${BASE_URL}/upload-thumbnail`,
                type: 'POST',
                data: formData,
                contentType: false,
                processData: false,
            });

            if (res.success) {
                $('#LinkThumbnail').val(res.link);
                alert('Upload thumbnail thành công!');

                // 👉 (Tuỳ chọn) Nếu bạn muốn hiển thị preview hình ảnh:
                if ($('#ThumbnailPreview').length) {
                    $('#ThumbnailPreview').attr('src', res.link).show();
                }
            } else {
                alert(res.message || 'Upload thumbnail thất bại.');
            }
        } catch (err) {
            console.error('Upload thumbnail lỗi:', err);
            alert('Đã xảy ra lỗi khi upload thumbnail.');
        }
    });
});
