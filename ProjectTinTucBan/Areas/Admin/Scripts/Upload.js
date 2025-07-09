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
        const files = Array.from(this.files);
        if (!files.length) return;

        for (const file of files) {
            const fileExtension = file.name.split('.').pop().toLowerCase();
            const allowedExtensions = ['pdf'];

            if (!allowedExtensions.includes(fileExtension)) {
                showToast('warning', `File ${file.name} không hợp lệ. Chỉ cho phép PDF.`);
                continue;
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

                if (res.success && res.link) {
                    const id = Date.now() + Math.floor(Math.random() * 1000);
                    uploadedPDFs.push({ id, file, url: res.link });

                    const pdfHTML = `
                    <div class="pdf-preview-box" data-id="${id}">
                        <a href="${res.link}" target="_blank">${file.name}</a>
                        <button type="button" class="btn-xoa-pdf" title="Xóa">&times;</button>
                    </div>`;
                    $('#previewPDF').append(pdfHTML);

                    showToast('success', `Upload ${file.name} thành công!`);
                } else {
                    showToast('error', `Upload ${file.name} thất bại.`);
                }
            } catch (err) {
                showToast('error', `Lỗi khi upload ${file.name}.`);
            }
        }
    });



    // ========== Upload Thumbnail ==========
    $('#ThumbnailFile').on('change', async function () {
        const file = this.files[0];
        if (!file) return;

        const imageExtension = file.name.split('.').pop().toLowerCase();
        const allowedExtensions = ['jpg', 'jpeg', 'png'];

        if (!allowedExtensions.includes(imageExtension)) {
            showToast('warning', 'Chỉ cho phép upload hình ảnh (jpg, jpeg, png)!');
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