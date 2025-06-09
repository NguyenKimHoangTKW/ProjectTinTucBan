let BASE_URL = `/api/v1/admin`;

let BASE_URL_DV = `/api/v1/donvi`;
let BASE_URL_CTDT = `/api/v1/ctdt`;
function goBack() {
    window.history.back();
}
$(document).ready(function () {
    $("input").attr("autocomplete", "off");
    $("#from_date, #to_date").attr("readonly");
   
    $(".datetime-input").datepicker({
        closeText: "Đóng",
        prevText: "Trước",
        nextText: "Sau",
        currentText: "Hôm nay",
        monthNames: ["Tháng một", "Tháng hai", "Tháng ba", "Tháng tư", "Tháng năm", "Tháng sáu", "Tháng bảy", "Tháng tám", "Tháng chín", "Tháng mười", "Tháng mười một", "Tháng mười hai"],
        monthNamesShort: ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"],
        dayNames: ["Chủ nhật", "Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy"],
        dayNamesShort: ["CN", "Hai", "Ba", "Tư", "Năm", "Sáu", "Bảy"],
        dayNamesMin: ["CN", "T2", "T3", "T4", "T5", "T6", "T7"],
        weekHeader: "Tuần",
        dateFormat: "dd/mm/yy",
        firstDay: 1,
        isRTL: false,
        showMonthAfterYear: false,
        yearSuffix: "",
        changeMonth: true,
        changeYear: true,
        yearRange: "-70:+5"
    }).datepicker("refresh");
    load_permission()
})
async function load_permission() {
    const res = await $.ajax({
        url: '/api/v1/phanquyen/load_permission_user',
        type: 'POST'
    })
    if (res.success) {
        $('.nav-item.dropdown').each(function () {
            var ma = $(this).data('ma');
            if (res.data.includes(ma)) {
                $(this).show();
            }
        });
    }
    else {
        Swal.fire({
            icon: "error",
            title: "Oops...",
            text: res.message,
        });
    }
}
function goBack() {
    window.history.back();
}
function Sweet_Alert(ico, title) {
    const Toast = Swal.mixin({
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        didOpen: (toast) => {
            toast.onmouseenter = Swal.stopTimer;
            toast.onmouseleave = Swal.resumeTimer;
        }
    });
    Toast.fire({
        icon: ico,
        title: title
    });
}

function convertToTimestamp(dateStr) {
    if (!dateStr) return null;

    const parts = dateStr.split("/");
    if (parts.length !== 3) return null;

    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);

    const dateObj = new Date(year, month, day);
    return Math.floor(dateObj.getTime() / 1000);
}
