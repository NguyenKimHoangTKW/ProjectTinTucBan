function Sweet_Alert(icon, title) {
    Swal.fire({
        position: "center",
        icon: icon,
        title: title,
        showConfirmButton: false,
        timer: 2500
    });
}

function formatTimestamp(unixTimestamp) {
    if (!unixTimestamp) return "Chưa có dữ liệu";

        var date = new Date(unixTimestamp * 1000);
        var weekdays = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
        var dayOfWeek = weekdays[date.getDay()];
        var month = ("0" + (date.getMonth() + 1)).slice(-2);
        var day = ("0" + date.getDate()).slice(-2);
        var year = date.getFullYear();
        var hours = ("0" + date.getHours()).slice(-2);
        var minutes = ("0" + date.getMinutes()).slice(-2);
        var seconds = ("0" + date.getSeconds()).slice(-2);
        var formattedDate = dayOfWeek + ', ' + day + "-" + month + "-" + year + " " + hours + ":" + minutes + ":" + seconds;
        return formattedDate;
    }

function showLoading(selector, message = "Đang tải dữ liệu...") {
    const container = $(selector);
    if (!container.length) return;
    // Lưu nội dung gốc trước khi thay thế
    container.data('original-content', container.html());

    // Lưu thời điểm bắt đầu loading
    container.data('loading-start', Date.now());

    // Hiển thị chỉ báo loading
    container.html(`
        <div class="text-center my-4">
            <div class="spinner-border text-primary" role="status">
                <span class="sr-only">Loading...</span>
            </div>
            <p class="mt-2">${message}</p>
        </div>
    `);
}

// Hàm chờ tối thiểu 2s kể từ khi showLoading
function waitMinLoading(selector, minMs = 2000) {
    const container = $(selector);
    const start = container.data('loading-start') || Date.now();
    const elapsed = Date.now() - start;
    return new Promise(resolve => {
        if (elapsed >= minMs) resolve();
        else setTimeout(resolve, minMs - elapsed);
    });
}

function hideLoading(selector, newContent = null) {
    const container = $(selector);
    if (!container.length) return;

    if (newContent !== null) {
        // Nếu có nội dung mới, hiển thị nó
        container.html(newContent);
    } else {
        // Khôi phục nội dung gốc nếu có
        const originalContent = container.data('original-content');
        if (originalContent) {
            container.html(originalContent);
        }
    }
    // Xóa dữ liệu đã lưu
    container.removeData('original-content');
    container.removeData('loading-start');
}

    const dataTableDefaults = {
        pageLength: 5,
        lengthMenu: [5, 10, 15, 25, 50],
        language: {
            paginate: {
                next: "Tiếp",
                previous: "Trước"
            },
            search: "Tìm nhanh:",
            lengthMenu: "Hiển thị _MENU_ mục",
            emptyTable: "Không có dữ liệu",
            zeroRecords: "Không tìm thấy kết quả phù hợp",
            info: "Hiển thị _START_ đến _END_ của _TOTAL_ mục",
            infoEmpty: "Hiển thị 0 đến 0 của 0 mục",
            infoFiltered: "(lọc từ _MAX_ mục)"
        }
    };