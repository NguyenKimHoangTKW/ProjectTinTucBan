function toSlug(str) {
    return str.toLowerCase()
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
}

$(document).ready(function () {
    // Load mục lục động
    $.ajax({
        url: "/api/v1/home/get-mucluc-with-baiviet",
        type: "GET",
        dataType: "json",
        success: function (res) {
            if (!res.success || !res.data) return;

            const nav = $("#dynamicNav");

            res.data.forEach(muc => {
                const slug = toSlug(muc.TenMucLuc);
                const ten = muc.TenMucLuc.toUpperCase();

                const link = $("<a>")
                    .attr("href", `#${slug}`)
                    .attr("data-target", slug)
                    .addClass("hover:text-blue-600 scroll-to")
                    .text(ten);

                nav.append(link);
            });
        }
    });

    // Xử lý click vào mục lục
    $(document).on("click", ".scroll-to", function (e) {
        const slug = $(this).data("target");

        if (window.location.pathname !== "/") {
            e.preventDefault();
            localStorage.setItem("scrollToSlug", slug);
            window.location.href = "/";
            return;
        }

        e.preventDefault();
        const offset = $(`#${slug}`).offset()?.top;
        if (offset) {
            $("html, body").animate({ scrollTop: offset - 100 }, 500);
        }
    });

    const btn = document.getElementById("backToTop");
    window.addEventListener("scroll", () => {
        btn.classList.toggle("hidden", window.scrollY <= 200);
    });
    btn.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    });

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
