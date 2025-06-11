//const BASE_URL = `/api/v1/admin`;

//$(document).ready(async function () {
//    await GetAllBaiViet();
//});

////Hàm xử lý INT dạng yyyymmdd (ví dụ: 20240611)
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

//    if (res.success) {
//        console.log(res.data);
//        let html = '';
//        res.data.forEach(item => {
//            html += `
//            <tr>
//                <td>${item.TieuDe}</td>
//                <td>${item.TenMucLuc || 'Không rõ'}</td>
//                <td>${formatDateFromInt(item.NgayDang)}</td>
//                <td>${formatDateFromInt(item.NgayCapNhat)}</td>
//                <td>${item.ViewCount}</td>
//            </tr>
//        `;
//        });
//        $('#table-bai-viet tbody').html(html);
//    } else {
//        console.log(res.message);
//        $('#table-bai-viet tbody').html(
//            `<tr><td colspan="6" class="text-center text-danger">${res.message}</td></tr>`
//        );
//    }
//}

const BASE_URL = `/api/v1/admin`;

$(document).ready(async function () {
    await GetAllBaiViet();
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

    if (res.success) {
        let html = '';
        let body = $('#table_load_baiviet tbody');
        res.data.forEach(item => {
            html += `
                <tr>
                    <td>${item.ID}</td>
                    <td>${item.TieuDe || ''}</td>
                    <td>${item.NoiDung || ''}</td>                   
                    <td>${formatDateFromInt(item.NgayDang)}</td>
                    <td>${formatDateFromInt(item.NgayCapNhat)}</td>
                     <td>${item.LinkThumbnail || ''}</td>
                    <td>${item.LinkPDF || ''}</td>
                    <td>${item.ViewCount ?? 0}</td>
                </tr>`;
        });
        body.html(html);
    } else {
        $('#table_load_baiviet tbody').html(
            `<tr><td colspan="8" class="text-center text-danger">${res.message}</td></tr>`
        );
    }
}
