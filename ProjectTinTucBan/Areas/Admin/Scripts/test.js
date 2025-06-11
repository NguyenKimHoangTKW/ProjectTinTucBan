const BASE_URL = `/api/v1/admin`;


$(document).ready(async function () {
    await GetAllMucLuc();
});
async function GetAllMucLuc() {
    const res = await $.ajax({
        url: `${BASE_URL}/get-all-mucluc`,
        type: 'GET'
    });
    if (res.success) {
        console.log(res.data);
        // xử lý dữ liệu api và render giao diện ở đây
    }
    else {
        console.log(res.message);
        // xử lý dữ liệu api và render giao diện ở đây
    }
}