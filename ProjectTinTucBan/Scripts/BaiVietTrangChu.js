
    function toSlug(str) {
        return str.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
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

function escapeHtml(str) {
            return String(str)
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
        }
    new Swiper(".mySwiper", {
        loop: true,
    autoplay: {delay: 3000, disableOnInteraction: false },
    pagination: {el: ".swiper-pagination", clickable: true },
    navigation: {nextEl: ".swiper-button-next", prevEl: ".swiper-button-prev" }
    });

    window.mucLucData = { };

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

        // Gắn slide vào DOM
        $("#slider-container").html(html);

        // Khởi tạo sau khi DOM đã xong
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
        }, 0); // Đảm bảo DOM đã vẽ xong
    });
});



    $(document).ready(function () {
        $.get("/api/v1/home/get-mucluc-with-baiviet", function (res) {
            if (!res.success || !res.data) {
                $("#mucLucContainer").html("<p class='text-center text-gray-500'>Không có dữ liệu mục lục.</p>");
                return;
            }

            let html = `<div class="space-y-10">`;

            // --- PHẦN THÔNG BÁO ---
            res.data.filter(muc => muc.TenMucLuc?.toLowerCase().includes("thông báo")).forEach(muc => {
                const mucId = toSlug(muc.TenMucLuc);
                const allBaiViets = muc.BaiViets || [];

                const moiNhat = [...allBaiViets]
                    .filter(b => b.NgayDang)
                    .sort((a, b) => (b.NgayDang ?? 0) - (a.NgayDang ?? 0))
                    .slice(0, 5);

                const xemNhieu = [...allBaiViets].sort((a, b) => (b.LuotXem ?? 0) - (a.LuotXem ?? 0)).slice(0, 5);

                html += `<div id="${mucId}">
    <div class="text-center ">
        <h3 class="inline-block bg-red-600 text-white text-sm sm:text-base md:text-lg font-semibold rounded-full px-6 py-2 mb-6 uppercase shadow">
            ${muc.TenMucLuc}
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

                    html += `<li class="flex gap-4 items-start">
        <div class="w-24 h-16 overflow-hidden rounded border flex-shrink-0">
            <img src="${thumb}" class="w-full h-full object-cover" />
        </div>
        <div class="flex-1 min-w-0">
            <a href="/noi-dung/${bv.ID}" class="font-semibold text-base text-blue-800 hover:underline block break-words leading-snug">
                ${escapeHtml((bv.TieuDe ?? '').toUpperCase())}


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

                    html += `<li class="flex gap-4 items-start">
    <div class="w-24 h-16 overflow-hidden rounded border flex-shrink-0">
        <img src="${thumb}" class="w-full h-full object-cover" />
    </div>
    <div class="flex-1 min-w-0">
        <a href="/noi-dung/${bv.ID}" class="font-semibold text-base text-blue-800 hover:underline block break-words leading-snug">
           ${escapeHtml((bv.TieuDe ?? '').toUpperCase())}


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
   <a href="/danh-sach-bai-viet?mucId=${muc.ID}&slug=${toSlug(muc.TenMucLuc)}" class="inline-block bg-blue border-2 border-red-600 text-red-600 px-6 py-2 rounded hover:bg-red-600 hover:text-white transition">
    XEM THÊM ${muc.TenMucLuc.toUpperCase()}
</a>
</div>

</div>`;
            });


            // --- PHẦN CÁC MỤC KHÁC (bao gồm Sự kiện) ---
            res.data.filter(muc => !muc.TenMucLuc?.toLowerCase().includes("thông báo")).forEach(muc => {
                const mucId = toSlug(muc.TenMucLuc);
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
                    <div class="max-w-7xl mx-auto px-4">
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
        <a href="/danh-sach-bai-viet?mucId=${muc.ID}&slug=${toSlug(muc.TenMucLuc)}" class="inline-block bg-blue border-2 border-red-600 text-red-600 px-6 py-2 rounded hover:bg-red-600 hover:text-white transition">
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
                            ${muc.TenMucLuc}
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
                            ? `<div class="text-center mt-8">
       <button data-id="${mucId}"
        class="btn-xem-them inline-block border-2 border-red-600 text-red-600 hover:bg-blue-600 hover:text-white hover:border-blue-600 px-6 py-2 rounded transition">
    XEM THÊM ${muc.TenMucLuc.toUpperCase()}
</button>



    </div>` : ''
}

                    </div>`;
                }

                html += `</div>`;
            });

            html += `</div>`;
            $("#mucLucContainer").html(html);

            Object.keys(window.mucLucData).forEach(mucId => {
                renderBaiVietForMucLuc(mucId);
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
        window.mucLucData[mucId].page += 1;
    renderBaiVietForMucLuc(mucId);
            }
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

    let html = "";
        currentList.forEach(bv => {
            const thumb = bv.LinkThumbnail?.trim() || "/images/default.jpg";
            const date = formatDate(bv.NgayDang);
            const views = bv.LuotXem ?? 0;
            const moTa = bv.MoTa ?? '';
            const tieuDe = bv.TieuDe ?? 'KHÔNG CÓ TIÊU ĐỀ';

            if(isSuKien) {
                html += `
    <div class="w-full flex justify-center">
        <div class="bg-white w-[355px] h-[auto] rounded overflow-hidden shadow hover:shadow-lg transition">
            <img src="${thumb}" class="w-full h-[205.525px] object-cover" alt="Thumbnail" />
            <div class="p-4">
                <a href="/noi-dung/${bv.ID}" class="text-lg font-semibold text-gray-800 hover:text-orange-600 line-clamp-2">${tieuDe.toUpperCase()}</a>
                <div class="text-sm text-gray-500 mt-2 flex items-center gap-4">
                    <span><i class="far fa-clock mr-1"></i>${date}</span>
                    <span><i class="far fa-eye mr-1"></i>${views} lượt xem</span>
                </div>
            </div>
        </div>
    </div>`;
            }

 else {
                html += `
        <div class="bg-white rounded-lg shadow-sm hover:shadow-md transition overflow-hidden flex flex-col h-auto p-3 text-sm">
            <img src="${thumb}" class="w-full h-auto" alt="Thumbnail" />
            <div class="p-4 flex-1 flex flex-col">
                <a href="/noi-dung/${bv.ID}" class="font-bold text-blue-800 text-base sm:text-lg mb-2 hover:underline break-words whitespace-normal">${tieuDe}</a>
                <div class="text-sm text-gray-500 mb-2 flex items-center gap-3">
                    <span><i class="far fa-clock mr-1"></i>${date}</span>
                    <span><i class="far fa-eye mr-1"></i>${views} lượt xem</span>
                </div>
                <p class="text-sm text-gray-700 line-clamp-2 break-words whitespace-normal">${moTa}</p>
            </div>
        </div>`;
            }
        });


        container.append(html);


            if (end >= muc.data.length) {
        $(`button[data-id="${mucId}"]`).hide();
            }
        }
    });
