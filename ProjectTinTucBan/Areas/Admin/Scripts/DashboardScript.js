const BASE_URL = '/api/v1/admin/';

function showChart(type) {
    $.ajax({
        url: `${BASE_URL}/dashboard/chart?type=` + type,
        method: 'GET',
        success: function (result) {
            renderChartist(result.labels, result.data, type);
            $('#chartContainer').show();
        },
        error: function () {
            alert('Không thể tải dữ liệu biểu đồ.');
        }
    });
}

document.addEventListener("DOMContentLoaded", function () {
    showChart('day');
});

$(document).ready(function () {
    // Cập nhật thống kê tổng quan
    $.ajax({
        url: `${BASE_URL}/dashboard`,
        method: 'GET',
        success: function (data) {
            $('#stat-day-views').text(data.DayViews || 0);
            $('#stat-month-views').text(data.MonthViews || 0);
            $('#stat-year-views').text(data.YearViews || 0);
            $('#stat-articles').text(data.TotalArticles || 0);
        },
        error: function () {
            $('#stat-day-views').text('N/A');
            $('#stat-month-views').text('N/A');
            $('#stat-year-views').text('N/A');
            $('#stat-articles').text('N/A');
        }
    });

    // ===== Kích hoạt biểu đồ =====
    function handleShowChart(type) {
        $('#showtarget').empty();         
        $('#chartContainer').show();      
        showChart(type);                  
    }

    // Gán sự kiện click cho từng loại biểu đồ
    $('#day').on('click', function () {
        handleShowChart('day');
    });

    $('#month').on('click', function () {
        handleShowChart('month');
    });

    $('#year').on('click', function () {
        handleShowChart('year');
    });

    // Ẩn biểu đồ khi click ra ngoài vùng liên quan
    $(document).on('click', function (e) {
        if ($(e.target).closest('#chartContainer, #day, #month, #year').length === 0) {
            $('#chartContainer').hide();
        }
    });

    let mucLucMap = new Map();

    // Gọi API lấy danh sách mục lục
    function loadMucLucs(callback) {
        $.ajax({
            url: `${BASE_URL}/Get-All-Muc-Luc`,
            method: 'GET',
            success: function (res) {
                if (res.success && res.data && Array.isArray(res.data)) {
                    res.data.forEach(ml => {
                        mucLucMap.set(ml.ID, ml.TenMucLuc);
                    });
                }
                if (typeof callback === 'function') callback();
            },
            error: function () {
                console.error("Không thể tải danh sách mục lục");
                if (typeof callback === 'function') callback(); // vẫn tiếp tục hiển thị bảng
            }
        });
    }

    // ===== Hiển thị bảng bài viết =====
    $('#baiviet').on('click', function () {
        $('#chartContainer').hide();
        $('#showtarget').empty();

        loadMucLucs(() => {
            $('#showtarget').html(`
            <div class="table-responsive p-3">
            <div class="card-body" id="baiviet" style="cursor: pointer; text-align: center;">
                <h5>Top 10 bài viết nhiều lượt xem trong tháng</h5>
            </div>
                <table id="table_load_baiviet" class="table table-striped">
                    <thead>
                        <tr>
                            <th class="d-none">ID</th>
                            <th class="text-center">STT</th>
                            <th class="text-center">Tiêu đề</th>
                            <th class="text-center">Mục lục</th>
                            <th class="text-center">Ngày đăng</th>
                            <th class="text-center">Ngày cập nhật</th>
                            <th class="text-center">Thumbnail</th>
                            <th class="text-center">Lượt xem</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            </div>
        `);

            // Gọi API lấy dữ liệu bài viết
            $.ajax({
                url: `${BASE_URL}/top10-baiviet-thang`,
                method: 'GET',
                success: function (data) {
                    if (!data || data.length === 0) {
                        $('#table_load_baiviet tbody').html('<tr><td colspan="11" class="text-center text-muted">Không có bài viết nào.</td></tr>');
                        return;
                    }

                    let html = '';
                    data.forEach((item, index) => {
                        const ngayDang = new Date(item.NgayDang * 1000).toLocaleDateString("vi-VN");
                        const ngayCapNhat = item.NgayCapNhat ? new Date(item.NgayCapNhat * 1000).toLocaleDateString("vi-VN") : '';
                        const tenMucLuc = mucLucMap.get(item.ID_MucLuc) || 'Không rõ';

                        html += `
                        <tr>
                            <td class="d-none">${item.ID}</td>
                            <td>${index + 1}</td>
                            <td>${item.TieuDe || ''}</td>
                            <td>${tenMucLuc}</td>
                            <td>${ngayDang}</td>
                            <td>${ngayCapNhat}</td>
                            <td>
                                ${item.LinkThumbnail ? `<img src="${item.LinkThumbnail}" />` : ''}
                            </td>
                            <td>${item.ViewCount || 0}</td>
                        </tr>
                    `;
                    });

                    $('#table_load_baiviet tbody').html(html);
                },
                error: function () {
                    $('#table_load_baiviet tbody').html('<tr><td colspan="11" class="text-center text-danger">Lỗi khi tải dữ liệu</td></tr>');
                }
            });
        });
    });

});


// Chartist rendering function
function renderChartist(labels, data, type) {
    var defaultLabels = [], defaultData = [];
    if (type === 'day') {
        if (!labels || labels.length === 0) {
            defaultLabels = Array.from({ length: 24 }, (_, i) => i.toString());
            defaultData = Array(24).fill(0);
        }
    }
    if (type === 'month') {
        if (!labels || labels.length === 0) {
            defaultLabels = Array.from({ length: 31 }, (_, i) => (i + 1).toString());
            defaultData = Array(31).fill(0);
        }
    }
    if (type === 'year') {
        if (!labels || labels.length === 0) {
            defaultLabels = Array.from({ length: 12 }, (_, i) => (i + 1).toString());
            defaultData = Array(12).fill(0);
        }
    }
    if (!labels || labels.length === 0) {
        labels = defaultLabels;
        data = defaultData;
    }

    $('#viewsChart').html('');
    var title = '';
    if (type === 'day') title = 'Lượt xem theo giờ trong ngày';
    if (type === 'month') title = 'Lượt xem theo ngày trong tháng';
    if (type === 'year') title = 'Lượt xem theo tháng trong năm';

    var chart = new Chartist.Line('#viewsChart', {
        labels: labels,
        series: [data]
    }, {
        fullWidth: true,
        chartPadding: { right: 40, top: 30 },
        low: 0,
        showPoint: true,
        lineSmooth: true,
        width: '100%',
        axisX: {
            labelInterpolationFnc: function (value, index) {
                if (type === 'day') return value + 'h';
                if (type === 'month') return value;
                if (type === 'year') return 'Th' + value;
                return value;
            }
        }
    });

    chart.on('draw', function (dataDraw) {
        if (dataDraw.type === 'point') {
            var value = dataDraw.value.y;
            if (value === 0) return;
            var x = dataDraw.x;
            var y = dataDraw.y;
            var svg = dataDraw.group._node.ownerSVGElement;
            var text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', x + 10);
            text.setAttribute('y', y - 10); 
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('font-size', '12px');
            text.setAttribute('fill', '#333');
            text.setAttribute('transform', 'rotate(-25 ' + x + ' ' + (y - 10) + ')');
            text.textContent = value;
            svg.appendChild(text);
        }
    });

    $('#viewsChart').prepend('<div style="text-align:center;font-weight:bold;margin-bottom:10px;">' + title + '</div>');
}
/* Test xuất dữ liệu api
$(document).ready(function () {
    $.ajax({
        url: `${BASE_URL}/top10-baiviet-thang`,
        method: 'GET',
        success: function (data) {
            $('#output').text(JSON.stringify(data, null, 4));
        },
        error: function (xhr, status, error) {
            $('#output').text('Lỗi khi tải dữ liệu: ' + error);
        }
    });
});
//Bỏ phần này vô view để test xuất dữ liệu api
<pre id="output" style="background: #f4f4f4; padding: 10px; border: 1px solid #ccc;"></pre>
*/
