// Swiper init
new Swiper(".mySwiper", {
    loop: true,
    autoplay: { delay: 3000, disableOnInteraction: false },
    pagination: { el: ".swiper-pagination", clickable: true },
    navigation: { nextEl: ".swiper-button-next", prevEl: ".swiper-button-prev" }
});

const mucId = window.mucIdFromView || 0;
let allPosts = [];
let currentPage = 1;
const perPage = 6;

function escapeHtml(text) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function formatDate(unixTimestamp) {
    if (!unixTimestamp) return "N/A";
    const date = new Date(unixTimestamp * 1000);
    const day = ("0" + date.getDate()).slice(-2);
    const month = ("0" + (date.getMonth() + 1)).slice(-2);
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

function renderThongBao() {
    const list = $("#tinTucList");
    const sortedByDate = [...allPosts].sort((a, b) => (b.NgayDang ?? 0) - (a.NgayDang ?? 0)).slice(0, 5);
    const sortedByViews = [...allPosts].sort((a, b) => (b.LuotXem ?? 0) - (a.LuotXem ?? 0)).slice(0, 5);

    let html = `<div class="grid grid-cols-1 md:grid-cols-3 md:gap-10 gap-6">
        <div class="md:col-span-2">
            <h2 class="text-xl font-bold text-gray-800 mb-4">Bài viết mới</h2>
            <div class="space-y-4">`;

    sortedByDate.forEach(post => {
        const date = formatDate(post.NgayDang);
        const thumb = post.LinkThumbnail || "/images/thong-bao-icon.png";
        const tieuDe = escapeHtml(post.TieuDe || "Không có tiêu đề").toUpperCase();
        const views = post.LuotXem ?? 0;

        html += `
            <div class="bg-white rounded shadow hover:shadow-md overflow-hidden flex flex-col sm:flex-row gap-4 my-4">
                <img src="${thumb}" class="w-full sm:w-40 h-32 object-cover flex-shrink-0" alt="Thumb">
                <div class="p-3 flex flex-col">
                    <a href="/noi-dung/${post.ID}" class="font-semibold text-base text-blue-800 hover:underline leading-snug line-clamp-2">${tieuDe}</a>
                    <div class="text-sm text-gray-500 mt-2 flex items-center gap-3">
                        <span><i class="far fa-calendar-alt mr-1"></i>${date}</span>
                        <span><i class="far fa-eye mr-1"></i>${views} lượt xem</span>
                    </div>
                </div>
            </div>`;
    });

    html += `</div></div>
        <div class="bg-white rounded shadow p-4">
            <h2 class="text-xl font-bold text-red-600 border-b pb-2 mb-4">Bài được xem nhiều</h2>`;

    sortedByViews.forEach(post => {
        const date = formatDate(post.NgayDang);
        const views = post.LuotXem ?? 0;
        const tieuDe = escapeHtml(post.TieuDe || "Không có tiêu đề").toUpperCase();

        html += `
            <div class="pb-2 mb-2 border-b border-gray-200">
                <a href="/noi-dung/${post.ID}" class="text-sm font-medium text-gray-800 hover:text-blue-600 block leading-snug line-clamp-2">${tieuDe}</a>
                <div class="text-xs text-gray-500 mt-1 flex gap-3">
                    <span><i class="far fa-calendar-alt mr-1"></i>${date}</span>
                    <span><i class="far fa-eye mr-1"></i>${views} lượt xem</span>
                </div>
            </div>`;
    });

    html += `</div></div>`;
    list.append(html);
    $("#btnXemThemWrapper").addClass("hidden");
}

function renderPosts() {
    const list = $("#tinTucList");
    const start = (currentPage - 1) * perPage;
    const end = currentPage * perPage;
    const postsToRender = allPosts.slice(start, end);
    let html = "";

    postsToRender.forEach(post => {
        const date = formatDate(post.NgayDang);
        const thumb = post.LinkThumbnail || "/images/default.jpg";
        const tieuDe = escapeHtml(post.TieuDe || "Không có tiêu đề").toUpperCase();

        html += `
            <div class="bg-white rounded-lg shadow-md hover:shadow-lg transition overflow-hidden flex flex-col h-full">
                <img src="${thumb}" class="w-full h-[200px] object-cover" alt="Ảnh">
                <div class="p-4 flex flex-col flex-1">
                    <a href="/noi-dung/${post.ID}" class="text-base font-semibold text-gray-800 hover:text-blue-600 leading-snug line-clamp-2 mb-2">${tieuDe}</a>
                    <p class="text-sm text-gray-500 mt-auto"><i class="fa-regular fa-calendar-days mr-1"></i>${date}</p>
                </div>
            </div>`;
    });

    list.append(html);
    if (end >= allPosts.length) {
        $("#btnXemThemWrapper").addClass("hidden");
    } else {
        $("#btnXemThemWrapper").removeClass("hidden");
    }
}

window.addEventListener("pageshow", function (event) {
    if (event.persisted) {
        window.location.reload();
    }
});

$(document).ready(function () {
    $.get("/api/v1/home/get-slider", function (data) {
        let html = "";
        data.forEach(slider => {
            html += `
                <div class="swiper-slide flex items-center justify-center">
                    <img src="${slider.LinkHinh}" class="w-full h-[400px] object-contain rounded-md mx-auto flex items-center justify-center" alt="Banner ${slider.ID}" />
                </div>`;
        });
        $("#slider-container").html(html);
        setTimeout(function () {
            new Swiper(".mySwiper", {
                loop: true,
                autoplay: { delay: 3000, disableOnInteraction: false },
                navigation: { nextEl: ".swiper-button-next", prevEl: ".swiper-button-prev" }
            });
        }, 0);
    });

    $.get("/api/v1/home/get-mucluc-with-baiviet", function (res) {
        if (!res.success || !res.data) {
            $("#tinTucList").html("<p class='col-span-3 text-center text-gray-500'>Không có dữ liệu.</p>");
            return;
        }
        const muc = res.data.find(m => m.ID === mucId);
        if (!muc || !muc.BaiViets || muc.BaiViets.length === 0) {
            $("#tinTucList").html("<p class='col-span-3 text-center text-gray-500'>Không có bài viết nào trong mục này.</p>");
            return;
        }

        window.mucTen = muc.Ten;
        $("#tenMucLuc").text((muc.TenMucLuc || "Không rõ").toUpperCase());
        allPosts = muc.BaiViets;
        const isThongBao = (window.mucTen || "").toLowerCase().includes("thông báo");
        if (isThongBao) renderThongBao();
        else renderPosts();
    });

    $("#btnXemThem").on("click", function () {
        currentPage++;
        renderPosts();
    });
});