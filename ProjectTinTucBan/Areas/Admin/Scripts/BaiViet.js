const BASE_URL = `/api/v1/admin`;

$(document).ready(async function () {
    loadMucLucOptions();
    await GetAllBaiViet();
    setupBaiVietTableEvents();
    setupModalFormEvents();
});
// Sự kiện copy tiêu đề - đặt ngoài
$(document).on('click', '#btnCopyTieuDe', function () {
    const text = $('#tieuDeDayDuContent').text().trim();
    if (!text) return;

    navigator.clipboard.writeText(text).then(() => {
        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'Đã sao chép tiêu đề!',
            showConfirmButton: false,
            timer: 1000,
            timerProgressBar: true,
            customClass: {
                popup: 'swal2-toast'
            }
        });

        //Tự động đóng modal sau 2 giây
        setTimeout(() => {
            $('#modalTieuDeDayDu').modal('hide');
        }, 2000);

    }).catch(() => {
        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'error',
            title: 'Không thể sao chép!',
            showConfirmButton: false,
            timer: 1000,
            timerProgressBar: true,
            customClass: {
                popup: 'swal2-toast'
            }
        });
    });
});

// Load all mục lục for dropdown selection
function loadMucLucOptions() {
    $.ajax({
        url: '/api/v1/admin/get-all-mucluc',
        type: 'GET',
        dataType: 'json',
        success: function (response) {
            if (response.success) {
                var options = '<option value="">-- Chọn mục lục --</option>';
                $.each(response.data, function (i, item) {
                    options += '<option value="' + item.ID + '">' + item.TenMucLuc + '</option>';
                });
                $('#ID_MucLuc').html(options);
            } else {
                toastr.error('Không thể tải danh sách mục lục');
            }
        },
        error: function () {
            toastr.error('Lỗi kết nối server');
        }
    });
}

// -------------------- [ Danh sách bài viết ] --------------------
function setupBaiVietTableEvents() {
    $('#btnThemBaiViet').on('click', function () {
        resetModalForm();
        $('#modalBaiVietLabel').text('Thêm Bài Viết');

        // Sau khi modal mở, khởi tạo lại CKEditor với nội dung trống
        $('#modalBaiViet').off('shown.bs.modal').on('shown.bs.modal', function () {
            $(this).attr('aria-hidden', 'false');

            if (CKEDITOR.instances.NoiDung) {
                CKEDITOR.instances.NoiDung.destroy(true);
            }
            // Hủy CKEditor cũ nếu tồn tại
            CKEDITOR.replace('NoiDung', {
                extraPlugins: 'justify',
                allowedContent: true,
                height: '500px',
                resize_enabled: false,
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
            // Khi CKEditor sẵn sàng
            CKEDITOR.instances.NoiDung.on('instanceReady', function () {
                const editor = CKEDITOR.instances.NoiDung;
                editor.setData('', function () {
                    // Sau khi set xong, resize ngay
                    setTimeout(() => {
                        const body = editor.document?.$?.body;
                        if (body) {
                            const scrollHeight = body.scrollHeight;
                            const newHeight = Math.min(scrollHeight + 100, 1000);
                            editor.resize('100%', newHeight);
                        }
                    }, 100);
                });

                // Gắn auto resize khi người dùng nhập thêm nội dung
                autoResizeCKEditor(editor);
            });
        });
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
                const noiDung = b.NoiDung || '';
                $('#modalBaiVietLabel').text('Sửa Bài Viết');
                $('#BaiVietID').val(b.ID);
                $('#TieuDe').val(b.TieuDe);
                $('#LinkThumbnail').val(b.LinkThumbnail);
                $('#LinkPDF').val(b.LinkPDF);
                if (b.ID_MucLuc) {
                    $('#ID_MucLuc').val(b.ID_MucLuc);
                } else {
                    $('#ID_MucLuc').val('');
                }

                // Khởi tạo lại CKEditor sau khi modal show
                $('#modalBaiViet').off('shown.bs.modal').on('shown.bs.modal', function () {
                    setTimeout(() => {
                        if (CKEDITOR.instances.NoiDung) {
                            CKEDITOR.instances.NoiDung.destroy(true);
                        }

                        CKEDITOR.replace('NoiDung', {
                            extraPlugins: 'justify',
                            allowedContent: true,
                            height: '500px',
                            resize_enabled: false,
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
                            CKEDITOR.instances.NoiDung.setData(noiDung);
                            autoResizeCKEditor(CKEDITOR.instances.NoiDung);
                        });
                    }, 200); // Chờ modal render xong
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

// Update GetAllBaiViet to properly display MucLuc
async function GetAllBaiViet() {
    const res = await $.ajax({ url: `${BASE_URL}/get-all-baiviet`, type: 'GET' });
    const table = $('#table_load_baiviet');

    if ($.fn.DataTable.isDataTable(table)) {
        table.DataTable().clear().destroy();
    }

    if (res.success) {
        // Debug the API response to see MucLuc data structure
        console.log('API Response Data:', res.data);

        let html = '';
        res.data.forEach((item, index) => {
            const isTitleLong = item.TieuDe.length > 10;
            const displayTitle = isTitleLong
                ? `<span class="btn-xem-tieude"
                          title="${item.TieuDe}"
                          data-tieude="${encodeURIComponent(item.TieuDe)}"
                          style="cursor: pointer; color: black; text-decoration: none;">
                          ${shortenTitle(item.TieuDe)}
                   </span>`
                : item.TieuDe;

            // Improved MucLuc handling
            let mucLucInfo = 'Chưa phân loại';
            if (item.MucLuc && item.MucLuc.TenMucLuc) {
                mucLucInfo = item.MucLuc.TenMucLuc;
            }

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
                        ${displayTitle}
                    </td>
                    <td class="text-center">
                        <button class="btn btn-sm btn-outline-info btn-xem" data-id="${item.ID}">
                            Xem
                        </button>
                    </td>
                    <td class="text-center">${mucLucInfo}</td>
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
        table.DataTable({
            order: [], // No default ordering
            columnDefs: [{ targets: 0, visible: false }] // Hide ID column
        });
    } else {
        table.find('tbody').html(`<tr><td colspan="11">${res.message}</td></tr>`);
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
function autoResizeCKEditor(editorInstance) {
    if (!editorInstance) return;
    editorInstance.on('change', function () {
        setTimeout(() => {
            const body = editorInstance.document?.$?.body;
            if (body) {
                const scrollHeight = body.scrollHeight;
                const newHeight = Math.min(scrollHeight + 100, 1000);
                editorInstance.resize('100%', newHeight);
            }
        }, 100); // Delay để đảm bảo nội dung dán vào đã hiển thị
    });
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
            removePlugins: 'exportpdf',
            resize_enabled: false,
            height: '500px',
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
            const editor = CKEDITOR.instances.NoiDung;
            // Tự động resize
            autoResizeCKEditor(editor);

            //Gói ảnh vào <p style="text-align:center"> + thêm dòng trống sau ảnh
            editor.on('paste', function (evt) {
                const data = evt.data;
                if (data && data.dataValue && data.dataValue.includes('<img')) {
                    data.dataValue = data.dataValue.replace(/<img[^>]*>/g, function (match) {
                        return `<p style="text-align: center;">${match}</p><p><br></p>`;
                    });
                }
            });
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
            LinkPDF: $('#LinkPDF').val().trim(),
            ID_MucLuc: $('#ID_MucLuc').val() || null 

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
    $('#ID_MucLuc').val(''); 
    $('#previewThumbnail').html('');
    $('#previewPDF').html('');
    $('#btnXoaThumbnail').addClass('d-none');
    if (CKEDITOR.instances.NoiDung) {
        CKEDITOR.instances.NoiDung.destroy(true);
    }
}