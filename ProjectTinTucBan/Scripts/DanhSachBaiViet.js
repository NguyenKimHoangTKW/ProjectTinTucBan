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

function renderTinTucItem(post) {
    if (!post) return "";
    const date = formatDate(post.NgayDang);
    const thumb = post.LinkThumbnail || "/images/default.jpg";
    const tieuDe = escapeHtml(post.TieuDe || "Không có tiêu đề").toUpperCase();

    return `
        <div class="bg-white rounded-lg shadow hover:shadow-lg overflow-hidden flex flex-col h-full">
            <img src="${thumb}" class="w-full h-[160px] object-cover" alt="Ảnh">
            <div class="p-3 flex flex-col flex-1">
                <a href="/noi-dung/${post.ID}" class="text-sm font-semibold text-gray-800 hover:text-red-500 leading-snug line-clamp-2 mb-1">${tieuDe}</a>
                <p class="text-xs text-gray-500 mt-auto"><i class="fa-regular fa-calendar-days mr-1"></i>${date}</p>
            </div>
        </div>`;
}

function renderPosts() {
    const list = $("#tinTucList");
    const start = (currentPage - 1) * perPage;
    const end = currentPage * perPage;
    const postsToRender = allPosts.slice(start, end);

    const isTinTuc = window.mucTen === "Tin tức";
    let html = "";

    if (isTinTuc && currentPage === 1) {
        const leftTop = postsToRender[0];
        const rightTop = postsToRender[1];
        const leftBottom = postsToRender[2];
        const rightBottom = postsToRender[3];
        const sideList = allPosts.slice(4, 10);

        html += `<div class="grid grid-cols-3 gap-6">
            <div class="col-span-2 grid grid-cols-2 gap-6">
                <div>${renderTinTucItem(leftTop)}</div>
                <div>${renderTinTucItem(rightTop)}</div>
                <div>${renderTinTucItem(leftBottom)}</div>
                <div>${renderTinTucItem(rightBottom)}</div>
            </div>
            <div class="col-span-1 bg-white p-4 rounded shadow">
                <h3 class="text-lg font-semibold text-red-600 border-b pb-2 mb-4">Tin nổi bật</h3>
                <ul class="space-y-2">`;

        sideList.forEach(post => {
            html += `
                <li>
                    <a href="/noi-dung/${post.ID}" class="text-sm text-gray-800 hover:text-red-500 block font-medium line-clamp-2">${escapeHtml(post.TieuDe || "Không có tiêu đề").toUpperCase()}</a>
                    <span class="text-xs text-gray-500">${formatDate(post.NgayDang)}</span>
                </li>`;
        });

        html += `</ul></div></div>`;
    } else {
        postsToRender.forEach(bv => {
            const date = formatDate(bv.NgayDang);
            const thumb = bv.LinkThumbnail || "/images/default.jpg";
            const tieuDe = escapeHtml(bv.TieuDe || "Không có tiêu đề").toUpperCase();

            html += `
                <div class="bg-white rounded-lg shadow-md hover:shadow-lg transition overflow-hidden flex flex-col h-full">
                    <img src="${thumb}" class="w-full h-[200px] object-cover" alt="Ảnh">
                    <div class="p-4 flex flex-col flex-1">
                        <a href="/noi-dung/${bv.ID}" class="text-base font-semibold text-gray-800 hover:text-blue-600 leading-snug line-clamp-2 mb-2">${tieuDe}</a>
                        <p class="text-sm text-gray-500 mt-auto"><i class="fa-regular fa-calendar-days mr-1"></i>${date}</p>
                    </div>
                </div>`;
        });
    }

    list.append(html);

    if (end >= allPosts.length || (isTinTuc && currentPage === 1)) {
        $("#btnXemThemWrapper").addClass("hidden");
    } else {
        $("#btnXemThemWrapper").removeClass("hidden");
    }
}
window.addEventListener("pageshow", function (event) {
    // Kiểm tra nếu trang được load từ cache (trở về từ nút Back)
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
                    <img src="${slider.LinkHinh}" 
                        class="w-full h-[400px] object-contain rounded-md mx-auto flex items-center justify-center"
                        alt="Banner ${slider.ID}" />
                </div>`;
        });

        $("#slider-container").html(html);

        setTimeout(function () {
            new Swiper(".mySwiper", {
                loop: true,
                autoplay: {
                    delay: 3000,
                    disableOnInteraction: false
                },
                navigation: {
                    nextEl: ".swiper-button-next",
                    prevEl: ".swiper-button-prev"
                }
            });
        }, 0);
    });
});

$(document).ready(function () {
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
        $("#tenMucLuc").text((muc.TenMucLuc || "Không rõ").toUpperCase()); // ✅ Ghi dấu và viết HOA
        allPosts = muc.BaiViets;
        renderPosts();
    });

    $("#btnXemThem").on("click", function () {
        currentPage++;
        renderPosts();
    });
});
