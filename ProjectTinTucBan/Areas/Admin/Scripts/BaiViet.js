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

    $(document).on('click', '.btn-sua', async function () {
        const id = $(this).data('id');
        resetModalForm();

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
                CKEDITOR.instances.NoiDung.setData(b.NoiDung || '');

                $('#previewThumbnail').html(b.LinkThumbnail ? `<img src="${b.LinkThumbnail}" style="max-width: 200px;" />` : '');
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
            const linkThumb = item.LinkThumbnail
                ? `<a href="${item.LinkThumbnail}" target="_blank">Xem</a>`
                : `<span class="text-danger">Không có</span>`;
            const linkPDF = item.LinkPDF
                ? `<a href="${item.LinkPDF}" target="_blank">Xem</a>`
                : `<span class="text-danger">Không có</span>`;

            html += `
                <tr>
                    <td class="d-none">${item.ID}</td>
                    <td>${index + 1}</td>
                    <td>${item.TieuDe || ''}</td>
                    <td>${item.NoiDung || ''}</td>
                    <td>${formatDateFromInt(item.NgayDang)}</td>
                    <td>${formatDateFromInt(item.NgayCapNhat)}</td>
                    <td>${linkThumb}</td>
                    <td>${linkPDF}</td>
                    <td>${item.ViewCount ?? 0}</td>
                    <td>
                        <button class="btn btn-warning btn-sm btn-sua" data-id="${item.ID}">Sửa</button>
                        <button class="btn btn-danger btn-sm btn-xoa" data-id="${item.ID}">Xóa</button>
                    </td>
                </tr>`;
        });

        table.find('tbody').html(html);
        table.DataTable({ order: [] });
    } else {
        table.find('tbody').html(`<tr><td colspan="9">${res.message}</td></tr>`);
    }
}

function formatDateFromInt(dateInt) {
    if (!dateInt) return '';
    const str = dateInt.toString();
    return `${str.slice(6, 8)}/${str.slice(4, 6)}/${str.slice(0, 4)}`;
}

// -------------------- [ Modal form logic ] --------------------
function setupModalFormEvents() {
    try {
        CKEDITOR.replace('NoiDung');
    } catch (err) { }

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

    // 👉 Sự kiện mở thư viện ảnh
    $('#btnChonThumbnail').on('click', async function () {
        $('#thuVienAnh').html('<p>Đang tải ảnh...</p>');
        $('#modalThuVienAnh').modal('show');

        try {
            const res = await $.ajax({
                url: `${BASE_URL}/thu-vien-anh`,
                type: 'GET'
            });

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

    // 👉 Sự kiện chọn ảnh từ thư viện
    $(document).on('click', '.img-select', function () {
        const link = $(this).data('link');
        $('#LinkThumbnail').val(link);
        $('#previewThumbnail').html(`<img src="${link}" style="max-width: 200px;" />`);
        $('#modalThuVienAnh').modal('hide');
    });
}

function resetModalForm() {
    const form = $('#form_baiviet')[0];
    if (form) form.reset();
    $('#BaiVietID').val('');
    CKEDITOR.instances.NoiDung.setData('');
    $('#previewThumbnail').html('');
    $('#previewPDF').html('');
}
