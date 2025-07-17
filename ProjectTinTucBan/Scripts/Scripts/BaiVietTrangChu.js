$(document).on("click", ".btn-toggle-donvi", function () {
    const index = $(this).data("index");
    const listEl = $(`#donvi-list-${index}`);
    listEl.toggleClass("hidden");
});

// File: BaiVietTrangChu.js
$(document).ready(function () {
        $.get("/api/v1/home/get-mucluc-with-baiviet", function (res) {
            if (!res.success || !res.data) {
                $("#mucLucContainer").html("<p class='text-center text-gray-500'>Không có dữ liệu mục lục.</p>");
                return;
            }

            let html = `<div class="space-y-10">`;

            // --- PHẦN THÔNG BÁO ---
            res.data.filter(muc => muc.TenMucLuc?.toLowerCase().includes("thông báo")).forEach(muc => {
                const mucId = toSlug(stripHtml(muc.TenMucLuc));

                const allBaiViets = muc.BaiViets || [];

                const moiNhat = [...allBaiViets]
                    .filter(b => b.NgayDang)
                    .sort((a, b) => (b.NgayDang ?? 0) - (a.NgayDang ?? 0))
                    .slice(0, 5);

                const xemNhieu = [...allBaiViets].sort((a, b) => (b.LuotXem ?? 0) - (a.LuotXem ?? 0)).slice(0, 5);

                html += `<div id="${mucId}">
    <div class="text-center ">
        <h3 class="inline-block bg-red-600 text-white text-sm sm:text-base md:text-lg font-semibold rounded-full px-6 py-2 mb-6 uppercase shadow">
           ${stripHtml(muc.TenMucLuc)}

        </h3>
    </div>

    <div class="max-w-7xl mx-auto px-4">
        <div class="grid md:grid-cols-2 gap-6">
            <!-- Thông báo mới (bên trái) -->
            <div>
                <h4 class="text-xl font-bold text-orange-600 mb-4 border-b border-orange-400 pb-2 uppercase">Thông báo mới</h4>
                <ul class="space-y-4">`;

                moiNhat.forEach(bv => {
                    const date = formatDate(bv.NgayDang);
                    const thumb = bv.LinkThumbnail?.trim() || "/images/thong-bao-icon.png";
                    const views = bv.LuotXem ?? 0;
                    const now = new Date();
                    const postDate = new Date(bv.NgayDang * 1000);
                    const diffTime = Math.abs(now - postDate);
                    const diffDays = diffTime / (1000 * 60 * 60 * 24);
                    const isMoi = diffDays <= 2;

                    html += `<li class="flex gap-4 items-start">
                    <div class="w-24 h-16 overflow-hidden rounded border flex-shrink-0">
                        <img src="${thumb}" class="w-full h-full object-cover" />
                    </div>
                    <div class="flex-1 min-w-0">
                        <a href="/noi-dung/${bv.ID}" class="font-semibold text-base text-blue-800 hover:underline block break-words leading-snug">
                    ${escapeHtml((bv.TieuDe ?? '').toUpperCase())}
                    ${isMoi ? '<span class="bg-red-600 text-white text-xs px-2 py-0.5 rounded ml-2 animate-pulse">MỚI</span>' : ''}
                                </a>
                            <div class="text-sm text-gray-600 mt-1 flex items-center gap-3">
                                <span><i class="far fa-calendar-alt mr-1"></i>${date}</span>
                                <span><i class="far fa-eye mr-1"></i>${views} lượt xem</span>
                            </div>
                        </div>
                    </li>`;
                });


                html += `</ul></div> <!-- end left -->

                <!-- Thông báo xem nhiều (bên phải) -->
                <div>
                    <h4 class="text-xl font-bold text-orange-600 mb-4 border-b border-orange-400 pb-2 uppercase">Thông báo được xem nhiều</h4>
                    <ul class="space-y-4">`;

                xemNhieu.forEach(bv => {
                    const date = formatDate(bv.NgayDang);
                    const thumb = bv.LinkThumbnail?.trim() || "/images/thong-bao-icon.png";
                    const views = bv.LuotXem ?? 0;
                    const topHotIDs = xemNhieu.slice(0, 3).map(b => b.ID);
                    const isHot = topHotIDs.includes(bv.ID);


                    html += `<li class="flex gap-4 items-start">
                    <div class="w-24 h-16 overflow-hidden rounded border flex-shrink-0">
                        <img src="${thumb}" class="w-full h-full object-cover" />
                    </div>
                    <div class="flex-1 min-w-0">
                        <a href="/noi-dung/${bv.ID}" class="font-semibold text-base text-blue-800 hover:underline block break-words leading-snug">
                    ${escapeHtml((bv.TieuDe ?? '').toUpperCase())}
                    ${isHot ? '<span class="bg-yellow-500 text-white text-xs px-2 py-0.5 rounded ml-2 animate-bounce">HOT</span>' : ''}
                        </a>

                                <div class="text-sm text-gray-600 mt-1 flex items-center gap-3">
                                    <span><i class="far fa-calendar-alt mr-1"></i>${date}</span>
                                    <span><i class="far fa-eye mr-1"></i>${views} lượt xem</span>
                                </div>
                            </div>
                        </li>`;
                });


                html += `</ul></div> <!-- end right -->
                </div> <!-- end grid -->
                </div>

                <!-- Nút Xem thêm thông báo -->
                <div class="text-center mt-8">
                   <a href="/danh-sach-bai-viet?mucId=${muc.ID}&slug=${stripHtml(muc.TenMucLuc)}" class="inline-block bg-blue border-2 border-red-600 text-red-600 px-6 py-2 rounded hover:bg-red-600 hover:text-white transition">
                    XEM THÊM ${muc.TenMucLuc.toUpperCase()}
                </a>
                </div>

                </div>`;
            });


            // --- PHẦN CÁC MỤC KHÁC (bao gồm Sự kiện) ---
            res.data.filter(muc => !muc.TenMucLuc?.toLowerCase().includes("thông báo")).forEach(muc => {
                const mucId = toSlug(stripHtml(muc.TenMucLuc));

                const allBaiViets = muc.BaiViets || [];
                const isSuKien = muc.TenMucLuc?.toLowerCase().includes("sự kiện");
                const isTinTuc = muc.TenMucLuc?.toLowerCase().includes("tin tức");
                window.mucLucData[mucId] = {
                    data: allBaiViets,
                    page: 1,
                    perPage: 10 // 4 bên trái + 6 bên phải
                };

                if (isTinTuc) {
                    const sortedByDate = [...allBaiViets]
                        .filter(b => b.NgayDang)
                        .sort((a, b) => (b.NgayDang ?? 0) - (a.NgayDang ?? 0));

                    const sortedByViews = [...allBaiViets]
                        .sort((a, b) => (b.LuotXem ?? 0) - (a.LuotXem ?? 0));

                    const leftItems = sortedByDate.slice(0, 4);     // Bài mới nhất bên trái
                    const rightItems = sortedByViews.slice(0, 6);   // Bài nổi bật bên phải

                    html += `
                        <div id="${mucId}" class="max-w-7xl mx-auto px-4">
                        <div class="text-center mb-8">
                            <h3 class="inline-block text-red-600 text-2xl font-bold uppercase">TIN TỨC</h3>
                        </div>
                        <div class="grid md:grid-cols-3 gap-6">
                            <!-- Bài viết bên trái -->
                            <div class="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">`;

                    leftItems.forEach(bv => {
                        const date = formatDate(bv.NgayDang);
                        const views = bv.LuotXem ?? 0;
                        const thumb = bv.LinkThumbnail?.trim() || "/images/default.jpg";

                        // Kiểm tra bài viết có phải trong vòng 2 ngày gần nhất không
                        const now = new Date();
                        const postDate = new Date(bv.NgayDang * 1000);
                        const diffTime = Math.abs(now - postDate);
                        const diffDays = diffTime / (1000 * 60 * 60 * 24);
                        const isNoiBat = diffDays <= 2;

                        html += `
                        <div class="bg-white rounded shadow hover:shadow-md transition overflow-hidden flex flex-col">
                            <img src="${thumb}" class="w-full h-44 object-cover" alt="Tin tức">
                            <div class="p-4 flex flex-col flex-grow">
                                <div class="text-sm text-gray-500 mb-2 flex items-center gap-3">
                                    <span><i class="far fa-clock mr-1"></i>${date}</span>
                                    <span><i class="far fa-eye mr-1"></i>${views} lượt xem</span>
                                </div>
                                <a href="/noi-dung/${bv.ID}" class="font-bold text-lg text-gray-800 leading-snug line-clamp-2 hover:text-blue-600">
                                 ${escapeHtml((bv.TieuDe ?? '').toUpperCase())}


                                    ${isNoiBat ? '<span class="bg-red-600 text-white text-xs px-2 py-0.5 rounded ml-2 animate-pulse">MỚI</span>' : ''}
                                </a>
                            </div>
                        </div>`;
                    });


                    html += `
                    </div>
                    <!-- Danh sách bên phải -->
                    <div class="bg-white rounded shadow p-4 space-y-4">
                        <h4 class="text-red-600 font-bold text-lg border-b pb-2">Bài viết nổi bật</h4>`;

                    rightItems.forEach((bv, index) => {
                        const date = formatDate(bv.NgayDang);
                        const views = bv.LuotXem ?? 0;

                        html += `
                        <div class="pb-2">
                            <a href="/noi-dung/${bv.ID}" class="text-gray-800 hover:text-blue-600 font-medium leading-snug block">
                             ${escapeHtml((bv.TieuDe ?? '').toUpperCase())}

                            </a>
                            <p class="text-xs text-gray-500 flex items-center gap-3">
                                <span><i class="far fa-calendar-alt mr-1"></i>${date}</span>
                                <span><i class="far fa-eye mr-1"></i>${views} lượt xem</span>
                            </p>
                            ${index < rightItems.length - 1 ? '<hr class="my-2 border-gray-300">' : ''}
                        </div>`;
                                });

                    html += `
                        </div>
                        </div>
                        <div class="text-center mt-8">
                            <a href="/danh-sach-bai-viet?mucId=${muc.ID}&slug=${stripHtml(muc.TenMucLuc)}" class="inline-block bg-blue border-2 border-red-600 text-red-600 px-6 py-2 rounded hover:bg-red-600 hover:text-white transition">
                        XEM THÊM ${muc.TenMucLuc.toUpperCase()}
                    </a>

                        </div>
                    </div>`;

                    return; // Ngăn render lại phần Tin tức bằng `renderBaiVietForMucLuc`
                }

                html += `<div id="${mucId}" class="${isSuKien
                ? 'mt-4 pb-10 bg-gradient-to-b from-blue-600 via-blue-300 to-blue-100 py-12 px-4 sm:px-6 lg:px-8'
                : ''}">
                <div class="text-center mb-8">
                    <h3 class="${isSuKien ? 'text-white text-2xl sm:text-3xl font-bold uppercase' : 'inline-block bg-blue-600 text-white text-sm sm:text-base md:text-lg font-semibold rounded-full px-6 py-2 uppercase shadow'}">
                        ${stripHtml(muc.TenMucLuc)}
                    </h3>
                </div>`;

                if (!allBaiViets.length) {
                    html += `<p class="text-center ${isSuKien ? 'text-white' : 'text-gray-500'} italic mb-4">Hiện tại chưa cập nhật bài viết nào.</p>`;
                } else {
                    window.mucLucData[mucId] = {
                        data: allBaiViets,
                        page: 1,
                        perPage: isSuKien ? 3 : 6
                    };

                    html += `
                    <div id="muc-${mucId}">
                        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6" id="list-${mucId}"></div>
                        ${allBaiViets.length > (isSuKien ? 3 : 6)
                                                ? `<div class="text-right mt-4 space-x-2">
                            <button data-id="${mucId}"
                                class="btn-xem-them inline-flex items-center gap-2 px-4 py-2 border border-red-600 text-red-600 hover:border-red-700 hover:bg-red-50 hover:text-red-700 rounded-lg transition"
                                title="Xem thêm">
                                <i class="fas fa-chevron-down text-blue-600 text-base"></i>
                            </button>
                            <button data-id="${mucId}"
                                class="btn-an-bot hidden inline-flex items-center gap-2 px-4 py-2 border border-gray-600 text-gray-600 hover:border-red-700 hover:bg-red-50 hover:text-red-700 rounded-lg transition"
                                title="Ẩn bớt">
                                <i class="fas fa-chevron-up text-blue-600 text-base"></i>
                            </button>
                        </div>`
                                                : ''}
                    </div>`;

                    // 👉 Thêm nút "XEM TẤT CẢ SỰ KIỆN" nếu là sự kiện
                    if (isSuKien) {
                        html += `
                        <div class="text-right mt-4">
                            <a href="/danh-sach-bai-viet?mucId=${muc.ID}&slug=${toSlug(stripHtml(muc.TenMucLuc))}"
                               class="inline-flex items-center gap-2 px-4 py-2 border border-yellow-700 text-yellow-700 hover:border-red-700 hover:bg-red-50 hover:text-red-700 rounded-lg transition"
                               title="Xem tất cả sự kiện">
                                <i class="fas fa-arrow-right text-blue-600 text-base"></i>
                            </a>
                        </div>
                        `;
                    }
            }

            html += `</div>`; // kết thúc khối từng mục

            });

            html += `</div>`;
            $("#mucLucContainer").html(html);

            Object.keys(window.mucLucData).forEach(mucId => {
                renderBaiVietForMucLuc(mucId);
            });
        });
        // Load danh sách Khối và Đơn vị trực thuộc
        $.get("/api/v1/home/get-khoi-va-donvi", function (res) {
            if (!res.success || !Array.isArray(res.data)) return;

            let html = `
            <div class="pt-2"> <!-- ❌ Bỏ border, shadow -->
                <h3 class="text-xl font-bold text-black px-4 pb-2 uppercase">ĐƠN VỊ TRỰC THUỘC</h3>
                <div class="border rounded px-3 py-3 pl-4 pr-2 pb-4 space-y-5">`; // ✅ Tăng khoảng cách giữa các khối: space-y-5

            res.data.forEach((khoi, index) => {
                html += `
        <div>
            <button class="btn-toggle-donvi text-lg w-full text-left text-blue-700 font-semibold px-3 py-2 rounded bg-blue-50 hover:bg-blue-100 focus:outline-none"
                data-index="${index}">
                ${khoi.TenKhoi}
            </button>
            <ul id="donvi-list-${index}" class="block text-base mt-3 text-sm text-gray-800 space-y-1 pl-4">`; // ❌ bỏ border, ✅ mt-3 lùi xuống

                khoi.DonVis.forEach(dv => {
                    html += `
                <li class="py-1">
                    <a href="${dv.Link}" target="_blank" class="hover:text-blue-600">${dv.TenDonVi}</a>
                </li>`;
                });

                html += `
            </ul>
        </div>`;
            });

            html += `</div></div>`;

            $("#sidebar-khoi-donvi").html(html);
        });

    $.get("/api/v1/home/get-slider", function (data) {
        let html = "";

        if (data.length === 0) {
            $("#slider-container").html(`
            <div class="swiper-slide flex items-center justify-center text-center h-full">
                <p class="text-gray-500 text-xl">Không có banner hiển thị</p>
            </div>
        `);
            return;
        }

        data.forEach(item => {
            html += `
            <div class="swiper-slide relative w-full h-full">
                <img loading="lazy"
                    src="${item.LinkHinh}"
                    onerror="this.src='/images/fallback.jpg'"
                    alt="Banner ${item.ID}"
                    class="w-full h-full object-cover block" />

                ${item.TieuDe ? `
                <div class="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white p-3 rounded text-lg">
                    ${item.TieuDe}
                </div>` : ""}
            </div>
        `;
        });

        $("#slider-container").html(html);

        new Swiper(".mySwiper", {
            loop: true,
            autoplay: {
                delay: 3000,
                disableOnInteraction: false
            },
            navigation: {
                nextEl: ".swiper-button-next",
                prevEl: ".swiper-button-prev"
            },
            pagination: {
                el: ".swiper-pagination",
                clickable: true
            }
        });
    });
    // Cuộn mượt
    $(document).on("click", ".scroll-to", function (e) {
        e.preventDefault();
    const target = $(this).attr("href");
    $('html, body').animate({scrollTop: $(target).offset().top - 100 }, 500);
        });

    // Xem thêm
        $(document).on("click", ".btn-xem-them", function () {
            const mucId = $(this).data("id");
            if (window.mucLucData[mucId]) {
                const muc = window.mucLucData[mucId];
                const isSuKien = mucId.includes("su-kien");
                const now = new Date();

                // Nếu là sự kiện thì xác định top 3 bài có lượt xem cao
                let topHotIDs = [];
                if (isSuKien) {
                    topHotIDs = [...muc.data] // hoặc muc.data.slice()
                        .sort((a, b) => (b.LuotXem ?? 0) - (a.LuotXem ?? 0))
                        .slice(0, 3)
                        .map(b => b.ID);
                }


                muc.page += 1;
                renderBaiVietForMucLuc(mucId);

                // Nếu là sự kiện, hiện nút "ẨN BỚT"
                if (isSuKien) {
                    $(`.btn-an-bot[data-id="${mucId}"]`).removeClass("hidden");
                }
            }
        });

        $(document).on("click", ".btn-an-bot", function () {
            const mucId = $(this).data("id");
            const muc = window.mucLucData[mucId];
            if (!muc) return;

            muc.page = 1;
            $(`#list-${mucId}`).html("");  // Xóa toàn bộ bài viết đã thêm
            renderBaiVietForMucLuc(mucId); // Hiển thị lại bài viết ban đầu

            $(this).addClass("hidden"); // Ẩn nút "ẨN BỚT"
            $(`.btn-xem-them[data-id="${mucId}"]`).show(); // Hiện lại nút "XEM THÊM"
        });

    // Hàm phân trang bài viết
        function renderBaiVietForMucLuc(mucId) {
            const container = $(`#list-${mucId}`);
            const muc = window.mucLucData[mucId];
            if (!muc) return;

            const start = (muc.page - 1) * muc.perPage;
            const end = muc.page * muc.perPage;
            const currentList = muc.data.slice(start, end);
            const isSuKien = mucId.includes("su-kien");
            const now = new Date();

            // Xác định top 3 bài viết sự kiện có lượt xem cao nhất
            let topHotIDs = [];
            if (isSuKien) {
                topHotIDs = [...muc.data] // hoặc muc.data.slice()
                    .sort((a, b) => (b.LuotXem ?? 0) - (a.LuotXem ?? 0))
                    .slice(0, 3)
                    .map(b => b.ID);
            }


            let html = "";
            currentList.forEach(bv => {
                const thumb = bv.LinkThumbnail?.trim() || "/images/default.jpg";
                const date = formatDate(bv.NgayDang);
                const views = bv.LuotXem ?? 0;
                const moTa = bv.MoTa ?? '';
                const tieuDe = escapeHtml(bv.TieuDe || "Không có tiêu đề").toUpperCase();

                const postDate = new Date((bv.NgayDang ?? 0) * 1000);
                const diffDays = Math.abs((now - postDate) / (1000 * 60 * 60 * 24));
                const isMoi = diffDays <= 2;

                const isHot = isSuKien && topHotIDs.includes(bv.ID);

                if (isSuKien) {
                    html += `
                <div class="bg-white rounded-lg overflow-hidden shadow hover:shadow-lg transition flex flex-col">
                    <img src="${thumb}" class="w-full h-[230px] object-cover" alt="Thumbnail" />
                    <div class="p-4 flex flex-col justify-between flex-grow">
                        <a href="/noi-dung/${bv.ID}" class="font-bold text-base text-gray-900 hover:text-red-600 line-clamp-2 leading-snug mb-2">
                    ${tieuDe}
                    ${isMoi ? '<span class="bg-red-600 text-white text-xs px-2 py-0.5 rounded ml-2 animate-pulse">HOT</span>' : ''}
                    ${isHot ? '<span class="bg-yellow-500 text-white text-xs px-2 py-0.5 rounded ml-2 animate-bounce">HOT</span>' : ''}
                </a>

                        <div class="text-sm text-gray-600 flex items-center justify-between mt-auto">
                            <span><i class="far fa-calendar-alt mr-1"></i>${date}</span>
                            <span><i class="far fa-eye mr-1"></i>${views} lượt xem</span>
                        </div>
                    </div>
                </div>`;
                } else {
                    html += `
                <div class="bg-white rounded-lg shadow-sm hover:shadow-md transition overflow-hidden flex flex-col h-auto p-3 text-sm space-y-2">
                    <img src="${thumb}" class="w-full h-auto" alt="Thumbnail" />
                    <div class="p-2 flex-1 flex flex-col space-y-1">
                        <a href="/noi-dung/${bv.ID}" class="font-bold text-base text-gray-900 hover:text-red-600 line-clamp-2 leading-snug mb-2">
                    ${tieuDe}
                    ${isMoi ? '<span class="bg-red-600 text-white text-xs px-2 py-0.5 rounded ml-2 animate-pulse">MỚI</span>' : ''}
                    ${isHot ? '<span class="bg-yellow-500 text-white text-xs px-2 py-0.5 rounded ml-2 animate-bounce">HOT</span>' : ''}
                </a>

                        <div class="text-sm text-gray-500 flex items-center gap-3">
                            <span><i class="far fa-clock mr-1"></i>${date}</span>
                            <span><i class="far fa-eye mr-1"></i>${views} lượt xem</span>
                        </div>
                        <p class="text-sm text-gray-700 line-clamp-2 break-words whitespace-normal">${moTa}</p>
                    </div>
                </div>`;
                }
            });

            container.append(html);
            $(`.btn-xem-them[data-id="${mucId}"]`).show();
        }


    });

function stripHtml(html) {
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
}

function toSlug(str) {
    return stripHtml(str).toLowerCase()
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
}

function formatDate(unixTimestamp) {
    if (!unixTimestamp) return "N/A";

    var date = new Date(unixTimestamp * 1000);
    var weekdays = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    var dayOfWeek = weekdays[date.getDay()];
    var month = ("0" + (date.getMonth() + 1)).slice(-2);
    var day = ("0" + date.getDate()).slice(-2);
    var year = date.getFullYear();
    var hours = ("0" + date.getHours()).slice(-2);
    var minutes = ("0" + date.getMinutes()).slice(-2);
    var seconds = ("0" + date.getSeconds()).slice(-2);
    var formattedDate = dayOfWeek + ', ' + day + "-" + month + "-" + year + " " + hours + ":" + minutes + ":" + seconds;
    return formattedDate;
}
function toggleDonViList(index) {
    const el = document.getElementById(`donvi-list-${index}`);
    el.classList.toggle("hidden");
}
function escapeHtml(str) {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
window.mucLucData = {};

