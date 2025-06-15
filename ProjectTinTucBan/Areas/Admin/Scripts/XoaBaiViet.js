const BASE_URL = `/api/v1/admin`;

$(document).ready(function () {
    const baiVietID = $('#BaiVietID').val(); // Hidden input chứa ID bài viết

    // Tải dữ liệu bài viết để hiển thị xác nhận
    $.get(`${BASE_URL}/get-baiviet-by-id/${baiVietID}`, function (res) {
        if (res.success) {
            const data = res.data;
            $('#Xoa_TieuDe').text(data.TieuDe || '[Không có tiêu đề]');
            $('#Xoa_NoiDung').html(data.NoiDung || '[Không có nội dung]');
            $('#Xoa_Thumbnail').attr('href', data.LinkThumbnail || '#');
            $('#Xoa_PDF').attr('href', data.LinkPDF || '#');
        } else {
            alert('Không thể tải thông tin bài viết.');
        }
    });

    // Xác nhận xóa
    $('#btnXacNhanXoaBaiViet').on('click', async function () {
        if (!baiVietID) {
            alert('ID bài viết không hợp lệ.');
            return;
        }

        const confirmDelete = confirm('Bạn có chắc chắn muốn xóa bài viết này không?');
        if (!confirmDelete) return;

        try {
            const res = await $.ajax({
                url: `${BASE_URL}/xoa-baiviet/${baiVietID}`,
                type: 'DELETE'
            });

            if (res.success) {
                alert('Đã xóa bài viết thành công!');
                window.location.href = '/Admin/InterfaceAdmin/BaiViet';
            } else {
                alert(res.message || 'Không thể xóa bài viết');
            }
        } catch (err) {
            console.error(err);
            alert('Lỗi xảy ra khi gửi yêu cầu xóa.');
        }
    });
});
