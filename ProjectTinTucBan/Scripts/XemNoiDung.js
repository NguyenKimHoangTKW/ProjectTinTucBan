function formatDate(unixTimestamp) {
    if (!unixTimestamp) return "N/A";

    const date = new Date(unixTimestamp * 1000);
    const weekdays = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    const dayOfWeek = weekdays[date.getDay()];
    const day = ("0" + date.getDate()).slice(-2);
    const month = ("0" + (date.getMonth() + 1)).slice(-2);
    const year = date.getFullYear();

    return `${dayOfWeek}, ${day}-${month}-${year}`;
}

function convertImagePaths(content) {
    const baseUrl = "https://bdbcl.tdmu.edu.vn";
    return content.replace(/src="\/img/g, `src="${baseUrl}/img`);
}

function hasViewedToday(postId) {
    const key = `viewed_${postId}`;
    const lastView = localStorage.getItem(key);
    const today = new Date().toISOString().slice(0, 10);
    return lastView === today;
}

function markViewed(postId) {
    const key = `viewed_${postId}`;
    const today = new Date().toISOString().slice(0, 10);
    localStorage.setItem(key, today);
}

function escapeHtml(text) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function toSlug(str) {
    return str.toLowerCase()
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
}

$(document).on("click", "aside a", function (e) {
    e.preventDefault();
    const newUrl = $(this).attr("href");
    window.location.href = newUrl;
});

document.addEventListener("DOMContentLoaded", function () {
    const postId = window.postId;

    setTimeout(function () {
        fetch(`/api/v1/admin/increase-views/${postId}`, { method: 'POST' })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    console.log("Đã tăng lượt xem:", data.viewCount);
                }
            })
            .catch(err => console.error("Lỗi tăng lượt xem:", err));
    }, 15000);
});

$(document).ready(function () {
    const urlParts = window.location.pathname.split('/');
    const id = urlParts[urlParts.length - 1];

    $.ajax({
        url: `/api/v1/admin/get-baiviet-by-id/${id}`,
        method: "GET",
        success: function (res) {
            if (!res.success || !res.data) {
                $("#baivietContainer").html("<p class='text-center text-gray-500'>Không tìm thấy bài viết.</p>");
                $("#tenMucLuc").text("Không rõ");
                return;
            }

            const bv = res.data;
            const thumb = bv.LinkThumbnail?.trim()
                ? bv.LinkThumbnail
                : "https://th.bing.com/th/id/OIP.FkEdh0U5AttOx7kx74Y6sQAAAA?w=460";
            const ngayDang = formatDate(bv.NgayDang);
            const noiDungChuan = convertImagePaths(bv.NoiDung);

            const breadcrumb = `
                <nav class="flex flex-wrap gap-x-1">
                    <a href="/" class="text-blue-700 hover:underline">Trang chủ</a>
                    <span>›</span>
                    <a href="/" class="text-blue-700 hover:underline scroll-to" data-target="${toSlug(bv.TenMucLuc)}">
                        ${bv.TenMucLuc}
                    </a>
                    <span>›</span>
                    <span class="text-blue-700 font-medium break-words">${escapeHtml((bv.TieuDe ?? '').toUpperCase())}</span>
                </nav>
            `;

            const pdfBlock = bv.LinkPDF?.trim()
                ? `<div class="mt-6">
                        <p class="text-base font-semibold text-gray-700 mb-2">📄 Tài liệu đính kèm:</p>
                        <embed src="${bv.LinkPDF}" type="application/pdf" class="rounded border shadow w-full" />
                        <div class="text-sm text-gray-500 mt-2">
                            Nếu không hiển thị, <a href="${bv.LinkPDF}" class="text-blue-600 hover:underline" target="_blank">nhấn vào đây để tải về</a>.
                        </div>
                    </div>` : '';

            $("#breadcrumbContainer").html(breadcrumb);

            const html = `
                <h1 class="text-2xl md:text-3xl font-bold text-center text-blue-800 mb-6 uppercase">
                    ${escapeHtml((bv.TieuDe ?? '').toUpperCase())}
                </h1>
                <p class="text-sm text-gray-500 mb-4">
                    <i class="fa-regular fa-calendar-days mr-1"></i>Ngày đăng: ${ngayDang}
                </p>
                <div class="mb-4">
                    <img src="${thumb}" alt="Thumbnail" class="w-full max-w-xl mx-auto h-auto rounded shadow mb-6" />
                </div>
                <div class="noi-dung-bai-viet text-justify leading-relaxed max-w-none">
                    ${noiDungChuan}
                    ${pdfBlock}
                    <div class="mt-8 pt-4 border-t border-gray-200">
                        <p class="text-sm font-semibold text-gray-600 mb-2">🔗 Chia sẻ bài viết:</p>
                        <div class="flex flex-wrap gap-3 text-sm">
                            <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}"
                               target="_blank"
                               class="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">
                                <i class="fab fa-facebook-f"></i> Facebook
                            </a>
                            <a href="https://www.instagram.com/"
                               target="_blank"
                               class="flex items-center gap-2 px-3 py-2 bg-pink-500 text-white rounded hover:bg-pink-600 transition">
                                <i class="fab fa-instagram"></i> Instagram
                            </a>
                            <button onclick="navigator.clipboard.writeText(window.location.href)"
                               class="flex items-center gap-2 px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition">
                                <i class="fas fa-copy"></i> Sao chép liên kết
                            </button>
                        </div>
                    </div>
                </div>
            `;

            $("#baivietContainer").html(html);
            $("#tenMucLuc").replaceWith(`
                <p id="tenMucLuc" class="text-red-700 font-bold text-xl uppercase mb-2">
                    ${bv.TenMucLuc?.trim() || "Không rõ"}
                </p>
            `);

            if (Array.isArray(bv.BaiVietsCungMuc) && bv.BaiVietsCungMuc.length > 0) {
                const baiVietKhac = bv.BaiVietsCungMuc
                    .filter(item => item.ID !== bv.ID)
                    .sort(() => Math.random() - 0.5)
                    .slice(0, 5);

                let htmlList = `<div class="space-y-6">`;

                baiVietKhac.forEach(item => {
                    const tieuDe = escapeHtml((item.TieuDe || "Không có tiêu đề").toUpperCase());
                    const thumb = item.LinkThumbnail?.trim() || "https://navigates.vn/wp-content/uploads/2023/06/logo-dai-hoc-thu-dau-mot.jpg";
                    const ngayDang = formatDate(bv.NgayDang); // ✅ đúng đối tượng

                    htmlList += `
        <div class="border border-gray-200 rounded-md p-3 my-4 hover:shadow-md transition">
            <a href="/bai-viet/${item.ID}">
                <img src="${thumb}" class="w-full h-auto rounded-md shadow-sm mb-4 object-contain" alt="Ảnh liên quan">
            </a>
            <a href="/bai-viet/${item.ID}" class="block font-semibold text-base text-gray-800 hover:text-red-600 leading-snug line-clamp-2 mb-1">
                ${tieuDe}
            </a>
            <p class="text-sm text-gray-500 mb-4">
                📅${ngayDang}
            </p>
        </div>`;
                });

                htmlList += `</div>`;
                $("#mucLucBaiViet").html(htmlList);
            }
        },
        error: function () {
            $("#baivietContainer").html("<p class='text-center text-red-500'>Không thể tải bài viết.</p>");
            $("#tenMucLuc").text("Không rõ");
        }
    });
});

// Xử lý scroll khi click vào các thẻ có class scroll-to
$(document).on("click", ".scroll-to", function (e) {
    const slug = $(this).data("target");
    if (window.location.pathname !== "/") {
        localStorage.setItem("scrollToSlug", slug);
        return;
    }
    e.preventDefault();
    const offset = $(`#${slug}`).offset()?.top;
    if (offset) {
        $("html, body").animate({ scrollTop: offset - 100 }, 500);
    }
});

// Nếu trở về từ nút Back, reload lại trang để cập nhật
window.addEventListener("pageshow", function (event) {
    if (event.persisted) {
        window.location.reload();
    }
});

// Khi vào trang chủ, nếu có slug đã lưu thì scroll đến đó
$(document).ready(function () {
    const savedSlug = localStorage.getItem("scrollToSlug");
    if (savedSlug) {
        setTimeout(() => {
            const target = $(`#${savedSlug}`);
            if (target.length) {
                $("html, body").animate({
                    scrollTop: target.offset().top - 100
                }, 500);
            }
            localStorage.removeItem("scrollToSlug");
        }, 400);
    }
});
