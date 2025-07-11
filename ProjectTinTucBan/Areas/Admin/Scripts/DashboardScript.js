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
    // Update statistics
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

    // Click handlers for showing chart
    $('#day').parent().click(function () {
        showChart('day');
    });
    $('#month').parent().click(function () {
        showChart('month');
    });
    $('#year').parent().click(function () {
        showChart('year');
    });

    // Hide chart when clicking outside
    $(document).on('click', function (e) {
        if ($(e.target).closest('#chartContainer, #stat-day-views, #stat-month-views, #stat-year-views').length === 0) {
            $('#chartContainer').hide();
        }
    });

    // Show daily chart by default
    
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