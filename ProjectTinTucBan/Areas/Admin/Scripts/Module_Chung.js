/**
 * Shared Admin Module - Common functionality for admin pages
 */
const AdminShared = (function () {
    /**
     * Display SweetAlert notifications
     * @param {string} icon - success, error, warning, info
     * @param {string} title - Message to display
     */
    function Sweet_Alert(icon, title) {
        Swal.fire({
            position: "center",
            icon: icon,
            title: title,
            showConfirmButton: false,
            timer: 2500
        });
    }

    /**
     * Format Unix timestamp to readable Vietnamese date
     * @param {number} unixTimestamp - Unix timestamp to format
     * @returns {string} Formatted date string
     */
    function formatTimestamp(unixTimestamp) {
        if (!unixTimestamp) return "N/A";

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

    /**
     * Show loading in a container
     * @param {string} selector - Container selector
     * @param {string} message - Loading message
     */
    function showLoading(selector, message = "Đang tải dữ liệu...") {
        const container = $(selector);
        if (!container.length) return;

        // Lưu nội dung gốc trước khi thay thế
        container.data('original-content', container.html());

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

    /**
     * Hide loading and restore or set new content
     * @param {string} selector - Container selector
     * @param {string} newContent - New content to display (optional)
     */
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
    }


    /**
     * Common DataTable settings for admin tables
     */
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

    // Return public API
    return {
        Sweet_Alert,
        formatTimestamp,
        showLoading,
        hideLoading,
        dataTableDefaults
    };
})();

