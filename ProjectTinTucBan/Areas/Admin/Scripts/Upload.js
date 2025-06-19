$(document).ready(function () {
    const showToast = (icon, title) => {
        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: icon,
            title: title,
            showConfirmButton: false,
            timer: 2000,
            timerProgressBar: true,
            didOpen: (toast) => {
                toast.addEventListener('mouseenter', Swal.stopTimer);
                toast.addEventListener('mouseleave', Swal.resumeTimer);
            }
        });
    };

    // ========== Upload PDF ==========
    $('#PdfFile').on('change', async function () {
        const file = this.files[0];
        if (!file) return;

        const fileExtension = file.name.split('.').pop().toLowerCase();
        const allowedExtensions = ['pdf'];

        if (!allowedExtensions.includes(fileExtension)) {
            showToast('warning', 'Chỉ cho phép upload file PDF!');
            $(this).val('');
            return;
        }

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
                $('#PdfFileName').text(`Đã chọn: ${file.name}`);
                showToast('success', 'Upload PDF thành công!');
            } else {
                showToast('error', res.message || 'Không thể upload PDF.');
            }
        } catch (err) {
            showToast('error', 'Đã xảy ra lỗi khi upload PDF.');
        }
    });

    // ========== Upload Thumbnail ==========
    $('#ThumbnailFile').on('change', async function () {
        const file = this.files[0];
        if (!file) return;

        const imageExtension = file.name.split('.').pop().toLowerCase();
        const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp'];

        if (!allowedExtensions.includes(imageExtension)) {
            showToast('warning', 'Chỉ cho phép upload hình ảnh (jpg, jpeg, png, webp)!');
            $(this).val('');
            return;
        }

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

                if ($('#ThumbnailPreview').length) {
                    $('#ThumbnailPreview').attr('src', res.link).show();
                }

                if ($('#previewThumbnail').length) {
                    $('#previewThumbnail').html(`<img src="${res.link}" style="max-width: 200px;" />`);
                }

                showToast('success', 'Upload thumbnail thành công!');
            } else {
                showToast('error', res.message || 'Không thể upload thumbnail.');
            }
        } catch (err) {
            showToast('error', 'Đã xảy ra lỗi khi upload thumbnail.');
        }
    });
});
