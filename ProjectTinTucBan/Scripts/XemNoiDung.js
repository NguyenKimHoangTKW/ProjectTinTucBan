// ==========================
// Xử lý DOM, Ajax, và Sự kiện
// ==========================
$(document).on("click", "aside a", function (e) {
    e.preventDefault();
    const newUrl = $(this).attr("href");
    window.location.href = newUrl;
});

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

window.addEventListener("pageshow", function (event) {
    const navType = performance.getEntriesByType("navigation")[0]?.type;

    if (event.persisted || navType === "back_forward") {
        window.location.reload();
    }
});

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
    const postId = window.postId;

    setTimeout(function () {
        $.ajax({
            url: `/api/v1/admin/increase-views/${postId}`,
            type: "POST",
        });
    }, 15000); // chờ 15 giây

    const urlParts = window.location.pathname.split('/');
    const id = urlParts[urlParts.length - 1];

    $.ajax({
        url: `/api/v1/admin/get-baiviet-by-id/${id}`,
        type: "GET",
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
            const tenMucLuc = bv.MucLuc?.TenMucLuc?.trim() || "Không rõ";
            const tenMucLucSlug = bv.MucLuc?.TenMucLuc ? toSlug(bv.MucLuc.TenMucLuc) : "";

            const breadcrumb = `
                <nav class="flex flex-wrap gap-x-1">
                    <a href="/" class="text-blue-700 hover:underline">Trang chủ</a>
                    <span>›</span>
                    <a href="/" class="text-blue-700 hover:underline scroll-to" data-target="${tenMucLucSlug}">
                        ${tenMucLuc}
                    </a>
                    <span>›</span>
                    <span class="text-blue-700 font-medium break-words">${escapeHtml((bv.TieuDe ?? '').toUpperCase())}</span>
                </nav>`;
            $("#breadcrumbContainer").html(breadcrumb);

            let pdfBlock = "";
            if (bv.LinkPDF?.trim()) {
                const pdfLinks = bv.LinkPDF.split(";").map(link => link.trim()).filter(link => link !== "");

                if (pdfLinks.length === 1) {
                    const pdfUrl = encodeURI(pdfLinks[0]);
                    const pdfId = "pdfContainerSingle";
                    pdfBlock = `
        <div class="mt-6 flex justify-center hidden" id="${pdfId}">
            <embed 
                src="${pdfUrl}" 
                type="application/pdf" 
                style="width: 80%; height: 800px;" 
                class="rounded border shadow"
            />
        </div>
        <div class="text-sm text-gray-500 mt-2 text-center hidden" id="pdfFallback">
            Nếu không hiển thị, <a href="${pdfUrl}" class="text-blue-600 hover:underline" target="_blank">nhấn vào đây để tải về</a>.
        </div>
        <script>
            $.ajax({
                url: "${pdfUrl}",
                type: "HEAD",
                success: function () {
                    $("#${pdfId}").removeClass("hidden");
                    $("#pdfFallback").removeClass("hidden");
                },
                
            });
        </script>
    `;
                } else {
                    pdfBlock = `
    <div class="mt-6 hidden" id="pdfListBlock">
        <p class="text-base font-semibold text-gray-700 mb-3">📎 File đính kèm:</p>
        <ul class="space-y-2" id="pdfListBlockUl"></ul>
    </div>
    <script>
        const pdfList = ${JSON.stringify(pdfLinks)};
        let validPdfCount = 0;

        pdfList.forEach((pdf, index) => {
            $.ajax({
                url: pdf,
                type: "HEAD",
                success: function () {
                    const fileName = pdf.split("/").pop();
                    $("#pdfListBlockUl").append(\`
                        <li>
                            <a href="\${pdf}" target="_blank" class="flex items-center gap-2 text-blue-600 hover:underline">
                                <i class="fa-solid fa-file-pdf text-red-600"></i> Tài liệu \${++validPdfCount} (\${fileName})
                            </a>
                        </li>
                    \`);

                    // Chỉ hiện khối nếu có ít nhất 1 file hợp lệ
                    if (validPdfCount === 1) {
                        $("#pdfListBlock").removeClass("hidden");
                    }
                },
               
            });
        });
    </script>`;
                }



            }

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
                        <!-- Nút chia sẻ Facebook -->
                        <button
                            class="btn-share-facebook flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                            data-url="${window.location.origin + '/noi-dung/' + bv.ID}">
                            <i class="fab fa-facebook-f"></i> Facebook
                        </button>

                        <!-- Nút sao chép liên kết -->
                        <button
                    onclick="navigator.clipboard.writeText('${window.location.origin + '/noi-dung/' + bv.ID}')
                        .then(() => {
                            const toast = document.createElement('div');
                            toast.id = 'copied-toast';
                            toast.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white px-4 py-2 rounded shadow-lg z-50';
                            toast.textContent = 'Đã sao chép liên kết!';
                            document.body.appendChild(toast);
                            setTimeout(() => {
                                toast.remove();
                            }, 2000);
                        });"
                    class="flex items-center gap-2 px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition">
                    <i class="fas fa-copy"></i> Sao chép liên kết
                </button>

    </div>
</div>


                </div>`;

            $("#baivietContainer").html(html);
            $("#tenMucLuc").replaceWith(`
                <p id="tenMucLuc" class="text-red-700 font-bold text-xl uppercase mb-2">
                    ${tenMucLuc}
                </p>`);

            if (Array.isArray(bv.BaiVietsCungMuc) && bv.BaiVietsCungMuc.length > 0) {
                const baiVietKhac = bv.BaiVietsCungMuc
                    .filter(item => item.ID !== bv.ID)
                    .sort(() => Math.random() - 0.5)
                    .slice(0, 5);

                let htmlList = `<h2 class="text-xl font-bold text-gray-800 mb-4"></h2><div class="space-y-4">`;
                baiVietKhac.forEach(item => {
                    const tieuDe = escapeHtml((item.TieuDe || "Không có tiêu đề"));
                    const thumb = item.LinkThumbnail?.trim() || "https://navigates.vn/wp-content/uploads/2023/06/logo-dai-hoc-thu-dau-mot.jpg";
                    const ngayDang = formatDate(item.NgayDang);

                    htmlList += `
                        <a href="/bai-viet/${item.ID}" class="flex gap-4 hover:bg-gray-100 p-2 rounded transition">
                            <img src="${thumb}" class="w-28 h-20 object-cover rounded" alt="Ảnh liên quan">
                            <div class="flex-1">
                                <p class="font-semibold text-gray-800 line-clamp-2">${tieuDe}</p>
                                <p class="text-sm text-gray-500 mt-1">📅 ${ngayDang}</p>
                            </div>
                        </a>`;
                });

                htmlList += `</div>`;
                $("#mucLucBaiViet").html(htmlList);
            } else {
                $("#mucLucBaiViet").html("<p class='text-gray-500 text-sm'>Không có bài viết liên quan.</p>");
            }
        },

        error: function () {
            $("#baivietContainer").html("<p class='text-center text-red-500'>Không thể tải bài viết.</p>");
            $("#tenMucLuc").text("Không rõ");
        }
    });
});

$(document).on("click", ".btn-share-facebook", function (e) {
    e.preventDefault();
    const url = $(this).data("url");

    // Dùng Facebook Share Dialog
    const fbShareUrl = `https://www.facebook.com/dialog/share?app_id=87741124305&display=popup&href=${encodeURIComponent(url)}&redirect_uri=${encodeURIComponent(url)}`;

    window.open(fbShareUrl, "_blank", "width=600,height=500");
});

function hasViewedToday(postId) {
    const key = `viewed_${postId}`;
    const viewedData = localStorage.getItem(key);
    if (!viewedData) return false;

    const today = new Date().toDateString();
    return viewedData === today;
}

function markViewed(postId) {
    const key = `viewed_${postId}`;
    const today = new Date().toDateString();
    localStorage.setItem(key, today);
}


$(document).on("click", "aside a", function (e) {
    e.preventDefault();
    const newUrl = $(this).attr("href");
    window.location.href = newUrl;
});

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

window.addEventListener("pageshow", function (event) {
    if (event.persisted) {
        window.location.reload();
    }
});

// ==========================
// Các hàm tiện ích (Helper Functions)
// ==========================

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

function convertImagePaths(content) {
    const baseUrl = "https://bdbcl.tdmu.edu.vn";
    return content.replace(/src="\/img/g, `src="${baseUrl}/img`);
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