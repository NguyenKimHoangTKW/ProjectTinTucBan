const BASE_URL = `/api/v1/admin`;
$(document).ready(async function () {
    loadMucLucOptions();
    await restoreSessionStorageFromServer(); // đợi session đồng bộ xong
    await GetAllBaiViet();
    setupBaiVietTableEvents();
    setupModalFormEvents();
});
let allBaiViet = [];        // Toàn bộ bài viết
let filteredBaiViet = [];
let pageSize = 6;          // Bao nhiêu bài mỗi trang
let currentPage = 1;        // Trang hiện tại
let uploadedPDFs = [];
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

/* Tìm kiếm bài viết theo từ khóa */
$('#searchKeyword').on('keyup', function () {
    const keyword = $(this).val().toLowerCase().trim();

    if (keyword === '') {
        filteredBaiViet = allBaiViet;
    } else {
        filteredBaiViet = allBaiViet.filter(item =>
            item.TieuDe?.toLowerCase().includes(keyword) ||
            item.NoiDung?.toLowerCase().includes(keyword) ||
            item.MucLuc?.TenMucLuc?.toLowerCase().includes(keyword)
        );
    }

    currentPage = 1;
    renderPage(currentPage);
    setupPagination();
});
/* Xử lý sự kiện chọn phân trang */
$(document).on('click', '#pagination .page-link', function (e) {
    e.preventDefault();
    const page = parseInt($(this).data('page'));
    const totalPages = Math.ceil(filteredBaiViet.length / pageSize);

    if (isNaN(page) || page < 1 || page > totalPages) return;

    currentPage = page;
    renderPage(currentPage);
    setupPagination();
});
/* Xử lý sự kiện xem danh sách pdf */
$(document).on('click', '.btn-xem-danh-sach-pdf', function () {
    const rawLinks = $(this).data('links');
    if (!rawLinks) return;

    const links = rawLinks.split(';').filter(link => link.trim() !== '');
    if (links.length === 0) return;
    // Lưu trữ để tải sau này
    let html = links.map((link, index) => {
        const parts = link.split('|');
        const fileUrl = parts[0].trim(); // đường dẫn file lưu trữ
        const serverFileName = decodeURIComponent(fileUrl.split('/').pop()); // upload_abc.pdf
        let originalName = decodeURIComponent(parts[1] || serverFileName);  // fallback nếu thiếu
        originalName = originalName.replace(/\.pdf$/i, '');

        // Tạo URL download qua API, truyền đúng 2 tham số
        const downloadUrl = `${BASE_URL}/download-pdf?fileName=${encodeURIComponent(serverFileName)}&originalName=${encodeURIComponent(originalName)}`;

        return `
        <div class="d-flex justify-content-between align-items-center border p-2 mb-1">
            <a href="${fileUrl}" target="_blank" class="text-primary" style="flex-grow:1; text-decoration:underline;">
                ${originalName}
            </a>
            <a class="btn btn-sm btn-outline-success" href="${downloadUrl}">
                <i class="anticon anticon-download"></i>
            </a>
        </div>
    `;
    }).join('');

    html += `
        <div class="text-center mt-3">
            <button class="btn btn-success btn-tai-tat-ca-pdf" data-links="${rawLinks}">
                <i class="anticon anticon-download"></i> Tải tất cả
            </button>
        </div>
    `;

    Swal.fire({
        title: 'Danh sách PDF',
        html,
        width: '600px',
        showCloseButton: true,
        showConfirmButton: false
    });
});
// Xử lý tải từng file từ danh sách PDF
$(document).on('click', '.btn-tai-pdf-tu-list', function (e) {
    e.preventDefault();
    const fileName = $(this).data('server');
    const originalName = $(this).data('original');

    const downloadUrl = `/api/v1/admin/download-pdf?fileName=${fileName}&originalName=${originalName}`;
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = '';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
});
// Xử lý tải tất cả file PDF
$(document).on('click', '.btn-tai-tat-ca-pdf', function () {
    const links = $(this).data('links')?.split(';') || [];

    links.forEach(linkEntry => {
        const parts = linkEntry.split('|');
        const serverFile = parts[0].split('/').pop();
        const originalName = parts[1] || serverFile;

        const encodedServerFile = encodeURIComponent(serverFile);
        const encodedOriginalName = encodeURIComponent(originalName);

        const downloadUrl = `/api/v1/admin/download-pdf?fileName=${encodedServerFile}&originalName=${encodedOriginalName}`;

        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = '';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    });
});
function shortenTitle(title, maxLength = 10) {
    if (!title) return '';
    return title.length > maxLength ? `${title.substring(0, maxLength)}...` : title;
}
function formatDateFromInt(unixTimestamp) {
    if (!unixTimestamp) return "N/A";

    const date = new Date(unixTimestamp * 1000);
    const weekdays = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    const dayOfWeek = weekdays[date.getDay()];
    const day = ("0" + date.getDate()).slice(-2);
    const month = ("0" + (date.getMonth() + 1)).slice(-2);
    const year = date.getFullYear();
    const hours = ("0" + date.getHours()).slice(-2);
    const minutes = ("0" + date.getMinutes()).slice(-2);
    const seconds = ("0" + date.getSeconds()).slice(-2);

    return `${dayOfWeek}, ${day}-${month}-${year}, ${hours}:${minutes}:${seconds}`;
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

// --- Thêm 2 hàm xử lý hình ảnh ---
function insertImage(editor, src, width, height, showToast) {
    // Luôn đảm bảo width <= 600, height <= 400
    width = Math.min(width, 600);
    height = Math.min(height, 400);

    // Tạo đoạn trống trước ảnh để tránh ảnh chèn sát chữ đầu
    const before = editor.document.createElement('p');
    before.setHtml('&nbsp;');
    editor.insertElement(before);

    // Tạo ảnh
    const img = editor.document.createElement('img');
    img.setAttribute('src', src);
    img.setAttribute('width', width);
    img.setAttribute('height', height);
    img.setStyle('display', 'block');
    img.setStyle('margin', '10px auto');
    img.setStyle('max-width', '600px');
    img.setStyle('max-height', '400px');

    // Bọc img trong div
    const wrapper = editor.document.createElement('div');
    wrapper.setAttribute('class', 'cke-custom-image-wrapper');
    wrapper.append(img);

    // Dùng insertHtml để đảm bảo trình tự nội dung
    editor.insertHtml(wrapper.getOuterHtml());

    // Thêm đoạn trống sau ảnh để ngắt nội dung tiếp theo
    const after = editor.document.createElement('p');
    after.setHtml('&nbsp;');
    editor.insertElement(after);

    if (showToast) {
        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: `Ảnh đã resize về ${width}x${height}`,
            showConfirmButton: false,
            timer: 2000,
            timerProgressBar: true
        });
    }
}
function handlePasteOrDrop(evt, editor) {
    const items = (evt.clipboardData || evt.dataTransfer)?.items;
    if (!items) return;

    let handled = false;

    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf('image') !== -1) {
            handled = true; // Đánh dấu đã xử lý ảnh
            const file = item.getAsFile();

            const reader = new FileReader();
            reader.onload = function (e) {
                const img = new Image();

                img.onload = function () {
                    const originalWidth = img.width;
                    const originalHeight = img.height;

                    const maxWidth = 600;
                    const maxHeight = 400;

                    let newWidth = originalWidth;
                    let newHeight = originalHeight;

                    // Resize nếu vượt quá kích thước
                    if (originalWidth > maxWidth || originalHeight > maxHeight) {
                        const ratio = Math.min(maxWidth / originalWidth, maxHeight / originalHeight);
                        newWidth = Math.round(originalWidth * ratio);
                        newHeight = Math.round(originalHeight * ratio);

                        const canvas = document.createElement('canvas');
                        canvas.width = newWidth;
                        canvas.height = newHeight;

                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, newWidth, newHeight);

                        const resizedDataUrl = canvas.toDataURL(file.type);

                        insertImage(editor, resizedDataUrl, newWidth, newHeight, true);
                    } else {
                        insertImage(editor, e.target.result, newWidth, newHeight, false);
                    }
                };

                img.src = e.target.result;
            };

            reader.readAsDataURL(file);
        }
    }

    // Nếu đã xử lý ảnh thì chặn chèn ảnh gốc
    if (handled) {
        if (evt.preventDefault) evt.preventDefault();
        if (evt.stopPropagation) evt.stopPropagation();
        return false;
    }
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
            height: '400px',
            toolbar: [
                { name: 'clipboard', items: ['Cut', 'Copy', 'Paste', 'Undo', 'Redo'] },
                { name: 'styles', items: ['Format', 'Font', 'FontSize'] },
                { name: 'basicstyles', items: ['Bold', 'Italic', 'Underline', '-', 'RemoveFormat'] },
                { name: 'paragraph', items: ['JustifyLeft', 'JustifyCenter', 'JustifyRight', 'JustifyBlock', '-', 'NumberedList', 'BulletedList'] },
                { name: 'insert', items: ['Image', 'Table', 'HorizontalRule'] },
                { name: 'tools', items: ['Maximize'] }
            ]
        });
        CKEDITOR.instances.NoiDung.on('instanceReady', function () {
            const editor = CKEDITOR.instances.NoiDung;

            editor.setData('', function () {
                // Đảm bảo resize ngay sau khi setData xong
                setTimeout(() => {
                    const body = editor.document?.$?.body;
                    if (body) {
                        const scrollHeight = body.scrollHeight || 400; // nếu chưa có nội dung
                        const newHeight = Math.min(scrollHeight + 100, 600); // giới hạn tối đa
                        editor.resize('100%', newHeight);
                    }
                }, 100);
            });

            // Auto resize khi gõ thêm nội dung
            autoResizeCKEditor(editor); // bạn đã có hàm này rồi

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
        $('#savingSpinner').removeClass('d-none');
        const id = $('#BaiVietID').val();
        const isUpdate = !!id;

        const ID_MUCLUC_KHAC = 7;

        let selectedMucLuc = $('#ID_MucLuc').val();
        if (isNaN(selectedMucLuc)) {
            selectedMucLuc = ID_MUCLUC_KHAC;
        }

        const model = {
            TieuDe: $('#TieuDe').val().trim(),
            NoiDung: CKEDITOR.instances.NoiDung?.getData()?.trim() || '',
            LinkThumbnail: $('#LinkThumbnail').val().trim(),
            LinkPDF: uploadedPDFs.map(p => p.url).join(';'), // hoặc JSON.stringify nếu cần gửi mảng
            ID_MucLuc: selectedMucLuc,
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
        } finally {
            $('#savingSpinner').addClass('d-none'); // 👉 Luôn ẩn spinner sau khi xử lý xong
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

    $('#PdfFile').off('change').on('change', async function () {
        const input = this;
        const files = Array.from(input.files);

        if (!files.length) return;

        for (const file of files) {
            if (file.type !== 'application/pdf') {
                Swal.fire('Cảnh báo', `${file.name} không phải file PDF.`, 'warning');
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
                    processData: false
                });

                if (res.success && res.link) {
                    const id = Date.now() + Math.floor(Math.random() * 1000);

                    // Tránh trùng link (do upload lại trùng tên)
                    const isDuplicate = uploadedPDFs.some(x => x.url === res.link);
                    if (isDuplicate) continue;

                    uploadedPDFs.push({
                        id,
                        file,
                        url: res.link,
                        originalName: file.name
                    });

                    const html = `
                    <div class="pdf-preview-box border rounded px-2 py-1 d-flex justify-content-between align-items-center" data-id="${id}" style="gap: 10px">
                        <a href="${res.link}" target="_blank" title="${file.name}">${file.name}</a>
                        <button type="button" class="btn btn-sm btn-danger btn-xoa-pdf" title="Xóa">&times;</button>
                    </div>`;
                    $('#previewPDF').append(html);
                } else {
                    Swal.fire('Lỗi', `Upload ${file.name} thất bại.`, 'error');
                }
            } catch (err) {
                console.error(err);
                Swal.fire('Lỗi', `Lỗi khi upload ${file.name}.`, 'error');
            }
        }

        // Reset sau khi xử lý toàn bộ file
        setTimeout(() => {
            $(input).val('');
        }, 500);
    });

    uploadedPDFs = uploadedPDFs.LinkPDF?.split(';').map(pdfStr => {
        const [url, name] = pdfStr.split('|');
        return {
            id: crypto.randomUUID(),      //mỗi file phải có id duy nhất
            url,
            originalName: name || 'File.pdf',
            file: null                    // file gốc không cần khi sửa
        };
    }) || [];

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
    $(document).on('click', '.img-select', function () {
        const link = $(this).data('link');
        $('#LinkThumbnail').val(link);
        $('#previewThumbnail').html(`<img src="${link}" style="max-width: 200px;" />`);
        $('#btnXoaThumbnail').removeClass('d-none');
        $('#modalThuVienAnh').modal('hide');
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
    uploadedPDFs = [];
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
function restoreSessionStorageFromServer() {
    return new Promise((resolve) => {
        $.ajax({
            url: '/api/v1/admin/current-user',
            type: 'GET',
            dataType: 'json',
            success: function (res) {
                if (res.success && res.isLoggedIn && res.user) {
                    sessionStorage.setItem('loginInfo', JSON.stringify({
                        userId: res.user.id,
                        name: res.user.name,
                        email: res.user.email,
                        role: res.user.role
                    }));
                } else {
                }
                resolve(); // luôn resolve để tiếp tục
            },
            error: function () {
                resolve(); // vẫn resolve để không làm treo flow
            }
        });
    });
}
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
                    const safeMucLuc = escapeHtml(item.TenMucLuc);
                    options += '<option value="' + item.ID + '">' + safeMucLuc + '</option>';
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
        const linkPDFString = uploadedPDFs
            .map(pdf => `${pdf.url}|${pdf.originalName}`)
            .join(';');
        $('#LinkPDF').val(linkPDFString);
        uploadedPDFs = [];
        $('#previewPDF').empty();
        $('#PdfFile').val('');

        $('#modalBaiVietLabel').text('Thêm Bài Viết');

        // Sau khi modal mở, khởi tạo lại CKEditor với nội dung trống
        $('#modalBaiViet').off('shown.bs.modal').on('shown.bs.modal', function () {
            setTimeout(() => {
                if (CKEDITOR.instances.NoiDung) {
                    CKEDITOR.instances.NoiDung.destroy(true);
                }

                CKEDITOR.replace('NoiDung', {
                    extraPlugins: 'justify',
                    removePlugins: 'exportpdf',
                    allowedContent: true,
                    resize_enabled: false,
                    height: '400px', // hoặc bỏ đi để resize động bên dưới
                    toolbar: [
                        { name: 'clipboard', items: ['Cut', 'Copy', 'Paste', 'Undo', 'Redo'] },
                        { name: 'styles', items: ['Format', 'Font', 'FontSize'] },
                        { name: 'basicstyles', items: ['Bold', 'Italic', 'Underline', '-', 'RemoveFormat'] },
                        { name: 'paragraph', items: ['JustifyLeft', 'JustifyCenter', 'JustifyRight', 'JustifyBlock', '-', 'NumberedList', 'BulletedList'] },
                        { name: 'insert', items: ['Image', 'Table', 'HorizontalRule'] },
                        { name: 'tools', items: ['Maximize'] }
                    ]
                });

                CKEDITOR.instances.NoiDung.on('instanceReady', function () {
                    const editor = CKEDITOR.instances.NoiDung;
                    editor.setData('', function () {
                        setTimeout(() => {
                            const body = editor.document?.$?.body;
                            if (body) {
                                const scrollHeight = body.scrollHeight;
                                const newHeight = Math.min(scrollHeight + 100, 1000);
                                editor.resize('100%', newHeight);
                            }
                        }, 100);
                    });

                    autoResizeCKEditor(editor); // nếu có hàm auto resize riêng
                });

            }, 200); // 👉 delay nhỏ để modal hiển thị xong
        });
        $('#modalBaiViet').modal('show');
    });

    $(document).on('click', '.btn-xem-tieude', function () {
        const tieuDe = decodeURIComponent($(this).data('tieude'));
        $('#tieuDeDayDuContent').text(tieuDe);
        $('#modalTieuDeDayDu').modal('show');
    });

    $(document).on('click', '.btn-sua', async function () {
        uploadedPDFs = [];                  // ✅ reset mảng
        $('#previewPDF').empty();          // ✅ reset giao diện preview
        $('#PdfFile').val('');             // ✅ reset input file
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
                            removePlugins: 'exportpdf',
                            allowedContent: true,
                            height: '400px',
                            resize_enabled: false,
                            toolbar: [
                                { name: 'clipboard', items: ['Cut', 'Copy', 'Paste', 'Undo', 'Redo'] },
                                { name: 'styles', items: ['Format', 'Font', 'FontSize'] },
                                { name: 'basicstyles', items: ['Bold', 'Italic', 'Underline', '-', 'RemoveFormat'] },
                                { name: 'paragraph', items: ['JustifyLeft', 'JustifyCenter', 'JustifyRight', 'JustifyBlock', '-', 'NumberedList', 'BulletedList'] },
                                { name: 'insert', items: ['Image', 'Table', 'HorizontalRule'] },
                                { name: 'tools', items: ['Maximize'] }
                            ]
                        });

                        CKEDITOR.instances.NoiDung.on('instanceReady', function () {
                            const editor = CKEDITOR.instances.NoiDung;
                            editor.setData(noiDung, function () {
                                // Resize ban đầu
                                setTimeout(() => {
                                    const body = editor.document?.$?.body;
                                    if (body) {
                                        const scrollHeight = body.scrollHeight;
                                        const newHeight = Math.min(scrollHeight + 100, 1000);
                                        editor.resize('100%', newHeight);
                                    }
                                }, 100);
                            });

                            autoResizeCKEditor(editor);

                            // Chặn ảnh gốc nếu dán ảnh duy nhất
                            editor.on('paste', function (evt) {
                                const data = evt.data;
                                const transfer = data?.dataTransfer?._ || data?.dataTransfer?.$;
                                if (transfer?.files?.length > 0) {
                                    let hasImage = false;
                                    for (const f of transfer.files) {
                                        if (f.type.startsWith('image/')) {
                                            hasImage = true;
                                        }
                                    }
                                    if (hasImage && transfer.files.length === 1) {
                                        evt.cancel(); // Chỉ cancel nếu là ảnh duy nhất
                                    }
                                }
                            });

                            // Xử lý ảnh paste hoặc drag-drop (resize)
                            editor.document.on('paste', function (e) {
                                handlePasteOrDrop(e.data.$, editor);
                            });
                            editor.document.on('drop', function (e) {
                                handlePasteOrDrop(e.data.$, editor);
                            });
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

                uploadedPDFs = [];
                $('#previewPDF').empty();

                if (b.LinkPDF) {
                    const links = b.LinkPDF.includes(';') ? b.LinkPDF.split(';') : [b.LinkPDF];

                    links.forEach(linkStr => {
                        const [url, originalName] = linkStr.split('|');
                        const id = crypto.randomUUID(); /* đảm bảo không trùng lặp bằng một biến tăng dần */

                        uploadedPDFs.push({
                            id,
                            file: null,
                            url,
                            originalName: originalName || decodeURIComponent(url.split('/').pop()) // fallback nếu thiếu
                        });

                        const pdfHTML = `
                            <div class="pdf-preview-box" data-id="${id}">
                                <a href="${url}" target="_blank">${originalName || 'Xem PDF'}</a>
                                <button type="button" class="btn-xoa-pdf" title="Xóa">&times;</button>
                            </div>`;
                        $('#previewPDF').append(pdfHTML);
                    });
                }



                $('#modalBaiViet').modal('show');
            } else {
                Swal.fire({ icon: 'error', title: 'Lỗi', text: res.message || 'Không tải được dữ liệu.' });
            }
        } catch {
            Swal.fire({ icon: 'error', title: 'Lỗi', text: 'Không thể kết nối đến server.' });
        }
    });

    $(document).on('click', '.btn-xoa-pdf', function () {
        const box = $(this).closest('.pdf-preview-box');
        const id = box.data('id');
        // Xóa khỏi mảng
        uploadedPDFs = uploadedPDFs.filter(f => f.id !== id);
        // Xóa khỏi giao diện
        box.remove();
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
                if (err.status === 403) {
                    Swal.fire({ icon: 'error', title: 'Từ chối', text: err.responseJSON?.message || 'Bạn không có quyền xóa bài viết này!' });
                } else {
                    Swal.fire({ icon: 'error', title: 'Lỗi', text: 'Không thể xóa bài viết.' });
                }
            }

        }
    });

    $(document).on('click', '.btn-xem', function () {
        const id = $(this).data('id');
        const url = `/admin/xem-noi-dung?id=${id}`; // Đúng tên Controller + Action
        window.open(url, '_blank');
    });
    $(document).on('click', '#btnLuuBaiViet', async function () {

        const tieuDe = $('#TieuDe').val().trim();
        const noiDung = CKEDITOR.instances.NoiDung.getData().trim();
        const idNguoiDang = sessionStorage.getItem('loginInfo') ? JSON.parse(sessionStorage.getItem('loginInfo')).id : null;

        if (!tieuDe || !noiDung || !idNguoiDang) {
            $('#savingSpinner').addClass('d-none');
            Swal.fire('Thiếu thông tin', 'Vui lòng nhập đầy đủ tiêu đề và nội dung.', 'warning');
            return;
        }
        // ✅ Gán chuỗi LinkPDF từ uploadedPDFs
        const linkPDFString = uploadedPDFs
            .map(pdf => `${pdf.url}|${pdf.originalName}`)
            .join(';');
        $('#LinkPDF').val(linkPDFString);

        try {
            const res = await $.ajax({
                url: `${BASE_URL}/them-baiviet`,
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({
                    TieuDe: tieuDe,
                    NoiDung: noiDung,
                    ID_NguoiDang: idNguoiDang
                })
            });

            if (res.success) {
                await Swal.fire({
                    icon: 'success',
                    title: 'Đã lưu bài viết!',
                    timer: 2000,
                    showConfirmButton: false
                });
                $('#modalBaiViet').modal('hide');
                await GetAllBaiViet();
            } else {
                Swal.fire({ icon: 'error', title: 'Lỗi', text: res.message });
            }
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Lỗi', text: 'Không thể lưu bài viết.' });
        }
    });
}
/* Lấy hết bài viết ra */
async function GetAllBaiViet() {
    // Ẩn bảng và phân trang
    $('#tableWrapper').hide();
    $('#paginationWrapper').hide();

    // Hiện loader
    showLoading('#loaderWrapper', 'Đang tải danh sách bài viết...');

    try {
        const res = await $.ajax({
            url: `${BASE_URL}/get-all-baiviet`,
            type: 'GET'
        });

        if (res.success) {
            allBaiViet = res.data;
            filteredBaiViet = allBaiViet;

            renderPage(1);
            setupPagination();

            // Hiện bảng và phân trang, ẩn loader
            $('#tableWrapper').show();
            $('#paginationWrapper').show();
            $('#loaderWrapper').empty(); // ✅ clear hẳn nội dung loader
        } else {
            $('#loaderWrapper').html(`<p class="text-danger text-center">${res.message}</p>`);
        }
    } catch (error) {
        $('#loaderWrapper').html(`<p class="text-danger text-center">Đã xảy ra lỗi khi tải dữ liệu.</p>`);
    }
}
function renderPage(page) {
    const tableBody = $('#table_load_baiviet tbody');
    let html = '';
    const currentUser = JSON.parse(sessionStorage.getItem('loginInfo') || '{}');
    const isAdmin = currentUser.role === 1;

    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const pageItems = filteredBaiViet.slice(start, end);

    pageItems.forEach((item, index) => {
        const isTitleLong = item.TieuDe.length > 10;
        const safeFullTitle = escapeHtml(item.TieuDe);
        const shortened = shortenTitle(item.TieuDe);
        const displayTitle = isTitleLong
            ? `<span class="btn-xem-tieude" title="${safeFullTitle}" data-tieude="${safeFullTitle}" style="cursor: pointer; color: black;">
                   ${escapeHtml(shortened)}
               </span>`
            : escapeHtml(item.TieuDe);

        let mucLucInfo = item.MucLuc?.TenMucLuc ? escapeHtml(item.MucLuc.TenMucLuc) : 'Khác';
        const safeInfo = escapeHtml(mucLucInfo);
        let actionButtons = '';
        const isOwner = currentUser.userId === item.NguoiDang?.ID;
        if (isAdmin || isOwner) {
            actionButtons = `
                <button class="btn btn-warning btn-sm py-1 px-2 w-100 mt-1 btn-sua"
                        data-id="${item.ID}" style="max-width: 80px;">Sửa</button>
                <button class="btn btn-danger btn-sm py-1 px-2 w-100 mt-1 btn-xoa"
                        data-id="${item.ID}" style="max-width: 80px;">Xóa</button>
            `;
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
                 <button type="button" class="btn btn-sm btn-info py-1 px-2 w-100 mt-1 btn-xem-danh-sach-pdf"
                         data-links="${item.LinkPDF}" style="max-width: 80px;">
                    <i class="anticon anticon-eye"></i>
                 </button>
               </div>`
            : `<div class="text-danger text-center"></div>`;

        html += `
            <tr>
                <td class="d-none">${item.ID}</td>
                <td>${start + index + 1}</td>
                <td>${displayTitle}</td>
                <td class="text-center">
                    <button class="btn btn-sm btn-outline-info btn-xem" data-id="${item.ID}">Xem</button>
                </td>
                <td class="text-center">${safeInfo}</td>
                <td>${formatDateFromInt(item.NgayDang)}</td>
                <td>${formatDateFromInt(item.NgayCapNhat)}</td>
                <td>${linkThumb}</td>
                <td>${linkPDF}</td>
                <td>${item.ViewCount ?? 0}</td>
                <td>
                    <div class="text-center d-flex flex-column align-items-center">
                        ${actionButtons}
                    </div>
                </td>
            </tr>`;
    });

    tableBody.html(html);
}
function setupPagination() {
    const totalPages = Math.ceil(filteredBaiViet.length / pageSize);
    let paginationHtml = '';

    if (totalPages <= 1) {
        $('#pagination').html('');
        return;
    }

    function addPage(i) {
        paginationHtml += `<li class="page-item ${i === currentPage ? 'active' : ''}">
            <a class="page-link" href="#" data-page="${i}">${i}</a>
        </li>`;
    }

    // Nút Previous
    paginationHtml += `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" data-page="${currentPage - 1}">«</a>
        </li>`;

    // Trang đầu
    addPage(1);

    if (totalPages <= 5) {
        // Nếu ít trang, hiển thị hết
        for (let i = 2; i <= totalPages; i++) {
            addPage(i);
        }
    } else {
        // Hiển thị thông minh theo vị trí trang hiện tại
        if (currentPage <= 3) {
            addPage(2);
            addPage(3);
            paginationHtml += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
        } else if (currentPage >= totalPages - 2) {
            paginationHtml += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
            for (let i = totalPages - 2; i < totalPages; i++) {
                addPage(i);
            }
        } else {
            paginationHtml += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
            addPage(currentPage - 1);
            addPage(currentPage);
            addPage(currentPage + 1);
            paginationHtml += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
        }

        // Trang cuối
        addPage(totalPages);
    }

    // Nút Next
    paginationHtml += `
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" data-page="${currentPage + 1}">»</a>
        </li>`;

    $('#pagination').html(paginationHtml);
}