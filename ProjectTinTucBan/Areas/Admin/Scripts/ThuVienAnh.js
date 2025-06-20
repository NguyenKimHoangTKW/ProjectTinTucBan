$(document).ready(function () {
    // Khi mở modal thư viện ảnh, tải ảnh từ server
    $('#modalThuVienAnh').on('show.bs.modal', async function () {
        const container = $('#thuVienAnh');
        container.html('<p class="text-muted">Đang tải ảnh...</p>');

        try {
            const res = await $.ajax({
                url: `${BASE_URL}/thu-vien-anh`,
                type: 'GET'
            });

            if (res.success && Array.isArray(res.data)) {
                const html = res.data.map(link => `
                    <div class="m-2" style="width: 120px;">
                        <img src="${link}" data-link="${link}" class="img-thumbnail img-select" style="cursor: pointer;" />
                    </div>`).join('');
                container.html(html);
            } else {
                container.html(`<p class="text-danger">${res.message || 'Không thể tải ảnh.'}</p>`);
            }
        } catch (err) {
            container.html('<p class="text-danger">Lỗi khi tải ảnh từ server.</p>');
        }
    });

    // Khi người dùng click chọn 1 ảnh
    $(document).on('click', '.img-select', function () {
        const link = $(this).data('link');

        // Cập nhật hidden field và ảnh xem trước
        $('#LinkThumbnail').val(link);
        $('#previewThumbnail').html(`<img src="${link}" style="max-width: 200px;" />`);

        // Ẩn modal
        $('#modalThuVienAnh').modal('hide');
    });
});
