//const BASE_URL = `/api/v1/admin`;

$(document).ready(function () {
    $('#PdfFile').on('change', async function () {
        const file = this.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await $.ajax({
                url: `${BASE_URL}/upload-pdf`,
                type: 'POST',
                data: formData,
                contentType: false,
                processData: false,
            });

            if (res.success) {
                $('#LinkPDF').val(res.link);
                alert('Upload PDF thành công!');

                // 👉 (Tùy chọn) Nếu muốn hiển thị tên file tải lên
                if ($('#PdfFileName').length) {
                    const fileName = file.name;
                    $('#PdfFileName').text(`Đã chọn: ${fileName}`);
                }
            } else {
                alert(res.message || 'Upload PDF thất bại.');
            }
        } catch (err) {
            console.error('Upload PDF lỗi:', err);
            alert('Đã xảy ra lỗi khi upload PDF.');
        }
    });
});
