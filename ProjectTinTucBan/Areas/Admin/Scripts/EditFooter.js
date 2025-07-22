// Swiper và các sự kiện giao diện
new Swiper(".mySwiper", {
    loop: true,
    autoplay: { delay: 3000, disableOnInteraction: false },
    pagination: { el: ".swiper-pagination", clickable: true },
    navigation: { nextEl: ".swiper-button-next", prevEl: ".swiper-button-prev" }
});

window.mucLucData = {};

$(document).ready(function () {
    // Nếu giá trị ngày thành lập là số (unix timestamp), chuyển sang chuỗi ngày
    var ngayValue = $('#established').val();
    if (ngayValue && !ngayValue.includes('/')) {
        var asInt = parseInt(ngayValue);
        if (!isNaN(asInt) && asInt > 10000) {
            $('#established').val(unixToDateStr(asInt));
        }
    }

    $('#editFooterForm').off('submit').on('submit', function (e) {
        e.preventDefault();
        var footerId = $('#footerId').val();
        if (footerId) {
            updateFooterById(footerId);
        } else {
            createFooter();
        }
    });

    $('#btnDelete').off('click').on('click', function () {
        var footerId = $('#footerId').val();
        if (!footerId) {
            $('#alert-error .alert-message').text('Không có dữ liệu để xóa!');
            $('#alert-error').show().delay(3000).fadeOut();
            return;
        }
        if (confirm('Bạn có chắc chắn muốn xóa footer này?')) {
            deleteFooterById(footerId);
        }
    });

    // Render video preview bằng JS nếu có videoUrl
    var videoUrl = $('#videoUrl').val();
    if (videoUrl && videoUrl.trim() !== '') {
        var embedUrl = getEmbedUrl(videoUrl);
        $('#videoPreview').html(
            '<iframe class="embed-responsive-item" src="' + embedUrl + '" frameborder="0" allowfullscreen></iframe>'
        );
    }
});

$(document).ready(function () {
    $('#closeVideoModal').on('click', function () {
        $('#videoModal').addClass('hidden');
        $('#popupVideo').attr('src', '');
    });

    $('#videoModal').on('click', function (e) {
        if (e.target === this) {
            $(this).addClass('hidden');
            $('#popupVideo').attr('src', '');
        }
    });

    $('#btnChiTiet').on('click', function (e) {
        e.preventDefault();
        window.open('https://bdbcl.tdmu.edu.vn/danh-muc/Gioi-thieu/gioi-thieu-chung');
    });

    // Tự động load thông tin footer và giới thiệu lên trang Index (chỉ chạy 1 lần, không lặp)
    if ($('#fullName').length && $('#footerCopyright').length) {
        $.get('/api/FooterApi/active', function (footer) {
            if (footer) {
                $('#fullName').text(footer.FullName || '');
                $('#englishName').text(footer.EnglishName || '');
                if (footer.NgayThanhLap && !isNaN(footer.NgayThanhLap)) {
                    var d = new Date(footer.NgayThanhLap * 1000);
                    var day = ('0' + d.getUTCDate()).slice(-2);
                    var month = ('0' + (d.getUTCMonth() + 1)).slice(-2);
                    var year = d.getUTCFullYear();
                    $('#established').text(day + '/' + month + '/' + year);
                } else {
                    $('#established').text('');
                }
                $('#address').text(footer.DiaChi || '');
                $('#phone').text(footer.DienThoai || '');
                $('#email').attr('href', 'mailto:' + (footer.Email || '')).text(footer.Email || '');
                if (footer.VideoUrl) {
                    var embedUrl = toEmbedYoutubeUrl(footer.VideoUrl);
                    $('#video').attr('src', embedUrl);
                    $('#popupVideo').attr('src', embedUrl);
                }
                $('#footerCopyright').text(footer.FooterCopyright || '');
                $('#footerNote').text(footer.FooterNote || '');
            }
        });

        // Nút xem video mở modal
        $('#btnWatchVideo').on('click', function (e) {
            e.preventDefault();
            $('#videoModal').removeClass('hidden');
        });
        $('#closeVideoModal').on('click', function () {
            $('#videoModal').addClass('hidden');
            $('#popupVideo').attr('src', '');
        });
        $('#videoModal').on('click', function (e) {
            if (e.target === this) {
                $(this).addClass('hidden');
                $('#popupVideo').attr('src', '');
            }
        });
    }
});

// Chuyển "dd/MM/yyyy" sang Unix timestamp (UTC 00:00:00)
function parseDateToUnix(dateStr) {
    if (!dateStr) return null;
    var parts = dateStr.split('/');
    if (parts.length !== 3) return null;
    var d = new Date(Date.UTC(parts[2], parts[1] - 1, parts[0], 0, 0, 0));
    if (isNaN(d.getTime())) return null;
    return Math.floor(d.getTime() / 1000);
}

// Chuyển Unix timestamp sang "dd/MM/yyyy" (UTC)
function unixToDateStr(unix) {
    if (!unix || isNaN(unix)) return '';
    var d = new Date(unix * 1000);
    var day = ('0' + d.getUTCDate()).slice(-2);
    var month = ('0' + (d.getUTCMonth() + 1)).slice(-2);
    var year = d.getUTCFullYear();
    return day + '/' + month + '/' + year;
}

// Lấy dữ liệu footer theo ID và hiển thị lên form
function loadFooterById(id) {
    $.get('/api/FooterApi/' + id, function (data) {
        $('#footerId').val(data.ID);
        $('#fullName').val(data.FullName);
        $('#englishName').val(data.EnglishName);
        $('#established').val(unixToDateStr(data.NgayThanhLap));
        $('#address').val(data.DiaChi);
        $('#phone').val(data.DienThoai);
        $('#email').val(data.Email);
        $('#videoUrl').val(data.VideoUrl);
        $('#footerCopyright').val(data.FooterCopyright);
        $('#footerNote').val(data.FooterNote);
    });
}

// Lấy danh sách tất cả footer
function loadAllFooters() {
    $.get('/api/FooterApi', function (list) {
        // Xử lý hiển thị danh sách nếu cần
    });
}

// Thêm mới footer
function createFooter() {
    var data = {
        FullName: $('#fullName').val(),
        EnglishName: $('#englishName').val(),
        NgayThanhLap: parseDateToUnix($('#established').val()),
        DiaChi: $('#address').val(),
        DienThoai: $('#phone').val(),
        Email: $('#email').val(),
        VideoUrl: $('#videoUrl').val(),
        FooterCopyright: $('#footerCopyright').val(),
        FooterNote: $('#footerNote').val()
    };
    $.ajax({
        url: '/api/FooterApi',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(data),
        success: function (res) {
            $('#alert-success').text('Thêm mới thành công!').show();
            $('#alert-error').hide();
        },
        error: function () {
            $('#alert-error').text('Có lỗi xảy ra khi thêm mới!').show();
            $('#alert-success').hide();
        }
    });
}

// Cập nhật footer theo ID
function updateFooterById(id) {
    var data = {
        ID: id,
        FullName: $('#fullName').val(),
        EnglishName: $('#englishName').val(),
        NgayThanhLap: parseDateToUnix($('#established').val()),
        DiaChi: $('#address').val(),
        DienThoai: $('#phone').val(),
        Email: $('#email').val(),
        VideoUrl: $('#videoUrl').val(),
        FooterCopyright: $('#footerCopyright').val(),
        FooterNote: $('#footerNote').val()
    };
    $.ajax({
        url: '/api/FooterApi/' + id,
        type: 'PUT',
        contentType: 'application/json',
        data: JSON.stringify(data),
        success: function (response) {
            Swal.fire({
                icon: 'success',
                title: 'Đã lưu thành công!',
                showConfirmButton: false,
                timer: 1500
            }).then(() => {
                window.location.hash = "saved";
                location.reload();
            });
        },
        error: function (xhr) {
            var errorMsg = "Lỗi: " + xhr.status + " - " + xhr.statusText;
            Swal.fire({
                icon: 'error',
                title: 'Lỗi',
                text: errorMsg
            });
        }
    });
}

// Xóa footer theo ID
function deleteFooterById(id) {
    $.ajax({
        url: '/api/FooterApi/' + id,
        type: 'DELETE',
        success: function () {
            $('#alert-success').text('Xóa thành công!').show();
            $('#footerId').val('');
        },
        error: function (xhr) {
            var errorMsg = "Lỗi: " + xhr.status + " - " + xhr.statusText;
            $('#alert-error').html(errorMsg).show().delay(3000).fadeOut();
        }
    });
}

// Hàm chuyển đổi link YouTube thường/thường rút gọn/thường shorts sang link nhúng
function toEmbedYoutubeUrl(url) {
    if (!url) return '';
    // Nếu đã là link nhúng thì trả về luôn
    if (url.includes('youtube.com/embed/') || url.includes('youtu.be/embed/')) return url;

    // Nếu là link youtu.be
    var match = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
        return 'https://www.youtube.com/embed/' + match[1];
    }

    // Nếu là link youtube.com/watch?v=...
    match = url.match(/v=([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
        return 'https://www.youtube.com/embed/' + match[1];
    }

    // Nếu là link youtube.com/shorts/...
    match = url.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
        return 'https://www.youtube.com/embed/' + match[1];
    }

    // Trả về nguyên bản nếu không nhận diện được
    return url;
}

// Chuyển đổi link YouTube sang link nhúng (di chuyển từ Razor C# GetEmbedUrl)
function getEmbedUrl(url) {
    if (!url) return '';
    if (url.includes('embed')) return url;
    var match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([^\?&"'>]+)/);
    if (match && match[1]) {
        return 'https://www.youtube.com/embed/' + match[1];
    }
    return url;
}

// Các hàm tiện ích khác
function toSlug(str) {
    return str.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}

function formatDate(yyyymmdd) {
    if (!yyyymmdd || yyyymmdd.toString().length !== 8) return '';
    const str = yyyymmdd.toString();
    return `${str.substring(6, 8)}/${str.substring(4, 6)}/${str.substring(0, 4)}`;
}
