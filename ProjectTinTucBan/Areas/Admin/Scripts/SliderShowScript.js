$(document).ready(function () {
    // Gọi API để lấy danh sách slide
    $.ajax({
        url: `/api/v1/admin/get-slides-show`,
        method: 'GET',
        success: function (slides) {
            if (!slides || slides.length === 0) return;

            // Tạo HTML cho indicators
            var indicatorsHtml = '';
            for (var i = 0; i < slides.length; i++) {
                indicatorsHtml += `<li data-target="#carouselExampleIndicators" data-slide-to="${i}"${i === 0 ? ' class="active"' : ''}></li>`;
            }

            // Tạo HTML cho các slide
            var itemsHtml = '';
            for (var j = 0; j < slides.length; j++) {
                var slide = slides[j];
                itemsHtml += `
                    <div class="carousel-item${j === 0 ? ' active' : ''}">
                        <img src="${slide.LinkHinh}"  style="height:500px; width:100%" class="d-block w-100" alt="Slide ${j + 1}">
                    </div>
                `;
            }

            // Gắn vào DOM
            var carouselHtml = `
                <div id="carouselExampleIndicators" class="carousel slide" data-ride="carousel">
                    <ol class="carousel-indicators">
                        ${indicatorsHtml}
                    </ol>
                    <div class="carousel-inner">
                        ${itemsHtml}
                    </div>
                    <a class="carousel-control-prev" href="#carouselExampleIndicators" data-slide="prev">
                        <span class="carousel-control-prev-icon"></span>
                        <span class="sr-only">Previous</span>
                    </a>
                    <a class="carousel-control-next" href="#carouselExampleIndicators" data-slide="next">
                        <span class="carousel-control-next-icon"></span>
                        <span class="sr-only">Next</span>
                    </a>
                </div>
            `;

            // Giả sử có 1 div với id="slider-container" để chứa carousel
            $('#slider-container').html(carouselHtml);
        },
        error: function () {
            $('#slider-container').html('<p>Không thể tải slide.</p>');
        }
    });
});