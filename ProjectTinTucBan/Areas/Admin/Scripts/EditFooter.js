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

// Tự động load dữ liệu footer cho giao diện người dùng
$(function () {
    if ($('#footerCopyright').length) {
        fetch('/api/FooterApi/1')
            .then(response => response.json())
            .then(data => {
                $('#video').attr('src', data.VideoUrl);
                $('#fullName').text(data.FullName);
                $('#englishName').html(data.EnglishName.replaceAll(',', '<br>'));
                $('#established').text(unixToDateStr(data.NgayThanhLap));
                $('#address').text(data.DiaChi);
                $('#phone').text(data.DienThoai);
                $('#email').text(data.Email).attr('href', 'mailto:' + data.Email);
                $('#footerCopyright').text(data.FooterCopyright || "");
                $('#footerNote').text(data.FooterNote || "");

                // Xử lý play video khi nhấn "Watch Video" (hiện popup)
                $('#btnWatchVideo').on('click', function (e) {
                    e.preventDefault();
                    var modal = $('#videoModal');
                    var popupVideo = $('#popupVideo');
                    var url = data.VideoUrl;
                    if (!url.includes('autoplay=1')) {
                        url += (url.includes('?') ? '&' : '?') + 'autoplay=1';
                    }
                    popupVideo.attr('src', url);
                    modal.removeClass('hidden');
                });
            });
    }
});

// Xử lý cuộn lên đầu trang nếu hash là "#saved"
$(function () {
    if (window.location.hash === "#saved") {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        history.replaceState(null, null, " ");
    }
});

// CRUD cho giao diện quản trị
$(document).ready(function () {
    // Nếu giá trị ngày thành lập là số (unix timestamp), chuyển sang chuỗi ngày
    var ngayValue = $("input[name='established']").val();
    if (ngayValue && !ngayValue.includes('/')) {
        var asInt = parseInt(ngayValue);
        if (!isNaN(asInt) && asInt > 10000) {
            $("input[name='established']").val(unixToDateStr(asInt));
        }
    }

    // Xử lý sự kiện submit form
    $("#editFooterForm").off("submit").on("submit", function (e) {
        e.preventDefault();

        var footerId = $("#footerId").val();
        var method = footerId ? "PUT" : "POST";
        var url = footerId ? "/api/FooterApi/" + footerId : "/api/FooterApi";

        var ngayThanhLapUnix = parseDateToUnix($("input[name='established']").val());

        var formData = {
            ID: footerId ? parseInt(footerId) : 0,
            FullName: $("input[name='fullName']").val(),
            EnglishName: $("input[name='englishName']").val(),
            NgayThanhLap: ngayThanhLapUnix,
            DiaChi: $("input[name='address']").val(),
            DienThoai: $("input[name='phone']").val(),
            Email: $("input[name='email']").val(),
            VideoUrl: $("input[name='videoUrl']").val(),
            FooterCopyright: $("input[name='footerCopyright']").val(),
            FooterNote: $("input[name='footerNote']").val()
        };

        $.ajax({
            url: url,
            type: method,
            contentType: "application/json",
            data: JSON.stringify(formData),
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
                if (!footerId) {
                    $("#footerId").val(response.ID);
                }
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
    });

    // Xử lý sự kiện xóa
    $("#btnDelete").off("click").on("click", function () {
        var footerId = $("#footerId").val();
        if (!footerId) {
            $("#alert-error .alert-message").text("Không có dữ liệu để xóa!");
            $("#alert-error").show().delay(3000).fadeOut();
            return;
        }

        if (confirm("Bạn có chắc chắn muốn xóa footer này?")) {
            $.ajax({
                url: "/api/FooterApi/" + footerId,
                type: "DELETE",
                success: function () {
                    $("#alert-success .alert-message").text("Xóa thành công!");
                    $("#alert-success").show();
                    $("#editFooterForm")[0].reset();
                    $("#footerId").val("");
                },
                error: function (xhr) {
                    var errorMsg = "Lỗi: " + xhr.status + " - " + xhr.statusText;
                    $("#alert-error .alert-message").html(errorMsg);
                    $("#alert-error").show().delay(3000).fadeOut();
                }
            });
        }
    });

    // Lấy Footer theo ID (GET)
    window.loadFooter = function (id) {
        $.get('/api/admin/footerapi/' + id, function (data) {
            $('input[name="fullName"]').val(data.FullName);
            $('input[name="englishName"]').val(data.EnglishName);
            $('input[name="established"]').val(unixToDateStr(data.NgayThanhLap));
            $('input[name="address"]').val(data.DiaChi);
            $('input[name="phone"]').val(data.DienThoai);
            $('input[name="email"]').val(data.Email);
            $('input[name="videoUrl"]').val(data.VideoUrl);
            $('input[name="footerCopyright"]').val(data.FooterCopyright);
            $('input[name="footerNote"]').val(data.FooterNote);
        });
    }

    // Lấy danh sách Footer (GET ALL)
    window.loadAllFooters = function () {
        $.get('/api/admin/footerapi', function (list) {
            // Xử lý hiển thị danh sách nếu cần
        });
    }

    // Thêm mới Footer (POST)
    window.createFooter = function () {
        var data = {
            FullName: $('input[name="fullName"]').val(),
            EnglishName: $('input[name="englishName"]').val(),
            NgayThanhLap: parseDateToUnix($('input[name="established"]').val()),
            DiaChi: $('input[name="address"]').val(),
            DienThoai: $('input[name="phone"]').val(),
            Email: $('input[name="email"]').val(),
            VideoUrl: $('input[name="videoUrl"]').val(),
            FooterCopyright: $('input[name="footerCopyright"]').val(),
            FooterNote: $('input[name="footerNote"]').val()
        };
        $.ajax({
            url: '/api/admin/footerapi',
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
});

// ==== Đoạn code chuyển từ Index.cshtml sang ====
function toSlug(str) {
    return str.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}

function formatDate(yyyymmdd) {
    if (!yyyymmdd || yyyymmdd.toString().length !== 8) return '';
    const str = yyyymmdd.toString();
    return `${str.substring(6, 8)}/${str.substring(4, 6)}/${str.substring(0, 4)}`;
}

new Swiper(".mySwiper", {
    loop: true,
    autoplay: { delay: 3000, disableOnInteraction: false },
    pagination: { el: ".swiper-pagination", clickable: true },
    navigation: { nextEl: ".swiper-button-next", prevEl: ".swiper-button-prev" }
});

window.mucLucData = {};
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
        window.open('https://bdbcl.tdmu.edu.vn/danh-muc/Gioi-thieu/gioi-thieu-chung', '_blank');
    });
});