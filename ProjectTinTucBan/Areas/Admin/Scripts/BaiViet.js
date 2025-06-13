
//const BASE_URL = `/api/v1/admin`;

//$(document).ready(async function () {
//    await GetAllBaiViet();

//    $('#btnThemBaiViet').on('click', function () {
//        window.location.href = '/Admin/InterfaceAdmin/ThemBaiViet';
//    });

//    $(document).on('click', '.btn-sua', function () {
//        const id = $(this).data('id');
//        window.location.href = `/Admin/InterfaceAdmin/SuaBaiViet?id=${id}`;
//    });
//    $(document).on('click', '.btn-xoa', async function () {
//        const id = $(this).data('id');
//        if (confirm('Bạn có chắc muốn xóa bài viết này?')) {
//            try {
//                const res = await $.ajax({
//                    url: `${BASE_URL}/xoa-baiviet/${id}`,
//                    type: 'DELETE'
//                });

//                if (res.success) {
//                    alert("Đã xóa thành công!");
//                    await GetAllBaiViet(); // Reload lại bảng
//                } else {
//                    alert(res.message || "Xóa thất bại!");
//                }
//            } catch (error) {
//                alert("Đã xảy ra lỗi khi xóa bài viết.");
//            }
//        }
//    });

//});

//function formatDateFromInt(dateInt) {
//    if (!dateInt) return '';
//    const str = dateInt.toString();
//    if (str.length !== 8) return str;
//    const year = str.substring(0, 4);
//    const month = str.substring(4, 6);
//    const day = str.substring(6, 8);
//    return `${day}/${month}/${year}`;
//}

//async function GetAllBaiViet() {
//    const res = await $.ajax({
//        url: `${BASE_URL}/get-all-baiviet`,
//        type: 'GET'
//    });

//    const table = $('#table_load_baiviet');

//    if (res.success) {
//        let html = '';
//        res.data.forEach(item => {
//            html += `
//                <tr>
//                    <td>${item.ID}</td>
//                    <td>${item.TieuDe || ''}</td>
//                    <td>${item.NoiDung || ''}</td>
//                    <td>${formatDateFromInt(item.NgayDang)}</td>
//                    <td>${formatDateFromInt(item.NgayCapNhat)}</td>
//                    <td><a href="${item.LinkThumbnail}" target="_blank">Xem</a></td>
//                    <td><a href="${item.LinkPDF}" target="_blank">Xem</a></td>
//                    <td>${item.ViewCount ?? 0}</td>
//                    <td>
//                        <button class="btn btn-warning btn-sua" data-id="${item.ID}">Sửa</button>
//                        <button class="btn btn-danger btn-xoa" data-id="${item.ID}">Xóa</button>
//                    </td>
//                </tr>`;
//        });

//        table.find('tbody').html(html);

//        if ($.fn.DataTable.isDataTable('#table_load_baiviet')) {
//            $('#table_load_baiviet').DataTable().destroy();
//        }

//        $('#table_load_baiviet').DataTable({
//            pageLength: 10,
//            responsive: true,
//            language: {
//                search: "Tìm kiếm:",
//                lengthMenu: "Hiển thị _MENU_ dòng",
//                info: "Hiển thị _START_ đến _END_ của _TOTAL_ dòng",
//                infoEmpty: "Không có dữ liệu",
//                paginate: {
//                    previous: "Trước",
//                    next: "Sau"
//                },
//                zeroRecords: "Không tìm thấy kết quả phù hợp"
//            }
//        });
//    } else {
//        table.find('tbody').html(
//            `<tr><td colspan="9" class="text-center text-danger">${res.message}</td></tr>`
//        );
//    }
//}

const BASE_URL = `/api/v1/admin`;
let selectedBaiVietID = null;

$(document).ready(async function () {
    await GetAllBaiViet();

    $('#btnThemBaiViet').on('click', function () {
        window.location.href = '/Admin/InterfaceAdmin/ThemBaiViet';
    });

    // Sửa bài viết
    $(document).on('click', '.btn-sua', function () {
        const id = $(this).data('id');
        window.location.href = `/Admin/InterfaceAdmin/SuaBaiViet?id=${id}`;
    });

    // Mở modal xác nhận xóa
    $(document).on('click', '.btn-xoa', function () {
        selectedBaiVietID = $(this).data('id');
        const tieuDe = $(this).data('tieude');
        const noiDung = $(this).data('noidung');

        $('#modalTieuDe').text(tieuDe || '');
        $('#modalNoiDung').text(noiDung || '');
        $('#modalXacNhanXoa').modal('show');
    });

    // Xác nhận xóa trong modal
    $('#btnXacNhanXoa').on('click', async function () {
        if (!selectedBaiVietID) return;

        try {
            const res = await $.ajax({
                url: `${BASE_URL}/xoa-baiviet/${selectedBaiVietID}`,
                type: 'DELETE'
            });

            if (res.success) {
                $('#modalXacNhanXoa').modal('hide');
                alert("Đã xóa thành công!");
                await GetAllBaiViet();
            } else {
                alert(res.message || "Xóa thất bại!");
            }
        } catch (error) {
            alert("Đã xảy ra lỗi khi xóa bài viết.");
        }
    });
});

function formatDateFromInt(dateInt) {
    if (!dateInt) return '';
    const str = dateInt.toString();
    if (str.length !== 8) return str;
    const year = str.substring(0, 4);
    const month = str.substring(4, 6);
    const day = str.substring(6, 8);
    return `${day}/${month}/${year}`;
}

async function GetAllBaiViet() {
    const res = await $.ajax({
        url: `${BASE_URL}/get-all-baiviet`,
        type: 'GET'
    });

    const table = $('#table_load_baiviet');

    if (res.success) {
        let html = '';
        res.data.forEach(item => {
            html += `
                <tr>
                    <td>${item.ID}</td>
                    <td>${item.TieuDe || ''}</td>
                    <td>${item.NoiDung || ''}</td>
                    <td>${formatDateFromInt(item.NgayDang)}</td>
                    <td>${formatDateFromInt(item.NgayCapNhat)}</td>
                    <td><a href="${item.LinkThumbnail}" target="_blank">Xem</a></td>
                    <td><a href="${item.LinkPDF}" target="_blank">Xem</a></td>
                    <td>${item.ViewCount ?? 0}</td>
                    <td>
                        <button class="btn btn-warning btn-sua" data-id="${item.ID}">Sửa</button>
                        <button class="btn btn-danger btn-xoa" 
                                data-id="${item.ID}"
                                data-tieude="${item.TieuDe || ''}"
                                data-noidung="${item.NoiDung || ''}">
                            Xóa
                        </button>
                    </td>
                </tr>`;
        });

        table.find('tbody').html(html);

        if ($.fn.DataTable.isDataTable('#table_load_baiviet')) {
            $('#table_load_baiviet').DataTable().destroy();
        }

        $('#table_load_baiviet').DataTable({
            pageLength: 10,
            responsive: true,
            language: {
                search: "Tìm kiếm:",
                lengthMenu: "Hiển thị _MENU_ dòng",
                info: "Hiển thị _START_ đến _END_ của _TOTAL_ dòng",
                infoEmpty: "Không có dữ liệu",
                paginate: {
                    previous: "Trước",
                    next: "Sau"
                },
                zeroRecords: "Không tìm thấy kết quả phù hợp"
            }
        });
    } else {
        table.find('tbody').html(
            `<tr><td colspan="9" class="text-center text-danger">${res.message}</td></tr>`
        );
    }
}

