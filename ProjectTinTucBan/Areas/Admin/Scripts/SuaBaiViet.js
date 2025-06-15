//const BASE_URL = `/api/v1/admin`;

//$(document).ready(function () {
//    const baiVietID = $('#BaiVietID').val();

//    // Khởi tạo CKEditor
//    CKEDITOR.replace('NoiDung');

//    // Load dữ liệu ban đầu
//    $.get(`${BASE_URL}/get-baiviet-by-id/${baiVietID}`, function (res) {
//        if (res.success) {
//            const data = res.data;
//            $('#TieuDe').val(data.TieuDe);
//            CKEDITOR.instances.NoiDung.setData(data.NoiDung);
//            $('#LinkThumbnail').val(data.LinkThumbnail);
//            $('#LinkPDF').val(data.LinkPDF);
//        } else {
//            alert('Không tìm thấy bài viết');
//        }
//    });

//    // Upload thumbnail
//    $('#ThumbnailFile').on('change', async function () {
//        const file = this.files[0];
//        if (!file) return;

//        const formData = new FormData();
//        formData.append('file', file);

//        try {
//            const res = await $.ajax({
//                url: `${BASE_URL}/upload-thumbnail`,
//                type: 'POST',
//                data: formData,
//                contentType: false,
//                processData: false
//            });

//            if (res.success) {
//                $('#LinkThumbnail').val(res.link);
//                alert('Upload thumbnail thành công!');
//            } else {
//                alert(res.message || 'Upload thumbnail thất bại');
//            }
//        } catch (err) {
//            alert('Lỗi khi upload thumbnail');
//        }
//    });

//    // Upload PDF
//    $('#PdfFile').on('change', async function () {
//        const file = this.files[0];
//        if (!file) return;

//        const formData = new FormData();
//        formData.append('file', file);

//        try {
//            const res = await $.ajax({
//                url: `${BASE_URL}/upload-pdf`,
//                type: 'POST',
//                data: formData,
//                contentType: false,
//                processData: false
//            });

//            if (res.success) {
//                $('#LinkPDF').val(res.link);
//                alert('Upload PDF thành công!');
//            } else {
//                alert(res.message || 'Upload PDF thất bại');
//            }
//        } catch (err) {
//            alert('Lỗi khi upload PDF');
//        }
//    });

//    // Submit cập nhật
//    $('#formSuaBaiViet').on('submit', async function (e) {
//        e.preventDefault();

//        const updated = {
//            TieuDe: $('#TieuDe').val(),
//            NoiDung: CKEDITOR.instances.NoiDung.getData(),
//            LinkThumbnail: $('#LinkThumbnail').val(),
//            LinkPDF: $('#LinkPDF').val()
//        };

//        try {
//            const res = await $.ajax({
//                url: `${BASE_URL}/update-baiviet/${baiVietID}`,
//                type: 'PUT',
//                data: JSON.stringify(updated),
//                contentType: 'application/json'
//            });

//            if (res.success) {
//                alert('Cập nhật bài viết thành công');
//                window.location.href = '/Admin/InterfaceAdmin/BaiViet';
//            } else {
//                alert(res.message || 'Cập nhật thất bại');
//            }
//        } catch (err) {
//            alert('Lỗi khi cập nhật bài viết');
//        }
//    });
//});

const BASE_URL = `/api/v1/admin`;

$(document).ready(function () {
    const baiVietID = $('#BaiVietID').val(); // hidden input chứa ID bài viết

    // Khởi tạo CKEditor
    if (typeof CKEDITOR !== "undefined") {
        CKEDITOR.replace('NoiDung');
    }

    // Tải dữ liệu bài viết theo ID
    $.get(`${BASE_URL}/get-baiviet-by-id/${baiVietID}`, function (res) {
        if (res.success) {
            const data = res.data;
            $('#TieuDe').val(data.TieuDe || '');
            CKEDITOR.instances.NoiDung.setData(data.NoiDung || '');
            $('#LinkThumbnail').val(data.LinkThumbnail || '');
            $('#LinkPDF').val(data.LinkPDF || '');
        } else {
            alert('Không tìm thấy bài viết hoặc lỗi dữ liệu.');
        }
    });

    // Xử lý upload thumbnail
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
                processData: false
            });

            if (res.success) {
                $('#LinkThumbnail').val(res.link);
                alert('Upload thumbnail thành công!');
            } else {
                alert(res.message || 'Upload thumbnail thất bại');
            }
        } catch (err) {
            console.error(err);
            alert('Lỗi khi upload thumbnail');
        }
    });

    // Xử lý upload PDF
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
                processData: false
            });

            if (res.success) {
                $('#LinkPDF').val(res.link);
                alert('Upload PDF thành công!');
            } else {
                alert(res.message || 'Upload PDF thất bại');
            }
        } catch (err) {
            console.error(err);
            alert('Lỗi khi upload PDF');
        }
    });

    // Gửi yêu cầu cập nhật
    $('#formSuaBaiViet').on('submit', async function (e) {
        e.preventDefault();

        const model = {
            TieuDe: $('#TieuDe').val().trim(),
            NoiDung: CKEDITOR.instances.NoiDung.getData(),
            LinkThumbnail: $('#LinkThumbnail').val().trim(),
            LinkPDF: $('#LinkPDF').val().trim()
        };

        if (!model.TieuDe || !model.NoiDung) {
            alert('Tiêu đề và nội dung là bắt buộc.');
            return;
        }

        try {
            const res = await $.ajax({
                url: `${BASE_URL}/update-baiviet/${baiVietID}`,
                type: 'PUT',
                contentType: 'application/json',
                data: JSON.stringify(model)
            });

            if (res.success) {
                alert('Cập nhật bài viết thành công!');
                window.location.href = '/Admin/InterfaceAdmin/BaiViet';
            } else {
                alert(res.message || 'Không thể cập nhật bài viết');
            }
        } catch (err) {
            console.error(err);
            alert('Đã xảy ra lỗi khi cập nhật.');
        }
    });
});
