const BASE_URL = `/api/v1/admin`;

$(document).ready(async function () {
    await GetAllBaiViet();
    setupBaiVietTableEvents();
    setupModalFormEvents();
});

// -------------------- [ Danh sách bài viết ] --------------------
function setupBaiVietTableEvents() {
    $('#btnThemBaiViet').on('click', function () {
        resetModalForm();
        $('#modalBaiVietLabel').text('Thêm Bài Viết');
        $('#modalBaiViet').modal('show');
    });

    $(document).on('click', '.btn-xem-tieude', function () {
        const tieuDe = decodeURIComponent($(this).data('tieude'));
        $('#tieuDeDayDuContent').text(tieuDe);
        $('#modalTieuDeDayDu').modal('show');
    });

    $(document).on('click', '.btn-sua', async function () {
        const id = $(this).data('id');

        try {
            const res = await $.ajax({
                url: `${BASE_URL}/get-baiviet-by-id/${id}`,
                type: 'GET'
            });

            if (res.success) {
                const b = res.data;

                $('#modalBaiVietLabel').text('Sửa Bài Viết');
                $('#BaiVietID').val(b.ID);
                $('#TieuDe').val(b.TieuDe);
                $('#LinkThumbnail').val(b.LinkThumbnail);
                $('#LinkPDF').val(b.LinkPDF);

                // Khởi tạo lại CKEditor sau khi modal show
                $('#modalBaiViet').off('shown.bs.modal').on('shown.bs.modal', function () {
                    if (CKEDITOR.instances.NoiDung) {
                        CKEDITOR.instances.NoiDung.destroy(true);
                    }

                    CKEDITOR.replace('NoiDung', {
                        extraPlugins: 'justify',
                        allowedContent: true,
                        toolbar: [
                            { name: 'clipboard', items: ['Cut', 'Copy', 'Paste', 'Undo', 'Redo'] },
                            { name: 'styles', items: ['Format', 'Font', 'FontSize'] },
                            { name: 'basicstyles', items: ['Bold', 'Italic', 'Underline', '-', 'RemoveFormat'] },
                            { name: 'paragraph', items: ['JustifyLeft', 'JustifyCenter', 'JustifyRight', 'JustifyBlock', '-', 'NumberedList', 'BulletedList'] },
                            { name: 'links', items: ['Link', 'Unlink'] },
                            { name: 'insert', items: ['Image', 'Table', 'HorizontalRule'] },
                            { name: 'tools', items: ['Maximize'] }
                        ]
                    });

                    CKEDITOR.instances.NoiDung.on('instanceReady', function () {
                        CKEDITOR.instances.NoiDung.setData(b.NoiDung || '');
                    });
                });

                // Ảnh & PDF
                if (b.LinkThumbnail) {
                    $('#previewThumbnail').html(`<img src="${b.LinkThumbnail}" style="max-width: 200px;" />`);
                    $('#btnXoaThumbnail').removeClass('d-none');
                } else {
                    $('#previewThumbnail').html('');
                    $('#btnXoaThumbnail').addClass('d-none');
                }

                $('#previewPDF').html(b.LinkPDF ? `<a href="${b.LinkPDF}" target="_blank">Xem PDF</a>` : '');

                $('#modalBaiViet').modal('show');
            } else {
                Swal.fire({ icon: 'error', title: 'Lỗi', text: res.message || 'Không tải được dữ liệu.' });
            }
        } catch {
            Swal.fire({ icon: 'error', title: 'Lỗi', text: 'Không thể kết nối đến server.' });
        }
    });


    $(document).on('click', '.btn-xoa', async function () {
        const baiVietID = $(this).data('id');
        const result = await Swal.fire({
            title: 'Bạn có chắc chắn muốn xóa bài viết?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Xóa',
            cancelButtonText: 'Hủy'
        });

        if (result.isConfirmed) {
            try {
                const res = await $.ajax({
                    url: `${BASE_URL}/xoa-baiviet/${baiVietID}`,
                    type: 'DELETE'
                });

                if (res.success) {
                    await Swal.fire({ icon: 'success', title: 'Đã xóa thành công!', timer: 2000, showConfirmButton: false });
                    await GetAllBaiViet();
                } else {
                    Swal.fire({ icon: 'error', title: 'Thất bại', text: res.message });
                }
            } catch (err) {
                Swal.fire({ icon: 'error', title: 'Lỗi', text: 'Không thể xóa bài viết.' });
            }
        }
    });
    $(document).on('click', '.btn-xem', function () {
        const id = $(this).data('id');
        const url = `/admin/xem-noi-dung?id=${id}`; // Đúng tên Controller + Action
        window.open(url, '_blank');
    });


}

async function GetAllBaiViet() {
    const res = await $.ajax({ url: `${BASE_URL}/get-all-baiviet`, type: 'GET' });
    const table = $('#table_load_baiviet');

    if ($.fn.DataTable.isDataTable(table)) {
        table.DataTable().clear().destroy();
    }

    if (res.success) {
        let html = '';
        res.data.forEach((item, index) => {
            const isTitleLong = item.TieuDe.length > 10;
            const shortTitle = shortenTitle(item.TieuDe);
            const infoIcon = isTitleLong
                ? `<i class="anticon anticon-info-circle text-primary ml-1 btn-xem-tieude" style="cursor:pointer;" data-tieude="${encodeURIComponent(item.TieuDe)}"></i>`
                : '';

            const linkThumb = item.LinkThumbnail
                ? `<div class="text-center">
                     <img src="${item.LinkThumbnail}" alt="Thumbnail" 
                          class="img-thumbnail thumbnail-click" 
                          data-img="${item.LinkThumbnail}" 
                          style="max-width: 100px; max-height: 70px; cursor: pointer;" />
                   </div>`
                : `<div class="text-danger text-center"></div>`;

            const linkPDF = item.LinkPDF
                ? `<div class="text-center d-flex flex-column align-items-center">
                     <a href="${item.LinkPDF}" target="_blank" class="btn btn-sm btn-primary py-1 px-2 w-100 mt-1" style="max-width: 80px;">
                        <i class="anticon anticon-eye"></i>
                     </a>
                     <button type="button" class="btn btn-sm btn-primary py-1 px-2 w-100 mt-1 btn-tai-pdf" data-link="${item.LinkPDF}" style="max-width: 80px;">
                        <i class="anticon anticon-download"></i>
                     </button>
                   </div>`
                : `<div class="text-danger text-center"></div>`;

            html += `
                <tr>
                    <td class="d-none">${item.ID}</td>
                    <td>${index + 1}</td>
                    <td>
                        ${shortTitle}${infoIcon}
                    </td>
                    <td class="text-center">
                        <button class="btn btn-sm btn-outline-info btn-xem" data-id="${item.ID}">
                            Xem
                        </button>
                    </td>
                    <td>${formatDateFromInt(item.NgayDang)}</td>
                    <td>${formatDateFromInt(item.NgayCapNhat)}</td>
                    <td>${linkThumb}</td>
                    <td>${linkPDF}</td>
                    <td>${item.ViewCount ?? 0}</td>
                    <td>
                        <div class="text-center d-flex flex-column align-items-center">
                            <button class="btn btn-warning btn-sm py-1 px-2 w-100 btn-sua" data-id="${item.ID}" style="max-width: 80px;">Sửa</button>
                            <button class="btn btn-danger btn-sm py-1 px-2 w-100 mt-1 btn-xoa" data-id="${item.ID}" style="max-width: 80px;">Xóa</button>
                        </div>
                    </td>
                </tr>`;
        });

        table.find('tbody').html(html);
        table.DataTable({ order: [] });
    } else {
        table.find('tbody').html(`<tr><td colspan="9">${res.message}</td></tr>`);
    }
}

function shortenTitle(title, maxLength = 10) {
    if (!title) return '';
    return title.length > maxLength ? `${title.substring(0, maxLength)}...` : title;
}

function formatDateFromInt(dateInt) {
    if (!dateInt) return '';
    const str = dateInt.toString();
    return `${str.slice(6, 8)}/${str.slice(4, 6)}/${str.slice(0, 4)}`;
}

// -------------------- [ Modal form logic ] --------------------
function setupModalFormEvents() {
    $('#modalBaiViet').on('shown.bs.modal', function () {
        if (CKEDITOR.instances.NoiDung) {
            CKEDITOR.instances.NoiDung.destroy(true);
        }
        CKEDITOR.replace('NoiDung', {
            extraPlugins: 'justify',
            allowedContent: true,
            toolbar: [
                { name: 'clipboard', items: ['Cut', 'Copy', 'Paste', 'Undo', 'Redo'] },
                { name: 'styles', items: ['Format', 'Font', 'FontSize'] },
                { name: 'basicstyles', items: ['Bold', 'Italic', 'Underline', '-', 'RemoveFormat'] },
                { name: 'paragraph', items: ['JustifyLeft', 'JustifyCenter', 'JustifyRight', 'JustifyBlock', '-', 'NumberedList', 'BulletedList'] },
                { name: 'links', items: ['Link', 'Unlink'] },
                { name: 'insert', items: ['Image', 'Table', 'HorizontalRule'] },
                { name: 'tools', items: ['Maximize'] }
            ]
        });
    });

    $('#form_baiviet').on('submit', async function (e) {
        e.preventDefault();
        const id = $('#BaiVietID').val();
        const isUpdate = !!id;

        const model = {
            TieuDe: $('#TieuDe').val().trim(),
            NoiDung: CKEDITOR.instances.NoiDung?.getData()?.trim() || '',
            LinkThumbnail: $('#LinkThumbnail').val().trim(),
            LinkPDF: $('#LinkPDF').val().trim()
        };

        if (!model.TieuDe || !model.NoiDung) {
            Swal.fire({ icon: 'warning', title: 'Thiếu thông tin', text: 'Tiêu đề và nội dung là bắt buộc.' });
            return;
        }

        try {
            const res = await $.ajax({
                url: isUpdate ? `${BASE_URL}/update-baiviet/${id}` : `${BASE_URL}/them-baiviet`,
                type: isUpdate ? 'PUT' : 'POST',
                contentType: 'application/json',
                data: JSON.stringify(isUpdate ? { ...model, ID: id } : model)
            });

            if (res.success) {
                await Swal.fire({ icon: 'success', title: `${isUpdate ? 'Cập nhật' : 'Thêm'} thành công!`, timer: 2000, showConfirmButton: false });
                $('#modalBaiViet').modal('hide');
                await GetAllBaiViet();
            } else {
                Swal.fire({ icon: 'error', title: 'Thất bại', text: res.message });
            }
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Lỗi', text: 'Không thể gửi dữ liệu bài viết.' });
        }
    });

    $('#btnChonThumbnail').on('click', async function () {
        $('#thuVienAnh').html('<p>Đang tải ảnh...</p>');
        $('#modalThuVienAnh').modal('show');

        try {
            const res = await $.ajax({ url: `${BASE_URL}/thu-vien-anh`, type: 'GET' });
            if (res.success) {
                const images = res.data;
                const html = images.map(link => `
                    <div class="m-2" style="width: 120px;">
                        <img src="${link}" data-link="${link}" class="img-thumbnail img-select" style="cursor:pointer;" />
                    </div>`).join('');
                $('#thuVienAnh').html(html);
            } else {
                $('#thuVienAnh').html('<p class="text-danger">Không thể tải ảnh.</p>');
            }
        } catch {
            $('#thuVienAnh').html('<p class="text-danger">Lỗi khi tải ảnh.</p>');
        }
    });
    $('#ThumbnailFile').on('change', function () {
        const file = this.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function (e) {
            const imageUrl = e.target.result;
            $('#previewThumbnail').html(`<img src="${imageUrl}" style="max-width: 200px;" />`);
            $('#btnXoaThumbnail').removeClass('d-none');
            $('#LinkThumbnail').val(''); // Clear link để không nhầm với ảnh từ thư viện
        };
        reader.readAsDataURL(file);
    });


    $(document).on('click', '.img-select', function () {
        const link = $(this).data('link');
        $('#LinkThumbnail').val(link);
        $('#previewThumbnail').html(`<img src="${link}" style="max-width: 200px;" />`);
        $('#btnXoaThumbnail').removeClass('d-none');
        $('#modalThuVienAnh').modal('hide');
    });

    $(document).on('click', '.thumbnail-click', function () {
        const imageUrl = $(this).data('img');
        Swal.fire({
            title: 'Xem hình',
            html: `<img src="${imageUrl}" style="max-width: 100%; max-height: 500px;" />`,
            showCloseButton: true,
            showConfirmButton: false,
            width: 'auto',
            background: '#fff'
        });
    });

    $(document).on('click', '.btn-tai-pdf', function () {
        const pdfLink = $(this).data('link');
        Swal.fire({
            title: 'Bạn có chắc chắn muốn tải xuống không?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Tải',
            cancelButtonText: 'Hủy'
        }).then((result) => {
            if (result.isConfirmed) {
                const link = document.createElement('a');
                link.href = pdfLink;
                link.download = '';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        });
    });

    $('#btnXoaThumbnail').on('click', async function () {
        const confirm = await Swal.fire({
            title: 'Bạn có chắc chắn muốn hủy upload ảnh không?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Có',
            cancelButtonText: 'Không'
        });

        if (confirm.isConfirmed) {
            $('#LinkThumbnail').val('');
            $('#ThumbnailFile').val('');
            $('#previewThumbnail').html('');
            $(this).addClass('d-none');
        }
    });

}

function resetModalForm() {
    const form = $('#form_baiviet')[0];
    if (form) form.reset();

    $('#BaiVietID').val('');
    $('#LinkThumbnail').val('');
    $('#LinkPDF').val('');
    $('#previewThumbnail').html('');
    $('#previewPDF').html('');
    $('#btnXoaThumbnail').addClass('d-none');
}
