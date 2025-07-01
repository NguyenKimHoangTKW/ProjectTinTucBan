const BASE_URL = `/api/v1/admin`;

// ✅ Định nghĩa hàm resizeImage
function resizeImage(file, maxWidth, maxHeight, callback) {
    const reader = new FileReader();
    reader.onload = function (e) {
        const img = new Image();
        img.onload = function () {
            const canvas = document.createElement('canvas');
            canvas.width = maxWidth;
            canvas.height = maxHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, maxWidth, maxHeight);
            canvas.toBlob(function (blob) {
                callback(blob, canvas.toDataURL(file.type));
            }, file.type);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// ✅ Định nghĩa hàm checkImageExactSize
function checkImageExactSize(file, requiredWidth, requiredHeight, callback) {
    const reader = new FileReader();
    reader.onload = function (e) {
        const img = new Image();
        img.onload = function () {
            if (img.width === requiredWidth && img.height === requiredHeight) {
                callback(true, e.target.result);
            } else {
                callback(false, null);
            }
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// ✅ Định nghĩa hàm handlePasteOrDrop
function handlePasteOrDrop(evt, editor) {
    const items = (evt.clipboardData || evt.dataTransfer)?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf('image') !== -1) {
            evt.preventDefault();
            const file = item.getAsFile();

            const requiredWidth = 600;
            const requiredHeight = 400;

            const reader = new FileReader();
            reader.onload = function (e) {
                const img = new Image();
                img.onload = function () {
                    if (img.width === requiredWidth && img.height === requiredHeight) {
                        // Hình đúng kích thước, chèn luôn
                        editor.insertHtml('<img src="' + e.target.result + '" width="600" height="400" />');
                    } else {
                        // Resize hình cho đúng kích thước rồi chèn vào
                        resizeImage(file, requiredWidth, requiredHeight, function (resizedBlob, resizedDataUrl) {
                            editor.insertHtml('<img src="' + resizedDataUrl + '" width="600" height="400" />');
                            Swal.fire({
                                toast: true,
                                position: 'top-end',
                                icon: 'success',
                                title: 'Đã resize ảnh về 600x400 và chèn vào nội dung',
                                showConfirmButton: false,
                                timer: 2000,
                                timerProgressBar: true
                            });
                        });
                    }
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    }
}

// ✅ Định nghĩa hàm khởi tạo CKEditor
function initCKEditor(elementId) {
    if (CKEDITOR.instances[elementId]) {
        CKEDITOR.instances[elementId].destroy(true);
    }

    CKEDITOR.replace(elementId, {
        extraPlugins: 'justify',
        allowedContent: true,
        height: 500,
        resize_enabled: false,
        width: '100%',
        toolbar: [
            { name: 'clipboard', items: ['Cut', 'Copy', 'Paste', 'Undo', 'Redo'] },
            { name: 'basicstyles', items: ['Bold', 'Italic', 'Underline', 'Strike'] },
            { name: 'paragraph', items: ['NumberedList', 'BulletedList', 'JustifyLeft', 'JustifyCenter', 'JustifyRight'] },
            { name: 'insert', items: ['Image', 'Table'] },
            { name: 'tools', items: ['Maximize'] }
        ],
        on: {
            instanceReady: function (evt) {
                const editor = evt.editor;

                // ❌ Chặn dán hình mặc định
                editor.on('paste', function (evt) {
                    const data = evt.data;
                    if (data && data.dataTransfer && data.dataTransfer._) {
                        const files = data.dataTransfer._.files || [];
                        if (files.length > 0 && files[0].type.startsWith('image/')) {
                            evt.cancel(); // Ngăn CKEditor chèn ảnh gốc
                        }
                    }
                });

                // ❌ Chặn kéo-thả hình mặc định
                editor.on('drop', function (evt) {
                    const data = evt.data;
                    if (data && data.$ && data.$.dataTransfer) {
                        const items = data.$.dataTransfer.items || [];
                        if (items.length > 0 && items[0].type.startsWith('image/')) {
                            evt.cancel(); // Ngăn CKEditor chèn ảnh gốc
                        }
                    }
                });

                // ✅ Gọi xử lý ảnh tùy chỉnh
                editor.document.on('paste', function (e) {
                    handlePasteOrDrop(e.data.$, editor);
                });

                editor.document.on('drop', function (e) {
                    handlePasteOrDrop(e.data.$, editor);
                });
            }
        }
    });
}

$(document).ready(function () {
    initCKEditor('NoiDung');
    // ---------- Lưu nội dung ----------
    $('#btnLuuNoiDung').on('click', async function () {
        const result = await Swal.fire({
            title: 'Bạn có chắc chắn muốn lưu nội dung không?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Lưu',
            cancelButtonText: 'Hủy'
        });

        if (!result.isConfirmed) return;

        const noiDung = CKEDITOR.instances.NoiDung.getData().trim();
        const id = $('#BaiVietID').val();

        if (!noiDung || !id) {
            Swal.fire('Thiếu dữ liệu', 'Không có nội dung hoặc ID để cập nhật.', 'warning');
            return;
        }

        try {
            const res = await $.ajax({
                url: `${BASE_URL}/update-noidung/${id}`,
                type: 'PUT',
                contentType: 'application/json',
                data: JSON.stringify({ noiDung: noiDung })
            });

            if (res.success) {
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'success',
                    title: 'Lưu thông tin thành công!',
                    showConfirmButton: false,
                    timer: 2000,
                    timerProgressBar: true
                });
            } else {
                Swal.fire('Lỗi', res.message || 'Không thể cập nhật.', 'error');
            }
        } catch (err) {
            Swal.fire('Lỗi', 'Lỗi kết nối hoặc máy chủ.', 'error');
        }
    });

    // ---------- Quay lại ----------
    $('#btnQuayLai').on('click', function () {
        if (window.opener) {
            // Nếu được mở từ cửa sổ khác
            window.close();
        } else {
            // Nếu là trang bình thường
            window.location.href = '/Admin/InterfaceAdmin/BaiViet';
        }
    });

    // ---------- Xem trước PDF ----------
    $('#btnPreviewPdf').on('click', async function () {
        const result = await Swal.fire({
            title: 'Bạn có muốn xem trước PDF không?',
            icon: 'info',
            showCancelButton: true,
            confirmButtonText: 'Xem',
            cancelButtonText: 'Hủy'
        });

        if (!result.isConfirmed) return;

        const title = $('.title').text().trim().toUpperCase();
        const noiDung = CKEDITOR.instances.NoiDung.getData();

        const container = document.createElement('div');
        container.innerHTML = `
            <div style="text-align: center;">
                <h2>${title}</h2>
                <hr />
            </div>
            <div>${noiDung}</div>
        `;

        const opt = {
            margin: 0.5,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
        };

        html2pdf().set(opt).from(container).outputPdf('blob').then(blob => {
            const blobUrl = URL.createObjectURL(blob);
            Swal.fire({
                title: 'Xem trước PDF',
                html: `<iframe src="${blobUrl}" width="100%" height="500px" style="border:none;"></iframe>`,
                width: '80%',
                showCloseButton: true,
                showConfirmButton: false
            });
        });
    });
});
