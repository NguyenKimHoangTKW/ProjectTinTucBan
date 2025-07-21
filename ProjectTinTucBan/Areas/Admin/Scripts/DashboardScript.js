const BASE_URL = '/api/v1/admin';

function showChart(type) {
    $.ajax({
        url: `${BASE_URL}/dashboard/chart?type=` + type,
        method: 'GET',
        success: function (result) {
            renderChartist(result.labels, result.data, type);
            $('#chartContainer').show();
        },
        error: function () {
            Sweet_Alert('error', 'Không thể tải dữ liệu biểu đồ.');
        }
    });
}

document.addEventListener("DOMContentLoaded", function () {
    showChart('day');

    const yearInput = document.getElementById('filter-year');
    const monthSelect = document.getElementById('filter-month');
    const fromInput = document.getElementById('filter-from');
    const toInput = document.getElementById('filter-to');

    // Tạo option tháng 1-12
    for (let i = 1; i <= 12; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = `Tháng ${i}`;
        monthSelect.appendChild(option);
    }

    // Ban đầu: disable tháng và ngày
    monthSelect.disabled = true;
    fromInput.disabled = true;
    toInput.disabled = true;

    // Khi nhập năm
    yearInput.addEventListener('input', function () {
        const yearVal = yearInput.value.trim();
        if (yearVal !== '' && yearVal.length === 4 && Number(yearVal) >= 2000 && Number(yearVal) <= 2100) {
            monthSelect.disabled = false;
        } else {
            monthSelect.value = '';
            monthSelect.disabled = true;

            fromInput.value = '';
            toInput.value = '';
            fromInput.disabled = true;
            toInput.disabled = true;
        }
    });

    // Khi chọn tháng
    monthSelect.addEventListener('change', function () {
        if (monthSelect.value !== '') {
            fromInput.disabled = false;
            toInput.disabled = false;
        } else {
            fromInput.value = '';
            toInput.value = '';
            fromInput.disabled = true;
            toInput.disabled = true;
        }
    });
});

$(document).ready(function () {
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
            Sweet_Alert('error', 'Không thể tải dữ liệu tổng quan.');
        }
    });

    function handleShowChart(type) {
        $('#showtarget').empty();
        $('#chartContainer').show();
        showChart(type);
    }
    /*
    $('#day').on('click', function () { handleShowChart('day'); });
    $('#month').on('click', function () { handleShowChart('month'); });
    $('#year').on('click', function () { handleShowChart('year'); });
    */
    $(document).on('click', function (e) {
        if ($(e.target).closest('#chartContainer, #day, #month, #year').length === 0) {
            $('#chartContainer').hide();
        }
    });

    let mucLucMap = new Map();

    $('#btn-apply-filter').on('click', function () {
        const year = $('#filter-year').val();
        const month = $('#filter-month').val();
        const fromDay = $('#filter-from').val();
        const toDay = $('#filter-to').val();

        if (!year && !month && !fromDay && !toDay) {
            Sweet_Alert('warning', 'Vui lòng nhập khoảng thời gian cần hiển thị vào bộ lọc.');
            return;
        }

        // Kiểm tra from > to
        if (fromDay && toDay && Number(fromDay) > Number(toDay)) {
            Sweet_Alert('warning', 'Ngày bắt đầu không được lớn hơn ngày kết thúc.');
            return;
        }

        const params = new URLSearchParams();

        if (year) params.append('year', year);
        if (month) params.append('month', month);

        const parseDatePartsToUnix = (y, m, d) => {
            if (!y || !m || !d) return null;
            const date = new Date(`${y}-${m.padStart?.(2, '0')}-${d.padStart?.(2, '0')}T00:00:00`);
            return !isNaN(date) ? Math.floor(date.getTime() / 1000) : null;
        };

        const fromTs = parseDatePartsToUnix(year, month, fromDay);
        const toTs = parseDatePartsToUnix(year, month, toDay);

        if (fromTs) params.append('from', fromTs);
        if (toTs) params.append('to', toTs);

        $.getJSON(`${BASE_URL}/dashboard-filter/chart?type=range&${params.toString()}`, function (res) {
            const { labels, data } = res;

            let type = 'year';
            const diffDays = (toTs - fromTs) / (60 * 60 * 24);
            if (year && month) {
                type = 'month';
            }
            if (diffDays <= 1) {
                type = 'day';
            } else if (diffDays <= 31) {
                type = 'month';
            }

            $('#chartContainer').show();
            updateChart(labels, data, type);
        }).fail(function () {
            Sweet_Alert('error', 'Không thể áp dụng bộ lọc hoặc tải dữ liệu.');
        });
    });

    $('#btn-reset-filter').on('click', function () {
        $('#filter-year').val('');
        $('#filter-month').val('');
        $('#filter-from').val('');
        $('#filter-to').val('');
    });

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
                Sweet_Alert('error', 'Không thể tải danh sách mục lục.');
                if (typeof callback === 'function') callback();
            }
        });
    }

    $('#baiviet').on('click', function () {
        $('#chartContainer').hide();
        $('#showtarget').empty();

        loadMucLucs(() => {
            $('#showtarget').html(`
                <div class="table-responsive p-3">
                    <div class="card-body" id="baiviet-header" style="cursor: pointer; text-align: center;">
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
                                <td>${escapeHtml(item.TieuDe) || ''}</td>
                                <td>${escapeHtml(tenMucLuc)}</td>
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
                    Sweet_Alert('error', 'Không thể tải dữ liệu bài viết.');
                    $('#table_load_baiviet tbody').html('<tr><td colspan="11" class="text-center text-danger">Lỗi khi tải dữ liệu</td></tr>');
                }
            });
        });
    });
});

// Chartist rendering function
function renderChartist(labels, data, type) {
    var defaultLabels = [], defaultData = [];

    if (!labels || labels.length === 0) {
        if (type === 'day') {
            defaultLabels = Array.from({ length: 24 }, (_, i) => i.toString());
            defaultData = Array(24).fill(0);
        } else if (type === 'month') {
            defaultLabels = Array.from({ length: 31 }, (_, i) => (i + 1).toString());
            defaultData = Array(31).fill(0);
        } else if (type === 'year') {
            defaultLabels = Array.from({ length: 12 }, (_, i) => (i + 1).toString());
            defaultData = Array(12).fill(0);
        }
        labels = defaultLabels;
        data = defaultData;
    }

    var title = '';
    if (type === 'day') title = 'Lượt xem theo giờ trong ngày';
    if (type === 'month') title = 'Lượt xem theo ngày trong tháng';
    if (type === 'year') title = 'Lượt xem theo tháng trong năm';

    // Xóa nội dung cũ
    $('#viewsChart').html('').css('height', '300px');
    $('#viewsChart').prepend('<div style="text-align:center;font-weight:bold;margin-bottom:10px;">' + title + '</div>');

    // Vẽ biểu đồ
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

    // Hiện số trên từng điểm
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
}
function updateChart() {
    const year = $('#filter-year').val();
    const month = $('#filter-month').val();
    const fromDay = $('#filter-from').val();
    const toDay = $('#filter-to').val();

    const params = new URLSearchParams();

    let apiUrl = `${BASE_URL}/dashboard-filter/chart?type=range`;
    let title = '';
    let type = 'year'; // default

    // Nếu chỉ có năm → thống kê theo tháng trong năm
    if (year && !month && !fromDay && !toDay) {
        params.append('year', year);
        title = `Lượt xem theo tháng trong năm ${year}`;
        type = 'year';
    }
    // Nếu có năm + tháng, không có from/to → thống kê theo ngày trong tháng
    else if (year && month && !fromDay && !toDay) {
        params.append('year', year);
        params.append('month', month);
        title = `Lượt xem theo ngày trong tháng ${month}/${year}`;
        type = 'month';
    }
    // Nếu có năm + tháng + from/to → thống kê theo khoảng ngày cụ thể
    else if (year && month && fromDay && toDay) {
        const parseDatePartsToUnix = (y, m, d) => {
            if (!y || !m || !d) return null;
            const date = new Date(`${y}-${m.padStart?.(2, '0')}-${d.padStart?.(2, '0')}T00:00:00`);
            return !isNaN(date) ? Math.floor(date.getTime() / 1000) : null;
        };

        const fromTs = parseDatePartsToUnix(year, month, fromDay);
        const toTs = parseDatePartsToUnix(year, month, toDay);

        

        params.append('year', year);
        params.append('month', month);
        params.append('from', fromTs);
        params.append('to', toTs);

        // Xác định type dựa trên khoảng
        const diffDays = (toTs - fromTs) / (60 * 60 * 24);
        if (diffDays <= 1) {
            type = 'day';
            title = `Lượt xem theo giờ trong ngày ${fromDay}/${month}/${year}`;
        } else if (diffDays <= 31) {
            type = 'month';
            title = `Lượt xem theo ngày từ ${fromDay}/${month}/${year} đến ${toDay}/${month}/${year}`;
        } else {
            type = 'year';
            title = `Lượt xem theo tháng từ ${fromDay}/${month}/${year} đến ${toDay}/${month}/${year}`;
        }
    }
    else {
        return;
    }

    // Gửi API
    $.getJSON(`${apiUrl}&${params.toString()}`, function (res) {
        const { labels, data, typeUsed } = res;

        // Nếu API trả typeUsed, ưu tiên lấy title từ typeUsed
        if (typeUsed) {
            if (typeUsed === 'hourly') {
                type = 'day';
                title = `Lượt xem theo giờ trong ngày ${fromDay}/${month}/${year}`;
            } else if (typeUsed === 'daily') {
                type = 'month';
                title = `Lượt xem theo ngày từ ${fromDay}/${month}/${year} đến ${toDay}/${month}/${year}`;
            } else if (typeUsed === 'monthly') {
                type = 'year';
                title = `Lượt xem theo tháng trong năm ${year}`;
            }
        }

        $('#chartContainer').show();
        renderChartist(labels, data, type, title);
    });
}
