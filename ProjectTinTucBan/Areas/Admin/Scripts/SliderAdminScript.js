$(function () {
    

    // Load danh sách slide
    function loadSlides() {
        $.getJSON(`${BASE_URL}/get-slides`, function (data) {
            const $list = $('#slider-list').empty();
            if (!data || !data.length) {
                $list.append('<tr><td colspan="6" class="text-center">Không có dữ liệu</td></tr>');
                return;
            }
            const maxOrder = Math.max(...data.map(slide => slide.ThuTuShow));
            data.forEach((slide, idx) => {
                const increaseBtn = (slide.ThuTuShow === 1)
                    ? '<div class="empty-order-btn"></div>'
                    : `<button class="btn-order up btn btn-light btn-sm btn-increase-order" data-id="${slide.ID}" title="Tăng">&#8593;</button>`;

                const decreaseBtn = (slide.ThuTuShow === maxOrder)
                    ? '<div class="empty-order-btn"></div>'
                    : `<button class="btn-order down btn btn-light btn-sm btn-decrease-order" data-id="${slide.ID}" title="Giảm">&#8595;</button>`;

                $list.append(`
            <tr>
                <td class="text-center">${idx + 1}</td>
                <td class="text-center">
                    <img src="${slide.LinkHinh}" alt="slide" style="max-width:120px;max-height:60px">
                </td>
                <td class="text-center">
                    <div class="order-controls">
                        ${increaseBtn}
                        <div class="order-number">${slide.ThuTuShow ?? ''}</div>
                        ${decreaseBtn}
                    </div>
                </td>
                <td class="text-center">
                    <label class="switch">
                        <input type="checkbox" class="toggle-active" data-id="${slide.ID}" ${slide.isActive ? 'checked' : ''} />
                        <span class="slider"></span>
                    </label>
                </td>
                <td class="text-center">
                    <button class="btn btn-warning btn-sm edit-slide-btn" 
                        data-id="${slide.ID}" 
                        data-linkhinh="${slide.LinkHinh}" 
                        data-isactive="${slide.isActive}"
                        data-target="editSlideModal">
                        Sửa
                    </button>
                    <button class="btn btn-danger btn-sm delete-slide-btn" data-id="${slide.ID}">Xóa</button>
                </td>
            </tr>
        `);
            });

            // Gọi cập nhật layout sau khi render xong
            updateOrderLayout();
        });
    }

    // Lấy danh sách khi load trang
    loadSlides();

    

    // Xem trước ảnh khi chọn file (thêm)
    $('#addLinkHinh').on('change', function () {
        const files = this.files;
        const $previewContainer = $('#addPreviewContainer');
        $previewContainer.empty(); // Xóa preview cũ

        if (files.length === 0) return;

        Array.from(files).forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = function (e) {
                const imgWrapper = $(`
                <div class="position-relative" style="width: 120px; height: 80px;">
                    <img src="${e.target.result}" alt="preview-${index}" class="img-thumbnail w-100 h-100 object-fit-cover">
                </div>
            `);
                $previewContainer.append(imgWrapper);
            };
            reader.readAsDataURL(file);
        });
    });


    // Xem trước ảnh khi chọn file (sửa)
    $('#editLinkHinh').on('change', function () {
        const file = this.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                $('#addPreviewImg').attr('src', e.target.result).show();
            };
            reader.readAsDataURL(file);
        } else {
            $('#addPreviewImg').hide();
        }
    });

    $('#add-slide-form').submit(function (e) {
        e.preventDefault();

        const fileInput = $('#addLinkHinh')[0];
        const files = fileInput.files;

        if (files.length === 0) {
            Sweet_Alert('warning', 'Vui lòng chọn ít nhất một hình ảnh!');
            return;
        }

        const isActive = $('#addIsActive').is(':checked');
        let successCount = 0;
        let failCount = 0;

        const promises = [];

        for (let i = 0; i < files.length; i++) {
            const formData = new FormData();
            formData.append('file', files[i]);

            const uploadAndAdd = $.ajax({
                url: `${BASE_URL}/upload-slide-image`,
                type: 'POST',
                data: formData,
                processData: false,
                contentType: false,
            }).then(function (res) {
                if (res.success && res.link) {
                    return $.ajax({
                        url: `${BASE_URL}/add-slide`,
                        method: 'POST',
                        contentType: 'application/json',
                        data: JSON.stringify({
                            LinkHinh: res.link,
                            isActive: isActive
                        })
                    }).then(function (res2) {
                        if (res2.success) {
                            successCount++;
                        } else {
                            failCount++;
                            console.error('Thêm thất bại:', res2.message);
                        }
                    });
                } else {
                    failCount++;
                    console.error('Upload ảnh thất bại');
                }
            }).catch(function (err) {
                failCount++;
                console.error('Lỗi upload hoặc thêm:', err);
            });

            promises.push(uploadAndAdd);
        }

        Promise.all(promises).then(() => {
            $('#add-slide-form')[0].reset();
            $('#addPreviewImg').hide();
            $('#addSlideModal').modal('hide');

            if (successCount > 0) {
                Sweet_Alert('success', `Đã thêm ${successCount} slide thành công`);
            }
            if (failCount > 0) {
                Sweet_Alert('error', `${failCount} slide thêm thất bại`);
            }
            $('#addPreviewContainer').empty();

            loadSlides();
        });
    });




    $(document).ready(function () {
        // Toggle dropdown on click
        $('[data-toggle="dropdown"]').on('click', function (e) {
            e.preventDefault();
            var $parent = $(this).closest('.dropdown');
            // Đóng các dropdown khác
            $('.dropdown').not($parent).removeClass('open');
            // Toggle dropdown hiện tại
            $parent.toggleClass('open');
        });

        // Đóng dropdown khi click ra ngoài
        $(document).on('click', function (e) {
            if (!$(e.target).closest('.dropdown').length) {
                $('.dropdown').removeClass('open');
            }
        });
    });

    // Hiển thị modal sửa
    $('#slider-list').on('click', '.edit-slide-btn', function () {
        const id = $(this).data('id');
        const linkHinh = $(this).data('linkhinh');
        const isActive = $(this).data('isactive');

        $('#editSlideId').val(id);
        $('#editIsActive').prop('checked', isActive ? true : false);

        // Reset file input
        $('#editLinkHinh').val('');
        // Lưu link cũ vào data để dùng khi không đổi ảnh
        $('#editLinkHinh').data('oldlink', linkHinh);

        // Hiển thị ảnh preview
        if (linkHinh) {
            $('#editPreviewImg').attr('src', linkHinh).show();
        } else {
            $('#editPreviewImg').hide();
        }

        $('#editSlideModal').modal('show');
    });

    // Sửa slide (nếu có file mới thì upload, không thì giữ link cũ)
    $('#edit-slide-form').submit(function (e) {
        e.preventDefault();
        const id = $('#editSlideId').val();
        const isActive = $('#editIsActive').is(':checked');
        const fileInput = $('#editLinkHinh')[0];

        function callEdit(linkHinh) {
            $.ajax({
                url: `${BASE_URL}/edit-slide`,
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({
                    ID: parseInt(id),
                    LinkHinh: linkHinh,
                    isActive: isActive
                }),
                success: function (res2) {
                    if (res2.success) {
                        $('#edit-slide-form')[0].reset();
                        $('#editSlideModal').modal('hide');
                        $('#editPreviewImg').hide();
                        Sweet_Alert('success',res2.message);
                        loadSlides();
                    } else {
                        Sweet_Alert('error',res2.message || 'Cập nhật thất bại');
                    }
                },
                error: function (xhr) {
                    Sweet_Alert('error','Lỗi: ' + xhr.responseText);
                }
            });
        }

        if (fileInput.files.length > 0) {
            const formData = new FormData();
            formData.append('file', fileInput.files[0]);
            $.ajax({
                url: `${BASE_URL}/upload-slide-image`,
                type: 'POST',
                data: formData,
                processData: false,
                contentType: false,
                success: function (res) {
                    if (res.success && res.link) {
                        callEdit(res.link);
                    } else {
                        Sweet_Alert('error','Upload ảnh thất bại!');
                    }
                },
                error: function () {
                    Sweet_Alert('error','Upload ảnh thất bại!');
                }
            });
        } else {
            // Giữ nguyên link cũ (cần lưu link cũ vào 1 biến khi mở modal sửa)
            callEdit($('#editLinkHinh').data('oldlink'));
        }
    });

    // Xóa slide
    $('#slider-list').on('click', '.delete-slide-btn', function () {
        const id = $(this).data('id');
        Swal.fire({
            title: 'Bạn có chắc chắn muốn xóa slide này?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Xóa',
            cancelButtonText: 'Hủy'
        }).then((result) => {
            if (result.isConfirmed) {
                $.ajax({
                    url: `${BASE_URL}/delete-slide`,
                    method: 'POST',
                    contentType: 'application/json',
                    data: JSON.stringify(id),
                    success: function (res) {
                        if (res.success) {
                            Sweet_Alert('success',res.message );
                            loadSlides();
                        } else {
                            Sweet_Alert('error',res.message || 'Xóa thất bại');
                        }
                    },
                    error: function () {
                        Sweet_Alert('error','Có lỗi xảy ra khi xóa!');
                    }
                });
            }
        });
    });

    // Tăng thứ tự
    $('#slider-list').on('click', '.btn-increase-order', function () {
        const id = $(this).data('id');
        $.ajax({
            url: `${BASE_URL}/change-slide-order`,
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ id: id, direction: 'up' }),
            success: function (res) {
                if (res.success) {
                    loadSlides();
                } else {
                    Sweet_Alert(res.message || 'Không thể tăng thứ tự', 'error');
                }
            }
        });
    });

    // Giảm thứ tự
    $('#slider-list').on('click', '.btn-decrease-order', function () {
        const id = $(this).data('id');
        $.ajax({
            url: `${BASE_URL}/change-slide-order`,
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ id: id, direction: 'down' }),
            success: function (res) {
                if (res.success) {
                    loadSlides();
                } else {
                    Sweet_Alert('error',res.message || 'Không thể giảm thứ tự');
                }
            }
        });
    });

    // Bật/tắt trạng thái hiển thị slide
    $('#slider-list').on('change', '.toggle-active', function () {
        const id = $(this).data('id');
        const isActive = $(this).is(':checked');
        $.ajax({
            url: `${BASE_URL}/set-slide-active`,
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ id: id, isActive: isActive }),
            success: function (res) {
                if (res.success) {
                    Sweet_Alert('success',res.message || 'Cập nhật trạng thái thành công');
                    loadSlides();
                } else {
                    Sweet_Alert('error',res.message || 'Cập nhật trạng thái thất bại');
                }
            },
            error: function () {
                Sweet_Alert('error','Có lỗi khi cập nhật trạng thái!');
            }
        });
    });

    // Mở modal thêm
    $('#openAddSlideModal').click(() => $('#addSlideModal').modal('show'));
    $('#closeAddSlideModal, #closeAddSlideModalFooter').click(() => $('#addSlideModal').modal('hide'));
    $('#closeEditSlideModal, #closeEditSlideModalFooter').click(() => $('#editSlideModal').modal('hide'));

    function updateOrderLayout() {
        const controls = document.querySelectorAll('.order-controls');

        controls.forEach(control => {
            control.classList.remove('horizontal', 'vertical');

            // Tổng chiều rộng của các phần tử con
            const totalWidth = Array.from(control.children).reduce((sum, child) => {
                return sum + child.offsetWidth + 4;
            }, 0);

            if (totalWidth <= control.offsetWidth) {
                control.classList.add('horizontal');
            } else {
                control.classList.add('vertical');
            }
        });
    }

    // Gọi khi resize màn hình
    window.addEventListener('resize', updateOrderLayout);

});
