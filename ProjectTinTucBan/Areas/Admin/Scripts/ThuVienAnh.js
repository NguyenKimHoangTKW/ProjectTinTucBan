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

            if (res.success && Array.isArray(res.data) && res.data.length > 0) {
                const html = res.data.map(link => `
                    <div class="m-2" style="width: 120px;">
                        <img src="${link}" data-link="${link}" class="img-thumbnail img-select" style="cursor: pointer; width: 100%; height: auto;" />
                    </div>
                `).join('');
                container.html(html);
            } else {
                container.html(`<p class="text-danger">Không có ảnh nào trong thư viện.</p>`);
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

        // Ẩn modal ảnh
        $('#modalThuVienAnh').modal('hide');
    });

    // Giữ cho modal thư viện không che modal bài viết
    $('#modalThuVienAnh').on('shown.bs.modal', function () {
        $('body').addClass('modal-open');
    });
});
// Giữ trạng thái cuộn của body khi mở modal thứ 2
$('#modalThuVienAnh').on('shown.bs.modal', function () {
    $('body').addClass('modal-open');
});

// Sau khi đóng modal thư viện ảnh, đảm bảo modal chính vẫn giữ focus
$('#modalThuVienAnh').on('hidden.bs.modal', function () {
    $('body').addClass('modal-open');
});
