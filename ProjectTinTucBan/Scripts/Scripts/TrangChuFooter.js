$(document).ready(function () {
    // Tăng lượt truy cập
    $.ajax({
        type: "POST",
        url: "/api/visitor/increase",
        success: function (data) {
            $("#visitorTotal").text(data.total);
            $("#visitorOnline").text(data.online);
        },
        error: function (xhr, status, error) {
            console.error("❌ Lỗi cập nhật truy cập:", error);
        }
    });
});

// Giảm lượt truy cập khi rời trang
$(window).on("beforeunload", function () {
    $.ajax({
        type: "POST",
        url: "/api/visitor/decrease",
        async: false
    });
});