$(function () {
    function showSwal(message, type) {
        Swal.fire({
            icon: type,
            title: message,
            timer: 2000,
            showConfirmButton: false
        });
    }

    // Load danh sách slide
    function loadSlides() {
        $.getJSON(`${BASE_URL}/get-slides`, function (data) {
            const $list = $('#slider-list').empty();
            if (!data || !data.length) {
                $list.append('<tr><td colspan="6" class="text-center">Không có dữ liệu</td></tr>');
                return;
            }
            data.forEach((slide, idx) => {
                $list.append(`
                    <tr>
                        <td class="text-center">${idx + 1}</td>
                        <td class="text-center"><img src="${slide.LinkHinh}" alt="slide" style="max-width:120px;max-height:60px"></td>
                        <td class="text-center">
                            <button class="btn btn-sm btn-light btn-increase-order" data-id="${slide.ID}" title="Tăng">
                                <i class="fa fa-arrow-up"></i>
                            </button>
                            <span class="mx-2">${slide.ThuTuShow ?? ''}</span>
                            <button class="btn btn-sm btn-light btn-decrease-order" data-id="${slide.ID}" title="Giảm">
                                <i class="fa fa-arrow-down"></i>
                            </button>
                        </td>
                        <td class="text-center">
                            <input type="checkbox" class="toggle-active" data-id="${slide.ID}" ${slide.isActive ? 'checked' : ''} />
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
        });
    }

    // Lấy danh sách khi load trang
    loadSlides();

    // Xem trước ảnh khi chọn file (thêm)
    $('#addLinkHinh').on('change', function () {
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

    // Xem trước ảnh khi chọn file (sửa)
    $('#editLinkHinh').on('change', function () {
        const file = this.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                $('#editPreviewImg').attr('src', e.target.result).show();
            };
            reader.readAsDataURL(file);
        } else {
            $('#editPreviewImg').hide();
        }
    });

    // Thêm slide (upload file trước, lấy link rồi mới gọi API thêm slide)
    $('#add-slide-form').submit(function (e) {
        e.preventDefault();
        const fileInput = $('#addLinkHinh')[0];
        if (fileInput.files.length === 0) {
            showSwal('Vui lòng chọn hình ảnh!', 'warning');
            return;
        }
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
                    // Sau khi upload thành công, gọi API thêm slide
                    const isActive = $('#addIsActive').is(':checked');
                    $.ajax({
                        url: `${BASE_URL}/add-slide`,
                        method: 'POST',
                        contentType: 'application/json',
                        data: JSON.stringify({
                            LinkHinh: res.link,
                            isActive: isActive
                        }),
                        success: function (res2) {
                            if (res2.success) {
                                $('#add-slide-form')[0].reset();
                                $('#addSlideModal').modal('hide');
                                $('#addPreviewImg').hide();
                                showSwal(res2.message, 'success');
                                loadSlides();
                            } else {
                                showSwal(res2.message || 'Thêm thất bại', 'error');
                            }
                        },
                        error: function (xhr) {
                            showSwal('Lỗi: ' + xhr.responseText, 'error');
                        }
                    });
                } else {
                    showSwal('Upload ảnh thất bại!', 'error');
                }
            },
            error: function () {
                showSwal('Upload ảnh thất bại!', 'error');
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
                        showSwal(res2.message, 'success');
                        loadSlides();
                    } else {
                        showSwal(res2.message || 'Cập nhật thất bại', 'error');
                    }
                },
                error: function (xhr) {
                    showSwal('Lỗi: ' + xhr.responseText, 'error');
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
                        showSwal('Upload ảnh thất bại!', 'error');
                    }
                },
                error: function () {
                    showSwal('Upload ảnh thất bại!', 'error');
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
                            showSwal(res.message, 'success');
                            loadSlides();
                        } else {
                            showSwal(res.message || 'Xóa thất bại', 'error');
                        }
                    },
                    error: function () {
                        showSwal('Có lỗi xảy ra khi xóa!', 'error');
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
                    showSwal(res.message || 'Không thể tăng thứ tự', 'error');
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
                    showSwal(res.message || 'Không thể giảm thứ tự', 'error');
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
                    showSwal(res.message || 'Cập nhật trạng thái thành công', 'success');
                    loadSlides();
                } else {
                    showSwal(res.message || 'Cập nhật trạng thái thất bại', 'error');
                }
            },
            error: function () {
                showSwal('Có lỗi khi cập nhật trạng thái!', 'error');
            }
        });
    });

    // Mở modal thêm
    $('#openAddSlideModal').click(() => $('#addSlideModal').modal('show'));
    $('#closeAddSlideModal, #closeAddSlideModalFooter').click(() => $('#addSlideModal').modal('hide'));
    $('#closeEditSlideModal, #closeEditSlideModalFooter').click(() => $('#editSlideModal').modal('hide'));
});