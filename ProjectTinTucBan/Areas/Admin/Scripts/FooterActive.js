$(document).ready(function () {
    $.ajax({
        url: '/api/v1/admin/footer/active',
        type: 'GET',
        success: function (footer) {
            if (footer) {
                $('#fullName').text(footer.FullName || '');
                $('#englishName').text(footer.EnglishName || '');
                $('#established').text(footer.NgayThanhLap ? unixToDateStr(footer.NgayThanhLap) : '');
                $('#address').text(footer.DiaChi || '');
                $('#phone').text(footer.DienThoai || '');
                $('#email').attr('href', 'mailto:' + (footer.Email || '')).text(footer.Email || '');
                $('#footerCopyright').text(footer.FooterCopyright || '');
                $('#footerNote').text(footer.FooterNote || '');
                if (footer.VideoUrl) {
                    var embedUrl = getEmbedUrl(footer.VideoUrl);
                    $('#video').attr('src', embedUrl);
                    $('#popupVideo').attr('src', embedUrl);
                }
            }
        }
    });

    // Xử lý sự kiện click nút "Chi Tiết"
    $('#btnChiTiet').on('click', function (e) {
        e.preventDefault();
        window.location.href = 'https://bdbcl.tdmu.edu.vn/danh-muc/Gioi-thieu/gioi-thieu-chung';
    });
    // Xử lý sự kiện click vào email để copy vào clipboard
    $('#email').on('click', function (e) {
        e.preventDefault();
        var email = $(this).text().trim();
        if (email) {
            navigator.clipboard.writeText(email).then(function () {
                $('#emailCopiedMsg').text('Đã copy').show();
                setTimeout(function () {
                    $('#emailCopiedMsg').fadeOut();
                }, 2000);
            });
        }
    });

    // Xử lý sự kiện click "Watch Video" để hiện modal xem video
    $('#btnWatchVideo').on('click', function (e) {
        e.preventDefault();
        // Đảm bảo src của popupVideo luôn đúng (nếu cần)
        $('#popupVideo').attr('src', $('#video').attr('src'));
        $('#videoModal').removeClass('hidden');
    });

    // Đóng modal khi bấm nút đóng hoặc click ra ngoài
    $('#closeVideoModal').on('click', function () {
        $('#videoModal').addClass('hidden');
        $('#popupVideo').attr('src', ''); // Xóa src để dừng video
    });
    $('#videoModal').on('click', function (e) {
        if (e.target === this) {
            $(this).addClass('hidden');
            $('#popupVideo').attr('src', '');
        }
    });
    // Đóng modal khi nhấn phím ESC
    $(document).on('keydown', function (e) {
        if (e.key === "Escape" && !$('#videoModal').hasClass('hidden')) {
            $('#videoModal').addClass('hidden');
            $('#popupVideo').attr('src', '');
        }
    });
    function unixToDateStr(unix) {
        if (!unix || isNaN(unix)) return '';
        var d = new Date(unix * 1000);
        var day = ('0' + d.getUTCDate()).slice(-2);
        var month = ('0' + (d.getUTCMonth() + 1)).slice(-2);
        var year = d.getUTCFullYear();
        return day + '/' + month + '/' + year;
    }

    function getEmbedUrl(url) {
        if (!url) return '';
        if (url.includes('embed')) return url;
        var match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([^\?&"'>]+)/);
        if (match && match[1]) {
            return 'https://www.youtube.com/embed/' + match[1];
        }
        return url;
    }
});