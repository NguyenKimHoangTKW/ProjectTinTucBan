// ===============================
// DOM ready: Tải dữ liệu và gắn sự kiện sau khi trang load
// ===============================
document.addEventListener("DOMContentLoaded", function () {
    const dataEl = document.querySelector("#js-data");

    const mucIdFromView = dataEl?.dataset.mucid ?? "0";
    const mucTen = dataEl?.dataset.mucten ?? "";
    window.mucIdFromView = mucIdFromView;
    window.mucTen = mucTen;
});

$(document).ready(function () {
    // 👉 Lấy danh sách slider banner
    $.ajax({
        url: "/api/v1/home/get-slider",
        type: "GET",
        dataType: "json",
        success: function (data) {
            let html = "";
            data.forEach(slider => {
                html += `
                <div class="swiper-slide flex items-center justify-center">
                    <img src="${slider.LinkHinh}" class="w-full h-[400px] object-contain rounded-md mx-auto flex items-center justify-center" alt="Banner ${slider.ID}" />
                </div>`;
            });
            $("#slider-container").html(html);

            // Khởi tạo Swiper sau khi DOM cập nhật
            new Swiper(".mySwiper", {
                loop: true,
                autoplay: { delay: 3000, disableOnInteraction: false },
                navigation: {
                    nextEl: ".swiper-button-next",
                    prevEl: ".swiper-button-prev"
                },
                pagination: {
                    el: ".swiper-pagination",
                    clickable: true
                }
            });
        },
        error: function () {
            $("#slider-container").html(`
                <div class="swiper-slide flex items-center justify-center text-center h-[400px]">
                    <p class="text-red-500 text-xl">Lỗi khi tải banner</p>
                </div>
            `);
        }
    });

    // 👉 Lấy dữ liệu mục lục và bài viết tương ứng theo mucIdFromView
    $.ajax({
        url: "/api/v1/home/get-mucluc-with-baiviet",
        type: "GET",
        dataType: "json",
        success: function (res) {
            if (!res.success || !res.data) {
                $("#tinTucList").html("<p class='col-span-3 text-center text-gray-500'>Không có dữ liệu.</p>");
                return;
            }

            const muc = res.data.find(m => m.ID === parseInt(window.mucIdFromView));
            if (!muc || !muc.BaiViets || muc.BaiViets.length === 0) {
                $("#tinTucList").html("<p class='col-span-3 text-center text-gray-500'>Không có bài viết nào trong mục này.</p>");
                $("#btnXemThem, #btnAnBot, #btnXemTatCa").hide();
                return;
            }

            window.mucTen = muc.Ten;
            $("#tenMucLuc").text((muc.TenMucLuc || "Không rõ").toUpperCase());
            renderBreadcrumb(muc.TenMucLuc);

            allPosts = muc.BaiViets;

            const isThongBao = (window.mucTen || "").toLowerCase().includes("thông báo");
            const isSuKien = (muc.TenMucLuc || "").toLowerCase().includes("sự kiện");
            window.isSuKien = isSuKien;

            if (isThongBao) {
                renderThongBao();
            } else if (isDanhSachMuc && isSuKien) {
                renderAllPosts();
                $("#btnXemThem, #btnAnBot, #btnXemTatCa").hide();
            } else {
                renderPosts();
            }
        },
        error: function () {
            $("#tinTucList").html("<p class='col-span-3 text-center text-red-500'>Lỗi khi tải dữ liệu.</p>");
        }
    });

    // 👉 Nút "XEM THÊM"
    $("#btnXemThem").on("click", function () {
        currentPage++;
        renderPosts();
    });

    // 👉 Nút "XEM TẤT CẢ"
    $("#btnXemTatCa").on("click", function (e) {
        e.preventDefault();
        $("#searchInput").val("");
        $("#tinTucList").html("");
        renderAllPosts();

        if (isDanhSachMuc && window.isSuKien) {
            $("#btnXemThem, #btnAnBot, #btnXemTatCa").hide();
        } else {
            $("#btnXemThem").hide();
            $("#btnAnBot").removeClass("hidden");
        }

        $("#btnXemTatCa").hide();
    });

    // 👉 Nút "ẨN BỚT"
    $("#btnAnBot").on("click", function () {
        currentPage = 1;
        $("#tinTucList").html("");
        renderPosts();
        $(this).addClass("hidden");
        $("#btnXemThem").show();
    });

    // 👉 Tìm kiếm bài viết
    $("#searchInput").on("input", function () {
        const keyword = $(this).val().trim().toLowerCase();

        $("#tinTucList").html(`
            <div class="col-span-3 text-center py-6">
                <div class="loader mx-auto mb-2"></div>
                <p class="text-gray-500">Đang tìm kiếm bài viết...</p>
            </div>
        `);
        $("#btnXemTatCa").hide();

        setTimeout(() => {
            if (keyword === "") {
                currentPage = 1;
                $("#tinTucList").html("");

                if (isDanhSachMuc && window.isSuKien) {
                    renderAllPosts();
                    $("#btnXemThem, #btnAnBot, #btnXemTatCa").hide();
                } else {
                    renderPosts();
                    $("#btnXemThem").show();
                    $("#btnAnBot").addClass("hidden");
                    $("#btnXemTatCa").show();
                }
                return;
            }

            const filtered = allPosts.filter(post =>
                (post.TieuDe || "").toLowerCase().includes(keyword)
            );
            if (filtered.length === 0) {
                $("#tinTucList").html("<p class='text-center text-gray-500'>Không tìm thấy bài viết phù hợp.</p>");
                $("#btnXemThem, #btnAnBot, #btnXemTatCa").hide();
            } else {
                renderFilteredPosts(filtered);
                $("#btnXemThem").hide();
                $("#btnAnBot").removeClass("hidden");
            }
        }, 300);
    });
});

//  Reload trang khi quay lại từ cache (tránh hiển thị dữ liệu cũ)
window.addEventListener("pageshow", function (event) {
    if (event.persisted) {
        window.location.reload();
    }
});

//  Khởi tạo Swiper mặc định (nếu chưa gắn sau khi load slider)
new Swiper(".mySwiper", {
    loop: true,
    autoplay: { delay: 3000, disableOnInteraction: false },
    pagination: { el: ".swiper-pagination", clickable: true },
    navigation: { nextEl: ".swiper-button-next", prevEl: ".swiper-button-prev" }
});

// ===============================
//  Biến & Hàm hỗ trợ (Helper)
// ===============================

const mucId = window.mucIdFromView || 0;
let allPosts = [];
let currentPage = 1;
const perPage = 6;
let filteredPosts = []; //  Kết quả sau tìm kiếm
let isSearching = false; //  Đang trong trạng thái tìm kiếm
let currentFilteredPage = 1; // Trang tìm kiếm hiện tại
const isDanhSachMuc = window.location.pathname.includes("/danh-sach-bai-viet");

//  Hiển thị breadcrumb (mục lục)
function renderBreadcrumb(mucTen) {
    const html = `
        <nav class="text-right text-lg text-gray-700 font-medium" aria-label="Breadcrumb">
            <ol class="inline-flex items-center space-x-1">
                <li>
                    <a href="/" class="text-blue-600 hover:underline">Trang chủ</a>
                </li>
                <li>
                    <span class="mx-2">/</span>
                </li>
                <li class="text-gray-900 font-semibold">
                    ${escapeHtml(mucTen)}
                </li>
            </ol>
        </nav>`;
    $("#breadcrumbContainer").html(html);
}

//  Chuyển đổi ký tự HTML đặc biệt để tránh lỗi giao diện
function escapeHtml(text) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

//  Format ngày kiểu timestamp -> dd/mm/yyyy
function formatDate(unixTimestamp) {
    if (!unixTimestamp) return "N/A";
    const date = new Date(unixTimestamp * 1000);
    const day = ("0" + date.getDate()).slice(-2);
    const month = ("0" + (date.getMonth() + 1)).slice(-2);
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}
function isNewPost(ngayDang) {
    if (!ngayDang) return false;
    const now = Date.now();
    const postTime = ngayDang * 1000;
    const twoDays = 2 * 24 * 60 * 60 * 1000;
    return now - postTime <= twoDays;
}

//Hiển thị tất cả bài viết
function renderAllPosts() {
    const list = $("#tinTucList");
    list.empty();
    let html = "";

    allPosts.forEach(post => {
        const date = formatDate(post.NgayDang);
        const thumb = post.LinkThumbnail || "/images/default.jpg";
        const tieuDe = escapeHtml(post.TieuDe || "Không có tiêu đề").toUpperCase();
        html += `
        <div class="bg-white rounded-lg shadow-md hover:shadow-lg transition overflow-hidden flex flex-col h-full">
    <img src="${thumb}" class="w-full h-[200px] object-cover" alt="Ảnh">
    <div class="p-4 flex flex-col flex-1">
        <div class="mt-auto">
            <p class="text-sm text-gray-500"><i class="fa-regular fa-calendar-days mr-1"></i>${date}</p>
           <a href="/noi-dung/${post.ID}" class="text-base font-semibold text-gray-800 hover:text-blue-600 leading-snug line-clamp-2 mt-1">
    ${tieuDe}
    ${isNewPost(post.NgayDang) ? '<span class="ml-2 text-red-500 text-xs font-medium">🆕 Mới cập nhật</span>' : ''}
</a>
</div>
    </div>
</div>`;
    });

    list.html(html);
    $("#btnXemThem").hide();
    $("#btnAnBot").removeClass("hidden");
}

//  Hiển thị danh sách bài viết theo từng trang
function renderPosts() {
    showLoading();
    setTimeout(() => {
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
        <div class="mt-auto">
            <p class="text-sm text-gray-500"><i class="fa-regular fa-calendar-days mr-1"></i>${date}</p>
            <a href="/noi-dung/${post.ID}" class="text-base font-semibold text-gray-800 hover:text-blue-600 leading-snug line-clamp-2 mt-1">
    ${tieuDe}
    ${isNewPost(post.NgayDang) ? '<span class="ml-2 text-red-500 text-xs font-medium">🆕 Mới cập nhật</span>' : ''}
</a>
</div>
    </div>
</div>`;
        });

        list.append(html);
        hideLoading();

        if (end >= allPosts.length) {
            $("#btnXemThem").hide();
            $("#btnXemTatCa").hide(); //  Thêm dòng này
        } else {
            $("#btnXemThem").show();
            $("#btnXemTatCa").show(); //  Và dòng này
        }


        if (currentPage > 1) {
            $("#btnAnBot").removeClass("hidden");
        }
    }, 300); // delay để thấy hiệu ứng loading
}

function showLoading() {
    $("#loadingIndicator").removeClass("hidden");
}
function hideLoading() {
    $("#loadingIndicator").addClass("hidden");
}

// Hiển thị danh sách bài viết đã lọc (khi tìm kiếm)
function renderFilteredPosts(posts, page = 1) {
    const perPage = 6;
    const start = (page - 1) * perPage;
    const end = page * perPage;
    const paginatedPosts = posts.slice(start, end);

    const list = $("#tinTucList");
    list.html(""); //  làm sạch

    let html = "";
    paginatedPosts.forEach(post => {
        const date = formatDate(post.NgayDang);
        const thumb = post.LinkThumbnail || "/images/default.jpg";
        const tieuDe = escapeHtml(post.TieuDe || "Không có tiêu đề").toUpperCase();

        html += `
            <div class="bg-white rounded-lg shadow-md hover:shadow-lg transition overflow-hidden flex flex-col h-full">
    <img src="${thumb}" class="w-full h-[200px] object-cover" alt="Ảnh">
    <div class="p-4 flex flex-col flex-1">
        <div class="mt-auto">
            <p class="text-sm text-gray-500"><i class="fa-regular fa-calendar-days mr-1"></i>${date}</p>
            <a href="/noi-dung/${post.ID}" class="text-base font-semibold text-gray-800 hover:text-blue-600 leading-snug line-clamp-2 mt-1">
    ${tieuDe}
    ${isNewPost(post.NgayDang) ? '<span class="ml-2 text-red-500 text-xs font-medium">🆕 Mới cập nhật</span>' : ''}
</a>
</div>
    </div>
</div>`;
    });

    list.html(html);

    //  Nút XEM THÊM khi tìm kiếm
    if (end < posts.length) {
        $("#btnXemThem").show();
    } else {
        $("#btnXemThem").hide();
    }

    // Ẩn hiện các nút
    $("#btnAnBot").toggle(page > 1);
    $("#btnXemTatCa").hide(); //  Luôn ẩn "Xem tất cả" khi tìm kiếm
}
