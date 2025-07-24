$(document).ready(function () {
    var dataTable;
    var isProcessingToggle = false;

    // Sự kiện sửa
    $(document).on('click', '.btn-sua-footer', function () {
        var id = $(this).data('id');
        // Chuyển hướng sang đúng controller/action
        window.location.href = '/Admin/Footer/EditFooter?id=' + id;
    });

    // Sự kiện xóa
    $(document).on('click', '.btn-xoa-footer', function () {
        var id = $(this).data('id');
        if (typeof Swal !== "undefined") {
            Swal.fire({
                title: 'Bạn có chắc muốn xóa footer này?',
                text: "Hành động này không thể hoàn tác!",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Xóa',
                cancelButtonText: 'Hủy'
            }).then((result) => {
                if (result.isConfirmed) {
                    $.ajax({
                        url: '/api/v1/admin/footer/' + id,
                        type: 'DELETE',
                        success: function () {
                            loadFooter();
                            Swal.fire({
                                icon: 'success',
                                title: 'Đã xóa thành công!',
                                showConfirmButton: false,
                                timer: 2000
                            });
                        },
                        error: function () {
                            Swal.fire({
                                icon: 'error',
                                title: 'Lỗi xóa footer!',
                                showConfirmButton: false,
                                timer: 2000
                            });
                        }
                    });
                }
            });
        }
    });

    // Sự kiện thay đổi trạng thái
    $(document).on('change', '.toggle-active', function () {
        if (isProcessingToggle) {
            $(this).prop('checked', !$(this).is(':checked'));
            return;
        }

        var $checkbox = $(this);
        var id = $checkbox.data('id');
        var isChecked = $checkbox.is(':checked');

        performToggleAction(id, isChecked, $checkbox);
    });

    // Hàm thực hiện toggle action
    function performToggleAction(id, isChecked, $checkbox) {
        isProcessingToggle = true;
        $('.toggle-active').prop('disabled', true);

        $checkbox.closest('td').append('<div class="toggle-loading"><i class="anticon anticon-loading anticon-spin"></i></div>');

        $.ajax({
            url: '/api/v1/admin/footer/' + id + '/active',
            type: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify({ IsActive: isChecked ? 1 : 0 }),
            success: function (response) {
                // Luôn reload lại bảng để đồng bộ trạng thái
                forceReloadFooterData();
            },
            error: function (xhr) {
                // Fallback cũng phải reload lại bảng
                performToggleActionFallback(id, isChecked, $checkbox);
            },
            complete: function () {
                $('.toggle-loading').remove();
                isProcessingToggle = false;
            }
        });
    }

    // Fallback method - Cập nhật từng footer riêng lẻ
    function performToggleActionFallback(id, isChecked, $checkbox) {
        if (isChecked) {
            // Bước 1: Lấy danh sách tất cả footer
            $.ajax({
                url: '/api/v1/admin/footer',
                type: 'GET',
                success: function (allFooters) {
                    var updatePromises = [];

                    // Bước 2: Tắt tất cả footer khác
                    allFooters.forEach(function (footer) {
                        if (footer.ID != id && (footer.IsActive === 1 || footer.IsActive === true)) {
                            var updateData = Object.assign({}, footer, { IsActive: 0 });

                            var promise = $.ajax({
                                url: '/api/v1/admin/footer/' + footer.ID,
                                type: 'PUT',
                                contentType: 'application/json',
                                data: JSON.stringify(updateData)
                            });
                            updatePromises.push(promise);
                        }
                    });

                    // Bước 3: Sau khi tắt hết, bật footer hiện tại
                    Promise.all(updatePromises).then(function () {
                        updateCurrentFooter(id, isChecked);
                    }).catch(function (error) {
                        updateCurrentFooter(id, isChecked);
                    });
                },
                error: function () {
                    updateCurrentFooter(id, isChecked);
                }
            });
        } else {
            // Chỉ tắt footer hiện tại
            updateCurrentFooter(id, isChecked);
        }
    }

    function updateCurrentFooter(id, isChecked) {
        $.ajax({
            url: '/api/v1/admin/footer/' + id,
            type: 'GET',
            success: function (currentFooter) {
                var updateData = Object.assign({}, currentFooter, { IsActive: isChecked ? 1 : 0 });

                $.ajax({
                    url: '/api/v1/admin/footer/' + id,
                    type: 'PUT',
                    contentType: 'application/json',
                    data: JSON.stringify(updateData),
                    success: function () {
                        // Bỏ thông báo thành công
                        forceReloadFooterData();
                    },
                    error: function (xhr) {
                        // Bỏ thông báo lỗi
                    }
                });
            }
        });
    }

    // HÀM RELOAD DỮ LIỆU
    function forceReloadFooterData() {
        var timestamp = new Date().getTime();

        $.ajax({
            url: '/api/v1/admin/footer?_=' + timestamp,
            type: 'GET',
            cache: false,
            success: function (data) {
                // Clear và reload DataTable
                dataTable.clear();
                dataTable.rows.add(data);
                dataTable.draw();

                // Enable lại tất cả checkbox
                setTimeout(function () {
                    $('.toggle-active').prop('disabled', false);
                }, 300);
            },
            error: function (xhr) {
                // Bỏ thông báo lỗi
                // Vẫn enable lại checkbox dù có lỗi
                setTimeout(function () {
                    $('.toggle-active').prop('disabled', false);
                }, 300);
            }
        });
    }

    function initDataTable() {
        dataTable = $('#table_load_footer').DataTable({
            "processing": true,
            "serverSide": false,
            "searching": true,
            "ordering": true,
            "paging": true,
            "lengthMenu": [5, 10, 20, 50],
            "data": [],
            "columns": [
                { "data": "ID", "visible": false },
                {
                    "data": null,
                    "orderable": false,
                    "searchable": false,
                    "render": function (data, type, row, meta) {
                        return meta.row + meta.settings._iDisplayStart + 1;
                    }
                },
                { "data": "FullName" },
                { "data": "EnglishName" },
                { "data": "DiaChi" },
                { "data": "DienThoai" },
                { "data": "Email" },
                {
                    "data": "NgayThanhLap",
                    "render": function (data) {
                        return unixToDateStr(data);
                    }
                },
                {
                    "data": "IsActive",
                    "orderable": false,
                    "render": function (data, type, row) {
                        // CHỈ HIỂN THỊ TOGGLE SWITCH KHÔNG CÓ TEXT TRẠNG THÁI
                        var isActive = (data === 1 || data === true || data === "1");
                        var checked = isActive ? "checked" : "";

                        return `
                            <div class="text-center">
                                <label class="switch">
                                    <input type="checkbox" class="toggle-active" data-id="${row.ID}" ${checked}>
                                    <span class="slider"></span>
                                </label>
                            </div>
                        `;
                    }
                },
                {
                    "data": null,
                    "orderable": false,
                    "render": function (data) {
                        return `
                            <div class="text-center d-flex flex-row justify-content-center">
                                <button class="btn-action btn-edit btn-sua-footer" data-id="${data.ID}" title="Sửa">
                                    <i class="anticon anticon-edit"></i>
                                </button>
                                <button class="btn-action btn-delete btn-xoa-footer" data-id="${data.ID}" title="Xóa">
                                    <i class="anticon anticon-delete"></i>
                                </button>
                            </div>
                        `;
                    }
                }
            ],
            "order": []
        });
    }

    // Load danh sách Footer
    function loadFooter() {
        forceReloadFooterData();
    }

    // Sự kiện mở modal thêm mới
    $('#btnShowFooterModal').click(function () {
        $('#ID').val('');
        $('#footerForm')[0].reset();
        $('#IsActive').val("true");
        $('#footerModal').modal('show');
    });

    // Sự kiện submit form (thêm/sửa)
    $('#footerForm').submit(function (e) {
        e.preventDefault();
        // Xóa thông báo lỗi cũ
        $('.field-validation-error').remove();

        var id = $('#ID').val();
        var ngayThanhLapStr = $('#NgayThanhLap').val();
        var dienThoai = $('#DienThoai').val();
        var isValid = true;

        // Validate ngày thành lập: phải đúng định dạng dd/MM/yyyy
        var dateRegex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;
        if (!dateRegex.test(ngayThanhLapStr)) {
            $('#NgayThanhLap').after('<span class="field-validation-error text-danger">Ngày thành lập phải đúng định dạng dd/MM/yyyy.</span>');
            isValid = false;
        }

        // Validate số điện thoại: cho phép ký tự đặc biệt, không bắt buộc bắt đầu bằng 0
        var phoneRegex = /^[0-9\s\-\(\)]+$/;
        if (dienThoai && !phoneRegex.test(dienThoai)) {
            $('#DienThoai').after('<span class="field-validation-error text-danger">Số điện thoại chỉ được chứa số, khoảng trắng, dấu ngoặc và dấu gạch ngang.</span>');
            isValid = false;
        }

        if (!isValid) {
            return false;
        }

        var data = {
            FullName: $('#FullName').val(),
            EnglishName: $('#EnglishName').val(),
            DiaChi: $('#DiaChi').val(),
            DienThoai: dienThoai,
            Email: $('#Email').val(),
            NgayThanhLap: parseDateToUnix(ngayThanhLapStr),
            VideoUrl: $('#VideoUrl').val(),
            FooterCopyright: $('#FooterCopyright').val(),
            FooterNote: $('#FooterNote').val()
        };
        if (id) {
            // Sửa
            $.ajax({
                url: '/api/v1/admin/footer/' + id,
                type: 'PUT',
                contentType: 'application/json',
                data: JSON.stringify(data),
                success: function () {
                    $('#footerForm')[0].reset();
                    $('#ID').val('');
                    $('#footerModal').modal('hide');
                    loadFooter();
                    // Bỏ thông báo thành công
                },
                error: function () {
                    // Bỏ thông báo lỗi
                }
            });
        } else {
            // Thêm mới
            $.ajax({
                url: '/api/v1/admin/footer/',
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify(data),
                success: function () {
                    $('#footerForm')[0].reset();
                    $('#footerModal').modal('hide');
                    loadFooter();
                    // Bỏ thông báo thành công
                },
                error: function () {
                    // Bỏ thông báo lỗi
                }
            });
        }
    });

    // Hàm chuyển "dd/MM/yyyy" sang Unix timestamp (UTC 00:00:00)
    function parseDateToUnix(dateStr) {
        if (!dateStr) return null;
        var parts = dateStr.split('/');
        if (parts.length !== 3) return null;
        var d = new Date(Date.UTC(parts[2], parts[1] - 1, parts[0], 0, 0, 0));
        if (isNaN(d.getTime())) return null;
        return Math.floor(d.getTime() / 1000);
    }

    // Hàm chuyển unix timestamp sang chuỗi ngày dd/MM/yyyy
    function unixToDateStr(unix) {
        if (!unix) return "";
        var d = new Date(unix * 1000);
        var day = ("0" + d.getDate()).slice(-2);
        var month = ("0" + (d.getMonth() + 1)).slice(-2);
        var year = d.getFullYear();
        return day + "/" + month + "/" + year;
    }

    // CSS cho loading indicator - BỎ BADGE STYLES
    var toggleLoadingCSS = `
<style>
.toggle-loading {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 1000;
    background: rgba(255, 255, 255, 0.8);
    border-radius: 50%;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.toggle-loading i {
    font-size: 16px;
    color: #5a8dee;
}

.switch {
    position: relative;
}

.toggle-active:disabled + .slider {
    opacity: 0.6;
    cursor: not-allowed;
}

.toggle-active:disabled + .slider:before {
    background-color: #ccc;
}
</style>
`;

    // Thêm CSS vào head
    if (!$('#toggle-loading-styles').length) {
        $('head').append('<div id="toggle-loading-styles">' + toggleLoadingCSS + '</div>');
    }

    // Khởi tạo bảng và load dữ liệu
    initDataTable();
    loadFooter();
}); // Thiết lập ngôn ngữ mặc định cho tất cả DataTable
$.extend(true, $.fn.dataTable.defaults, {
    language: {
        "decimal": "",
        "emptyTable": "Không có dữ liệu trong bảng",
        "info": "Hiển thị _START_ đến _END_ của _TOTAL_ mục",
        "infoEmpty": "Hiển thị 0 đến 0 của 0 mục",
        "infoFiltered": "(được lọc từ _MAX_ tổng số mục)",
        "infoPostFix": "",
        "thousands": ",",
        "lengthMenu": "Hiển thị _MENU_ mục",
        "loadingRecords": "Đang tải...",
        "processing": "Đang xử lý...",
        "search": "Tìm kiếm:",
        "zeroRecords": "Không tìm thấy kết quả phù hợp",
        "paginate": {
            "first": "Đầu",
            "last": "Cuối",
            "next": "Tiếp",
            "previous": "Trước"
        },
        "aria": {
            "sortAscending": ": Kích hoạt để sắp xếp cột tăng dần",
            "sortDescending": ": Kích hoạt để sắp xếp cột giảm dần"
        }
    }
});