






const BASE_URL = `/api/v1/admin`;

// ✅ Định nghĩa hàm handlePasteOrDrop
function handlePasteOrDrop(evt, editor) {
    const items = (evt.clipboardData || evt.dataTransfer)?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf('image') !== -1) {
            evt.preventDefault();
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
}

function insertImage(editor, src, width, height, showToast) {
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

    // Bọc img trong div
    const wrapper = editor.document.createElement('div');
    wrapper.setAttribute('class', 'cke-custom-image-wrapper');
    wrapper.append(img);

    // ❗️Dùng insertHtml thay vì insertElement (ổn định hơn với trình tự nội dung)
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
                // ❌ CHẶN CKEditor xử lý dán ảnh mặc định
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

                        // ❌ Nếu có ảnh, nhưng không phải chỉ có ảnh —> KHÔNG cancel, để giữ lại chữ
                        if (hasImage && transfer.files.length === 1) {
                            evt.cancel(); // Chỉ cancel nếu là ảnh duy nhất
                        }
                    }
                });

                // ✅ Gọi xử lý ảnh tùy chỉnh khi paste hoặc kéo-thả
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

$(document).ready(async function () {
    await restoreSessionStorageFromServer();
    //showLoading('#xemNoiDungContainer', 'Đang tải danh sách bài viết...');
    initCKEditor('NoiDung');
    //hideLoading('#xemNoiDungContainer'); // Ẩn loading sau khi khởi tạo CKEditor
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
        const tieuDe = $('#TieuDeBaiViet').val().trim();

        if (!noiDung || !id) {
            Swal.fire('Thiếu dữ liệu', 'Không có nội dung hoặc ID để cập nhật.', 'warning');
            return;
        }

        try {
            const res = await $.ajax({
                url: `${BASE_URL}/update-noidung/${id}`,
                type: 'PUT',
                contentType: 'application/json',
                data: JSON.stringify({ noiDung: noiDung, tieuDe: tieuDe })
            });

            if (res.success) {
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'success',
                    title: res.message,
                    showConfirmButton: false,
                    timer: 1000,
                    timerProgressBar: true
                });
            } else {
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'error',
                    title: 'Lỗi',
                    text: res.message,
                    showConfirmButton: false,
                    timer: 1000,
                    timerProgressBar: true
                });
            }


        } catch (err) {
            if (err.status === 403 && err.responseJSON && err.responseJSON.message) {
                Swal.fire({ icon: 'warning', title: 'Không được phép', text: err.responseJSON.message });
            } else if (err.status === 401) {
                Swal.fire({ icon: 'warning', title: 'Chưa đăng nhập', text: 'Vui lòng đăng nhập lại.' });
            } else {
                Swal.fire({ icon: 'error', title: 'Lỗi', text: 'Đã xảy ra lỗi khi cập nhật nội dung.' });
            }
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

    // ---------- Xem trước PDF (phiên bản đã sửa hoàn chỉnh) ----------
    $('#btnPreviewPdf').on('click', async function () {
        const result = await Swal.fire({
            title: 'Bạn có muốn xem trước PDF không?',
            icon: 'info',
            showCancelButton: true,
            confirmButtonText: 'Xem',
            cancelButtonText: 'Hủy'
        });

        if (!result.isConfirmed) return;

        // Hiển thị loading
        const loadingSwal = Swal.fire({
            title: 'Đang chuẩn bị PDF...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        try {
            const title = $('#TieuDeBaiViet').val().trim().toUpperCase();
            const noiDung = CKEDITOR.instances.NoiDung.getData();

            // Tạo container mới với CSS đặc biệt cho PDF
            const container = document.createElement('div');
            container.className = 'pdf-preview-container';
            container.style.width = '100%';
            container.style.padding = '20px';
            container.style.boxSizing = 'border-box';

            // Clone nội dung từ CKEditor và xử lý đặc biệt
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = noiDung;

            // Xử lý tất cả hình ảnh trong nội dung
            const images = tempDiv.querySelectorAll('img');
            images.forEach(img => {
                // Đảm bảo hình ảnh có margin và display phù hợp
                img.style.display = 'block';
                img.style.margin = '15px auto';
                img.style.maxWidth = '100%';
                img.style.height = 'auto';

                // Thêm div wrapper cho mỗi hình ảnh
                const wrapper = document.createElement('div');
                wrapper.style.pageBreakInside = 'avoid';
                wrapper.style.breakInside = 'avoid';
                img.parentNode.insertBefore(wrapper, img);
                wrapper.appendChild(img);
            });

            // Thêm nội dung đã xử lý vào container
            container.innerHTML = `
            <div style="text-align: center; margin-bottom: 20px;">
                <h2 style="color: #0d47a1;">${title}</h2>
                <hr style="border-color: #90caf9;"/>
            </div>
            ${tempDiv.innerHTML}
        `;

            // Chờ tất cả hình ảnh tải xong
            await new Promise(resolve => setTimeout(resolve, 300));
            await waitForImagesToLoad(container);

            const opt = {
                margin: [10, 5, 10, 5], // [top, right, bottom, left]
                filename: `${title}.pdf`,
                image: {
                    type: 'jpeg',
                    quality: 0.98
                },
                html2canvas: {
                    scale: 2,
                    useCORS: true,
                    allowTaint: true,
                    logging: true,
                    scrollX: 0,
                    scrollY: 0,
                    ignoreElements: (element) => {
                        return element.classList.contains('cke_wysiwyg_div') ||
                            element.classList.contains('cke_show_borders');
                    }
                },
                jsPDF: {
                    unit: 'mm',
                    format: 'a4',
                    orientation: 'portrait'
                },
                pagebreak: {
                    mode: ['avoid-all', 'css', 'legacy'],
                    before: '.page-break-before',
                    after: '.page-break-after',
                    avoid: 'img'
                }
            };

            // Tạo PDF
            const pdfBlob = await html2pdf().set(opt).from(container).outputPdf('blob');
            const blobUrl = URL.createObjectURL(pdfBlob);

            Swal.close();

            // Hiển thị PDF preview
            Swal.fire({
                title: 'Xem trước PDF',
                html: `
                <div style="width: 100%; height: 500px;">
                    <iframe src="${blobUrl}" width="100%" height="100%" style="border: none;"></iframe>
                </div>
            `,
                width: '60%',
                showCloseButton: true,
                showConfirmButton: false,
                customClass: {
                    container: 'pdf-preview-modal'
                }
            });

        } catch (error) {
            Swal.fire('Lỗi', 'Không thể tạo PDF. Vui lòng thử lại.', 'error');
        }
    });

    // Hàm chờ tất cả hình ảnh tải xong (phiên bản cải tiến)
    async function waitForImagesToLoad(container) {
        const images = container.querySelectorAll('img');
        const loadPromises = Array.from(images).map(img => {
            // Nếu hình ảnh đã tải xong
            if (img.complete && img.naturalWidth > 0) {
                return Promise.resolve();
            }

            // Nếu hình ảnh chưa tải
            return new Promise((resolve) => {
                img.onload = resolve;
                img.onerror = resolve; // Vẫn tiếp tục dù có lỗi
                // Timeout dự phòng
                setTimeout(resolve, 2000);
            });
        });

        await Promise.all(loadPromises);
        await new Promise(resolve => setTimeout(resolve, 300)); // Thêm delay đảm bảo
    }

    // Hàm chờ tất cả hình ảnh tải xong
    async function waitForImagesToLoad(container) {
        const images = container.querySelectorAll('img');
        const promises = Array.from(images).map(img => {
            if (img.complete && img.naturalWidth !== 0) {
                return Promise.resolve();
            }
            return new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = resolve; // Vẫn tiếp tục ngay cả khi có lỗi tải ảnh
            });
        });

        await Promise.all(promises);
        await new Promise(resolve => setTimeout(resolve, 200)); // Thêm delay nhỏ để đảm bảo
    }
    const baiVietId = $('#BaiVietID').val();
    if (!baiVietId) return;

    $.get(`${BASE_URL}/get-baiviet-by-id/${baiVietId}`, function (res) {
        if (!res.success || !res.data) {
            Swal.fire('Lỗi', 'Không thể tải bài viết.', 'error');
            return;
        }

        const data = res.data;

        // Gán dữ liệu vào giao diện
        $('#TieuDeBaiViet').val(data.TieuDe || '');
        $('.nguoi-dang').text(data.NguoiDang?.TenTaiKhoan || 'Không xác định');
        $('.id-nguoi-dang').text(data.NguoiDang?.ID || 'Không rõ');
        $('.ngay-dang').text(formatUnixDate(data.NgayDang));
        $('.ngay-capnhat').text(formatUnixDate(data.NgayCapNhat));

        // Nội dung CKEditor
        if (CKEDITOR.instances.NoiDung) {
            CKEDITOR.instances.NoiDung.setData(data.NoiDung || '');
        } else {
            initCKEditor('NoiDung');
            CKEDITOR.instances.NoiDung.setData(data.NoiDung || '');
        }

        // 👇 XỬ LÝ QUYỀN: nếu không phải admin và không phải người đăng thì ẩn nút Lưu
        const currentUser = JSON.parse(sessionStorage.getItem('loginInfo') || '{}');
        const isAdmin = currentUser.role === 1;
        const isOwner = currentUser.userId === data.NguoiDang?.ID;

        if (!isAdmin && !isOwner) {
            $('#btnLuuNoiDung').hide(); // Ẩn nút
        } else {
            $('#btnLuuNoiDung').show(); // Hiện lại nếu có quyền
        }
        
    });

    // Hàm chuyển timestamp về dạng dd/MM/yyyy
    function formatUnixDate(unixSeconds) {
        if (!unixSeconds) return "N/A";

        const date = new Date(unixSeconds * 1000);
        const weekdays = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
        const dayOfWeek = weekdays[date.getDay()];
        const day = ("0" + date.getDate()).slice(-2);
        const month = ("0" + (date.getMonth() + 1)).slice(-2);
        const year = date.getFullYear();
        const hours = ("0" + date.getHours()).slice(-2);
        const minutes = ("0" + date.getMinutes()).slice(-2);
        const seconds = ("0" + date.getSeconds()).slice(-2);

        return `${dayOfWeek}, ${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
    }

});