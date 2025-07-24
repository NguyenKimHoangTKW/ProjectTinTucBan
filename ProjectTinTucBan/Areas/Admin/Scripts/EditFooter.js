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

    // Validate định dạng ngày "dd/MM/yyyy" cho ô ngày thành lập
    $('#established').on('blur change', function () {
        validateEstablishedDate();
    });

    // Validate số điện thoại: chỉ cho nhập số, khoảng trắng, dấu ngoặc, dấu gạch ngang
    $('#phone').on('input', function () {
        this.value = this.value.replace(/[^0-9\s\-\(\)]/g, '');
    });

    // Hiển thị lỗi số điện thoại khi blur/change
    $('#phone').on('blur change', function () {
        $('.phone-validation-error').remove();
        var value = $(this).val().trim();
        var phoneRegex = /^[0-9\s\-\(\)]+$/;
        var phoneRegex = /^[0-9\s\-\(\)]+$/;
        if (value && !phoneRegex.test(value)) {
            $(this).after('<span class="phone-validation-error text-danger">Số điện thoại phải bắt đầu bằng số 0, chỉ chứa số và có ít nhất 10 chữ số.</span>');
            $(this).addClass('is-invalid');
        } else {
            $(this).removeClass('is-invalid');
        }
    });

    // Validate khi submit form
    $('#editFooterForm').off('submit').on('submit', function (e) {
        // Xóa thông báo lỗi cũ
        $('.phone-validation-error').remove();

        // Kiểm tra định dạng ngày trước khi submit
        var isDateValid = validateEstablishedDate();

        // Kiểm tra số điện thoại trước khi submit
        var phoneValue = $('#phone').val().trim();
        var phoneRegex = /^[0-9\s\-\(\)]+$/;
        var isPhoneValid = true;
        if (!phoneRegex.test(phoneValue)) {
            $('#phone').after('<span class="phone-validation-error text-danger">Số điện thoại phải bắt đầu bằng số 0, chỉ chứa số và có ít nhất 10 chữ số.</span>');
            $('#phone').addClass('is-invalid');
            isPhoneValid = false;
        } else {
            $('#phone').removeClass('is-invalid');
        }

        if (!isDateValid || !isPhoneValid) {
            e.preventDefault();
            return false;
        }
        e.preventDefault();
        var footerId = $('#footerId').val();
        if (footerId) {
            updateFooterById(footerId);
        } else {
            createFooter();
        }
    });

    // Handle delete button click
    $('#btnDelete').off('click').on('click', function () {
        var footerId = $('#footerId').val();
        if (!footerId) {
            Swal.fire({
                icon: 'warning',
                title: 'Không có footer để xóa!',
                text: 'Vui lòng chọn hoặc tải lại trang.',
            });
            return;
        }
        Swal.fire({
            title: 'Bạn có chắc muốn xóa footer này?',
            text: "Hành động này không thể hoàn tác!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Xóa',
            cancelButtonText: 'Hủy'
        }).then((result) => {
            if (result.isConfirmed) {
                deleteFooterById(footerId);
            }
        });
    });
});

function validateEstablishedDate() {
    var $input = $('#established');
    var value = $input.val().trim();
    var dateRegex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;
    if (value && !dateRegex.test(value)) {
        $input.addClass('is-invalid');
        Swal.fire({
            icon: 'warning',
            title: 'Sai định dạng ngày',
            html: "Vui lòng nhập đúng định dạng <b>dd/MM/yyyy</b>.<br>Giá trị '" + value + "' không hợp lệ.",
            showConfirmButton: false,
            timer: 3000,
            position: 'top-end',
            toast: true
        });
        return false;
    } else {
        $input.removeClass('is-invalid');
        return true;
    }
}
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
    $.ajax({
        url: '/api/v1/admin/footer/' + id,
        type: 'GET',
        success: function (data) {
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

            // Xử lý xem trước video
            if (data.VideoUrl && data.VideoUrl.trim() !== '') {
                var embedUrl = getEmbedUrl(data.VideoUrl);
                $('#videoPreview').html(
                    '<iframe class="embed-responsive-item" src="' + embedUrl + '" frameborder="0" allowfullscreen></iframe>'
                );
                $('#videoPreviewContainer').show();
            } else {
                $('#videoPreview').empty();
                $('#videoPreviewContainer').hide();
            }
        }
    });
}

// Lấy danh sách tất cả footer
function loadAllFooters() {
    $.ajax({
        url: '/api/v1/admin/footer',
        type: 'GET',
        success: function (list) {
            // Xử lý hiển thị danh sách nếu cần
        }
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
        url: '/api/v1/admin/footer',
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
        url: '/api/v1/admin/footer/' + id,
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
        url: '/api/v1/admin/footer/' + id,
        type: 'DELETE',
        success: function () {
            Swal.fire({
                icon: 'success',
                title: 'Xóa thành công!',
                showConfirmButton: false,
                timer: 1200
            }).then(() => {
                window.location.href = '/Admin/InterfaceAdmin/Index_Footer';
            });
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