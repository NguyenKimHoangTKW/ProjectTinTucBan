// ===============================
// 🔽 DOM ready: Tải dữ liệu và gắn sự kiện sau khi trang load
// ===============================
$(document).ready(function () {
    
    // 👉 Lấy danh sách slider banner
    $.get("/api/v1/home/get-slider", function (data) {
        let html = "";
        data.forEach(slider => {
            html += `
                <div class="swiper-slide flex items-center justify-center">
                    <img src="${slider.LinkHinh}" class="w-full h-[400px] object-contain rounded-md mx-auto flex items-center justify-center" alt="Banner ${slider.ID}" />
                </div>`;
        });
        $("#slider-container").html(html);

        // 👉 Khởi tạo slider sau khi thêm vào DOM
        setTimeout(() => {
            new Swiper(".mySwiper", {
                loop: true,
                autoplay: { delay: 3000, disableOnInteraction: false },
                navigation: { nextEl: ".swiper-button-next", prevEl: ".swiper-button-prev" }
            });
        }, 0);
    });

    // 👉 Lấy dữ liệu mục lục và bài viết tương ứng theo ID
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
        renderBreadcrumb(muc.TenMucLuc); // 👉 Tạo breadcrumb

        allPosts = muc.BaiViets;

        const isThongBao = (window.mucTen || "").toLowerCase().includes("thông báo");
        const isSuKien = (muc.TenMucLuc || "").toLowerCase().includes("sự kiện");
        window.isSuKien = isSuKien;

        if (isThongBao) {
            renderThongBao();
        } else if (isDanhSachMuc && isSuKien) {
            renderAllPosts(); // ❗ Nếu là trang danh sách sự kiện => hiện hết
            $("#btnXemThem, #btnAnBot, #btnXemTatCa").hide();
        } else {
            renderPosts();
        }
           // 👉 Ngược lại, render thường
    });

    // 👉 Sự kiện nút "XEM THÊM"
    $("#btnXemThem").on("click", function () {
        currentPage++;
        renderPosts();
    });

    // 👉 Sự kiện: Xem tất cả
    $("#btnXemTatCa").on("click", function (e) {
        e.preventDefault();

        // ✨ Xóa từ khóa tìm kiếm
        $("#searchInput").val("");

        // ✨ Reset danh sách về toàn bộ
        $("#tinTucList").html("");
        renderAllPosts();

        // ✨ Hiển thị lại các nút phù hợp
        if (isDanhSachMuc && isSuKien) {
            $("#btnXemThem, #btnAnBot, #btnXemTatCa").hide(); // ❗ẩn hết nếu là trang danh sách sự kiện
        } else {
            $("#btnXemThem").hide();
            $("#btnAnBot").removeClass("hidden");
        }

        $("#btnXemTatCa").hide();
    });

    // 👉 Sự kiện nút "ẨN BỚT"
    $("#btnAnBot").on("click", function () {
        currentPage = 1;
        $("#tinTucList").html("");
        renderPosts();
        $(this).addClass("hidden");
        $("#btnXemThem").show();
    });

    // 👉 Tìm kiếm khi nhập chữ
    // 👉 Tìm kiếm khi nhập chữ có hiệu ứng loading
    $("#searchInput").on("input", function () {
        const keyword = $(this).val().trim().toLowerCase();

        // ✅ Show loading ngay trong khung danh sách bài viết
        $("#tinTucList").html(`
        <div class="col-span-3 text-center py-6">
            <div class="loader mx-auto mb-2"></div>
            <p class="text-gray-500">Đang tìm kiếm bài viết...</p>
        </div>
    `);

        // ✅ Ẩn nút "Xem tất cả" trong lúc tìm kiếm
        $("#btnXemTatCa").hide();

        // ✅ Xử lý sau 300ms
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
                $("#btnXemThem, #btnAnBot, #btnXemTatCa").hide(); // ✅ Thêm #btnXemTatCa vào đây
            } else {
                renderFilteredPosts(filtered);
                $("#btnXemThem").hide();
                $("#btnAnBot").removeClass("hidden");
            }
        }, 300);
    });



    // 👉 Tìm kiếm khi nhấn Enter
});

// 👉 Reload trang khi quay lại từ cache (tránh hiển thị dữ liệu cũ)
window.addEventListener("pageshow", function (event) {
    if (event.persisted) {
        window.location.reload();
    }
});

// 👉 Khởi tạo Swiper mặc định (nếu chưa gắn sau khi load slider)
new Swiper(".mySwiper", {
    loop: true,
    autoplay: { delay: 3000, disableOnInteraction: false },
    pagination: { el: ".swiper-pagination", clickable: true },
    navigation: { nextEl: ".swiper-button-next", prevEl: ".swiper-button-prev" }
});

// ===============================
// 🔽 Biến & Hàm hỗ trợ (Helper)
// ===============================

const mucId = window.mucIdFromView || 0;
let allPosts = [];
let currentPage = 1;
const perPage = 6;
let filteredPosts = []; // 🔍 Kết quả sau tìm kiếm
let isSearching = false; // ✅ Đang trong trạng thái tìm kiếm
let currentFilteredPage = 1; // ✅ Trang tìm kiếm hiện tại
const isDanhSachMuc = window.location.pathname.includes("/danh-sach-bai-viet");

// 👉 Hiển thị breadcrumb (mục lục)
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

// 👉 Chuyển đổi ký tự HTML đặc biệt để tránh lỗi giao diện
function escapeHtml(text) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// 👉 Format ngày kiểu timestamp -> dd/mm/yyyy
function formatDate(unixTimestamp) {
    if (!unixTimestamp) return "N/A";
    const date = new Date(unixTimestamp * 1000);
    const day = ("0" + date.getDate()).slice(-2);
    const month = ("0" + (date.getMonth() + 1)).slice(-2);
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

// 👉 Hiển thị tất cả bài viết
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
                    <a href="/noi-dung/${post.ID}" class="text-base font-semibold text-gray-800 hover:text-blue-600 leading-snug line-clamp-2 mb-2">${tieuDe}</a>
                    <p class="text-sm text-gray-500 mt-auto"><i class="fa-regular fa-calendar-days mr-1"></i>${date}</p>
                </div>
            </div>`;
    });

    list.html(html);
    $("#btnXemThem").hide();
    $("#btnAnBot").removeClass("hidden");
}

// 👉 Hiển thị danh sách bài viết theo từng trang
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
                        <a href="/noi-dung/${post.ID}" class="text-base font-semibold text-gray-800 hover:text-blue-600 leading-snug line-clamp-2 mb-2">${tieuDe}</a>
                        <p class="text-sm text-gray-500 mt-auto"><i class="fa-regular fa-calendar-days mr-1"></i>${date}</p>
                    </div>
                </div>`;
        });

        list.append(html);
        hideLoading();

        if (end >= allPosts.length) {
            $("#btnXemThem").hide();
        } else {
            $("#btnXemThem").show();
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

// 👉 Hiển thị danh sách bài viết đã lọc (khi tìm kiếm)
function renderFilteredPosts(posts, page = 1) {
    const perPage = 6;
    const start = (page - 1) * perPage;
    const end = page * perPage;
    const paginatedPosts = posts.slice(start, end);

    const list = $("#tinTucList");
    list.html(""); // 👈 làm sạch

    let html = "";
    paginatedPosts.forEach(post => {
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

    list.html(html);

    // 👇 Nút XEM THÊM khi tìm kiếm
    if (end < posts.length) {
        $("#btnXemThem").show();
    } else {
        $("#btnXemThem").hide();
    }

    // 👉 Ẩn hiện các nút
    $("#btnAnBot").toggle(page > 1);
    $("#btnXemTatCa").hide(); // ❌ Luôn ẩn "Xem tất cả" khi tìm kiếm
}
