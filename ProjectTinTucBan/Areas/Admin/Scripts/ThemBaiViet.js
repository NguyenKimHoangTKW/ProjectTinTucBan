const BASE_URL = `/api/v1/admin`;

$(document).ready(function () {
    // Khởi tạo CKEditor (chỉ cần chạy một lần sau khi DOM load)
    if (typeof CKEDITOR !== "undefined") {
        CKEDITOR.replace('NoiDung');
    }

    // Gắn sự kiện submit form
    $('#form_them_baiviet').on('submit', async function (e) {
        e.preventDefault();

        const tieuDe = $('#TieuDe').val().trim();
        const noiDung = CKEDITOR.instances.NoiDung.getData();
        const linkThumbnail = $('#LinkThumbnail').val().trim();
        const linkPDF = $('#LinkPDF').val().trim();

        if (!tieuDe || !noiDung) {
            alert('Tiêu đề và nội dung là bắt buộc.');
            return;
        }

        const model = {
            TieuDe: tieuDe,
            NoiDung: noiDung,
            LinkThumbnail: linkThumbnail,
            LinkPDF: linkPDF
        };

        try {
            const res = await $.ajax({
                url: `${BASE_URL}/them-baiviet`,
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify(model)
            });

            if (res.success) {
                alert('Thêm bài viết thành công!');
                $('#form_them_baiviet')[0].reset();
                CKEDITOR.instances.NoiDung.setData('');
            } else {
                alert('Lỗi: ' + (res.message || 'Không thể thêm bài viết'));
            }
        } catch (err) {
            console.error(err);
            alert('Đã xảy ra lỗi khi gửi yêu cầu.');
        }
    });
});

// Hàm upload file và trả về đường dẫn lưu trên server
//async function uploadFile(file, endpoint) {
//    const formData = new FormData();
//    formData.append('file', file);

//    const res = await $.ajax({
//        url: `${BASE_URL}/${endpoint}`,
//        type: 'POST',
//        data: formData,
//        contentType: false,
//        processData: false
//    });

//    if (res.success) {
//        return res.url; // Giả sử server trả về { success: true, url: 'link lưu file' }
//    } else {
//        throw new Error(res.message || 'Upload thất bại');
//    }
//}

//$('#form_them_baiviet').on('submit', async function (e) {
//    e.preventDefault();

//    const tieuDe = $('#TieuDe').val().trim();
//    const noiDung = CKEDITOR.instances.NoiDung.getData();
//    const thumbnailFile = $('#ThumbnailFile')[0].files[0];
//    const pdfFile = $('#PdfFile')[0].files[0];

//    if (!tieuDe || !noiDung) {
//        alert('Tiêu đề và nội dung là bắt buộc.');
//        return;
//    }

//    let linkThumbnail = '';
//    let linkPDF = '';

//    try {
//        if (thumbnailFile) {
//            linkThumbnail = await uploadFile(thumbnailFile, 'upload-thumbnail');
//        }

//        if (pdfFile) {
//            linkPDF = await uploadFile(pdfFile, 'upload-pdf');
//        }

//        const model = {
//            TieuDe: tieuDe,
//            NoiDung: noiDung,
//            LinkThumbnail: linkThumbnail,
//            LinkPDF: linkPDF
//        };

//        const res = await $.ajax({
//            url: `${BASE_URL}/them-baiviet`,
//            type: 'POST',
//            contentType: 'application/json',
//            data: JSON.stringify(model)
//        });

//        if (res.success) {
//            alert('Thêm bài viết thành công!');
//            $('#form_them_baiviet')[0].reset();
//            CKEDITOR.instances.NoiDung.setData('');
//        } else {
//            alert('Lỗi: ' + (res.message || 'Không thể thêm bài viết'));
//        }

//    } catch (err) {
//        console.error(err);
//        alert('Đã xảy ra lỗi khi upload hoặc gửi yêu cầu.');
//    }
//});
