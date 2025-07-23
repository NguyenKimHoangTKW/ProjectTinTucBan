$(document).ready(function () {
    // Gọi API tăng người online
    $.ajax({
        type: "POST",
        url: "/api/v1/visitor/increase-online",
        success: function (data) {
            $("#visitorTotal").text(data.total);
            $("#visitorOnline").text(data.online);
        },
        error: function (xhr, status, error) {
            // Không log lỗi ra console
        }
    });
    // Sau 15 giây gọi API tăng tổng lượt truy cập
    setTimeout(function () {
        $.ajax({
            type: "POST",
            url: "/api/v1/visitor/increase-total",
            success: function (data) {
                $("#visitorTotal").text(data.total); // cập nhật lại tổng nếu tăng thành công
            },
            error: function (xhr, status, error) {
                // Không log lỗi ra console
            }
        });
    }, 15000);
});
// Giảm lượt online khi rời trang
$(window).on("beforeunload", function () {
    $.ajax({
        type: "POST",
        url: "/api/visitor/decrease",
        async: false
    });
});
