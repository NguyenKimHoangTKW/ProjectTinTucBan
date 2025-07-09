const BASE_URL = '/api/v1/admin';
$(document).ready(function () {
    // Biến toàn cục
    let dataTableInstance = null;
    let isMobile = window.innerWidth < 768;

    // Khởi tạo các thành phần và sự kiện`${BASE_URL}
    initializeComponents();
    setupEventHandlers();
    loadFunctionList();

    /**
     * Khởi tạo các thành phần UI ban đầu
     */
    function initializeComponents() {
        // Khởi tạo Select2 nếu có
        if ($.fn.select2) {
            $(".select2").select2({
                width: '100%',
                dropdownAutoWidth: true
            });
        }

        // Thiết lập trạng thái responsive ban đầu
        adjustUIForScreenSize();
    }

    /**
     * Thiết lập các sự kiện cho trang
     */
    function setupEventHandlers() {
        // Sự kiện cho nút thêm mới
        $("#btnAddFunction").on("click", function () {
            openAddFunctionModal();
        });

        // Sự kiện cho nút lưu trong modal
        $("#btnSaveFunction").on("click", function () {
            const formMode = $("#formMode").val();
            if (formMode === "add") {
                addNewFunction();
            } else {
                updateFunction();
            }
        });

        // Sự kiện cho nút xem chi tiết
        $(document).on("click", ".btn-detail", function () {
            const id = $(this).data("id");
            openDetailFunctionModal(id);
        });

        // Sự kiện cho nút sửa
        $(document).on("click", ".btn-edit", function () {
            const id = $(this).data("id");
            openEditFunctionModal(id);
        });

        // Sự kiện cho nút xóa
        $(document).on("click", ".btn-delete", function () {
            const id = $(this).data("id");
            deleteFunction(id);
        });

        // Sự kiện tìm kiếm mobile
        $("#btnMobileSearch").on("click", function () {
            const searchTerm = $("#mobileSearch").val();
            if (dataTableInstance) {
                dataTableInstance.search(searchTerm).draw();
            }
        });

        // Xử lý Enter trong ô tìm kiếm mobile
        $("#mobileSearch").on("keypress", function (e) {
            if (e.which === 13) {
                const searchTerm = $(this).val();
                if (dataTableInstance) {
                    dataTableInstance.search(searchTerm).draw();
                }
            }
        });

        // Xử lý thay đổi kích thước màn hình
        $(window).on("resize", function () {
            const wasIsMobile = isMobile;
            isMobile = window.innerWidth < 768;

            // Chỉ điều chỉnh UI nếu đã thay đổi từ mobile <-> desktop
            if (wasIsMobile !== isMobile) {
                adjustUIForScreenSize();
            }
        });

        // Xử lý trường hợp nhấn Enter trong form
        $("#FunctionForm").on("keypress", function (e) {
            if (e.which === 13 && !e.shiftKey) {
                e.preventDefault();
                const formMode = $("#formMode").val();
                if (formMode === "add") {
                    addNewFunction();
                } else {
                    updateFunction();
                }
            }
        });
    }

    /**
     * Điều chỉnh UI dựa vào kích thước màn hình
     */
    function adjustUIForScreenSize() {
        if (dataTableInstance) {
            // Xử lý hiển thị các cột
            if (isMobile) {
                // Ẩn một số cột trên thiết bị di động
                dataTableInstance.column(3).visible(false); // Ẩn cột Mô tả
                dataTableInstance.column(4).visible(false); // Ẩn cột Ngày tạo
                dataTableInstance.column(5).visible(false); // Ẩn cột Ngày cập nhật

                // Hiển thị tìm kiếm di động
                $(".dataTables_filter").hide();
                $("#mobileSearchContainer").show();
            } else {
                // Hiển thị tất cả các cột trên desktop
                dataTableInstance.column(3).visible(true);
                dataTableInstance.column(4).visible(true);
                dataTableInstance.column(5).visible(true);

                // Hiển thị tìm kiếm mặc định của DataTables
                $(".dataTables_filter").show();
                $("#mobileSearchContainer").hide();
            }
        }

        // Điều chỉnh modal cho phù hợp với thiết bị
        if (isMobile) {
            $(".modal-dialog").css({
                "margin": "10px",
                "max-width": "calc(100% - 20px)"
            });
            $(".modal-body").css("padding", "15px 10px");
            $(".form-control").css("font-size", "14px");
            $(".btn-action").addClass("btn-block");
        } else {
            $(".modal-dialog").css({
                "margin": "1.75rem auto",
                "max-width": ""
            });
            $(".modal-body").css("padding", "");
            $(".form-control").css("font-size", "");
            $(".btn-action").removeClass("btn-block");
        }
    }

    /**
     * Tải danh sách chức năng từ API
     */
    defaultContent = "Không có dữ liệu";

    function loadFunctionList() {
        // Hiển thị loading
        showLoading();

        $.ajax({
            url: `${BASE_URL}/Get-All-Functions`,
            type: 'GET',
            dataType: 'json',
            cache: false,
            success: function (response) {
                hideLoading();

                // Xóa DataTable cũ nếu đã tồn tại
                if ($.fn.DataTable.isDataTable('#data-table')) {
                    $('#data-table').DataTable().destroy();
                }

                // Xử lý dữ liệu cho hiển thị
                let processedData = [];
                if (response.data && Array.isArray(response.data)) {
                    processedData = response.data.map(item => {
                        const newItem = { ...item };

                        // Xử lý timestamp, hỗ trợ cả camelCase và PascalCase
                        if (item.NgayTao !== undefined && !isNaN(parseInt(item.NgayTao))) {
                            newItem.NgayTao = formatDateTime(parseInt(item.NgayTao));
                        } else if (item.ngayTao !== undefined && !isNaN(parseInt(item.ngayTao))) {
                            newItem.NgayTao = formatDateTime(parseInt(item.ngayTao));
                        }

                        if (item.NgayCapNhat !== undefined && !isNaN(parseInt(item.NgayCapNhat))) {
                            newItem.NgayCapNhat = formatDateTime(parseInt(item.NgayCapNhat));
                        } else if (item.ngayCapNhat !== undefined && !isNaN(parseInt(item.ngayCapNhat))) {
                            newItem.NgayCapNhat = formatDateTime(parseInt(item.ngayCapNhat));
                        }

                        return newItem;
                    });
                }

                // Khởi tạo DataTable với dữ liệu
                dataTableInstance = $('#data-table').DataTable({
                    data: processedData || [],
                    columns: [
                        {
                            data: null,
                            render: function (data, type, row, meta) {
                                return meta.row + meta.settings._iDisplayStart + 1;
                            }
                        },
                        {
                            data: 'TenChucNang',
                            defaultContent
                        },
                        {
                            data: 'MaChucNang',
                            defaultContent
                        },
                        {
                            data: 'NgayTao',
                            defaultContent
                        },
                        {
                            data: 'NgayCapNhat',
                            defaultContent
                        },
                        {
                            data: null,
                            orderable: false,
                            className: 'text-center action-column',
                            render: function (data) {
                                return `
                                    <div class="action-buttons">
                                        <button class="btn-action btn-detail" data-id="${data.ID}" title="Xem chi tiết">
                                            <i class="anticon anticon-eye"></i>
                                        </button>
                                        <button class="btn-action btn-edit" data-id="${data.ID}" title="Sửa">
                                            <i class="anticon anticon-edit"></i>
                                        </button>
                                        <button class="btn-action btn-delete" data-id="${data.ID}" title="Xóa">
                                            <i class="anticon anticon-delete"></i>
                                        </button>
                                    </div>
                                `;
                            }
                        }
                    ],
                    responsive: true,
                    pageLength: 5,
                    lengthMenu: [[5, 10, 25, 50, -1], [5, 10, 25, 50, "Tất cả"]],
                    language: {
                        paginate: {
                            next: "Tiếp",
                            previous: "Trước"
                        },
                        search: "Tìm nhanh:",
                        lengthMenu: "Hiển thị _MENU_ mục",
                        emptyTable: "Không có dữ liệu",
                        zeroRecords: "Không tìm thấy kết quả phù hợp",
                        info: "Hiển thị _START_ đến _END_ của _TOTAL_ mục",
                        infoEmpty: "Hiển thị 0 đến 0 của 0 mục",
                        infoFiltered: "(lọc từ _MAX_ mục)"
                    },
                    dom: '<"row"<"col-sm-12 col-md-6"l><"col-sm-12 col-md-6"f>>' +
                        '<"row"<"col-sm-12"tr>>' +
                        '<"row"<"col-sm-12 col-md-5"i><"col-sm-12 col-md-7"p>>',
                    initComplete: function () {

                        // Áp dụng cài đặt responsive
                        adjustUIForScreenSize();
                    },
                    drawCallback: function () {
                        // Đảm bảo các nút action được bọc đúng
                        $(".action-column").each(function () {
                            const $buttons = $(this).find(".btn-action");
                            if ($buttons.length > 0 && !$(this).find(".action-buttons").length) {
                                $buttons.wrapAll('<div class="action-buttons"></div>');
                            }
                        });
                    }
                });

                // Hiển thị thông báo nếu không có dữ liệu
                if (processedData.length === 0) {
                    showNotification("info", "Không có dữ liệu chức năng admin");
                }
            },
            error: function (xhr, status, error) {
                hideLoading();
                showNotification("error", "Không thể tải danh sách: " + xhr.statusText);
            }
        });
    }

    /**
     * Mở modal thêm mới chức năng
     */
    function openAddFunctionModal() {
        // Reset form
        $("#FunctionForm")[0].reset();
        $("#functionId").val("");
        $("#formMode").val("add");

        // Cập nhật tiêu đề
        $("#FunctionModalLabel").text("Thêm chức năng admin mới");
        $("#btnSaveText").text("Thêm mới");

        // Ẩn các trường chỉ hiển thị khi sửa
        $("#editOnlyFields").hide();

        // Xóa các thông báo lỗi validation nếu có
        $(".is-invalid").removeClass("is-invalid");
        $(".invalid-feedback").remove();

        // Hiển thị modal
        $("#FunctionModal").modal("show");

        // Focus vào ô nhập đầu tiên sau khi modal hiển thị
        $("#FunctionModal").on("shown.bs.modal", function () {
            $("#tenFunction").focus();

        });
    }

    /**
     * Mở modal chỉnh sửa chức năng
     */
    async function openEditFunctionModal(functionId) {
        try {
            showLoading();
            loadMenuTable();


            const response = await $.ajax({
                url: `${BASE_URL}/Get-All-Functions`,
                type: 'GET'
            });

            hideLoading();

            if (response.success && response.data) {
                // Tìm chức năng theo ID
                const functionData = response.data.find(item => item.ID === functionId);

                if (!functionData) {
                    showNotification("error", "Không tìm thấy thông tin chức năng admin");
                    return;
                }

                // Thiết lập mode và ID
                $("#formMode").val("edit");
                $("#functionId").val(functionData.ID);

                // Điền dữ liệu vào form
                $("#tenFunction").val(functionData.TenChucNang);
                $("#maFunction").val(functionData.MaChucNang);
                $("#moTa").val(functionData.MoTa);

                // Xử lý timestamp
                let ngayTao = functionData.NgayTao || functionData.ngayTao;
                let ngayCapNhat = functionData.NgayCapNhat || functionData.ngayCapNhat;

                // Format và hiển thị timestamp
                $("#ngayTao").val(ngayTao ? formatDateTime(parseInt(ngayTao)) : "N/A");
                $("#ngayCapNhat").val(ngayCapNhat ? formatDateTime(parseInt(ngayCapNhat)) : "N/A");

                // Cập nhật tiêu đề
                $("#FunctionModalLabel").text("Cập nhật chức năng admin");
                $("#btnSaveText").text("Cập nhật");

                // Hiển thị trường thời gian
                $("#editOnlyFields").show();

                // Xóa các thông báo lỗi validation nếu có
                $(".is-invalid").removeClass("is-invalid");
                $(".invalid-feedback").remove();

                // Hiển thị modal
                loadFunctionMenus(functionId);
                $("#FunctionModal").modal("show");

            } else {
                showNotification("error", "Không thể tải thông tin chức năng admin");
            }
        } catch (error) {
            hideLoading();
            showNotification("error", "Không thể tải thông tin chức năng admin");
        }
    }
    //Mở modal xem chi tiết chức năng
    async function openDetailFunctionModal(functionId) {
        try {
            showLoading();

            const response = await $.ajax({
                url: `${BASE_URL}/Get-All-Functions`,
                type: 'GET'
            });

            hideLoading();

            if (response.success && response.data) {
                // Tìm chức năng theo ID
                const functionData = response.data.find(item => item.ID === functionId);

                if (!functionData) {
                    showNotification("error", "Không tìm thấy thông tin chức năng admin");
                    return;
                }

                // Cập nhật tiêu đề
                $("#detailFunctionModalLabel").text("Chi tiết chức năng admin");

                // Điền dữ liệu vào form
                $("#detailTenFunction").text(functionData.TenChucNang || defaultContent);
                $("#detailMaFunction").text(functionData.MaChucNang || defaultContent);
                $("#detailMoTa").text(functionData.MoTa || defaultContent);

                // Xử lý timestamp
                let ngayTao = functionData.NgayTao || functionData.ngayTao;
                let ngayCapNhat = functionData.NgayCapNhat || functionData.ngayCapNhat;

                // Format và hiển thị timestamp
                $("#detailNgayTao").text(ngayTao ? formatDateTime(parseInt(ngayTao)) : "N/A");
                $("#detailNgayCapNhat").text(ngayCapNhat ? formatDateTime(parseInt(ngayCapNhat)) : "N/A");

                // Hiển thị modal
                $("#detailFunctionModal").modal("show");
            } else {
                showNotification("error", "Không thể tải thông tin chức năng admin");
            }
        } catch (error) {
            hideLoading();
            showNotification("error", "Không thể tải thông tin chức năng admin");
        }
    }

    //Thêm chức năng mới

    async function addNewFunction() {
        // Validate form trước khi submit
        if (!validateForm()) {
            return;
        }

        const tenFunction = $("#tenFunction").val().trim();
        const maFunction = $("#maFunction").val().trim();
        const moTa = $("#moTa").val().trim();

        try {
            showLoading();

            const res = await $.ajax({
                url: `${BASE_URL}/Create-Function`,
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({
                    TenChucNang: tenFunction,
                    MaChucNang: maFunction,
                    MoTa: moTa
                })
            });

            hideLoading();

            // Xử lý phản hồi từ API
            if (res.success) {
                // Đóng modal
                $("#FunctionModal").modal("hide");

                // Sử dụng Sweet_Alert để hiển thị thông báo thành công
                Sweet_Alert("success", res.message || "Thêm chức năng thành công");

                // Tải lại danh sách để cập nhật dữ liệu mới
                loadFunctionList();
            } else {
                // Hiển thị lỗi cụ thể từ API (ví dụ: trùng tên, trùng mã)
                Sweet_Alert("error", res.message || "Không thể thêm chức năng");
            }
        } catch (error) {

            hideLoading();

            // Xử lý lỗi từ server nếu có
            let errorMessage = "Đã xảy ra lỗi khi thêm chức năng";

            // Trích xuất thông báo lỗi từ response nếu có
            if (error.responseJSON) {
                if (error.responseJSON.message) {
                    errorMessage = error.responseJSON.message;
                } else if (error.responseJSON.error) {
                    errorMessage = error.responseJSON.error;
                }
            }

            // Sử dụng Sweet_Alert để hiển thị thông báo lỗi
            Sweet_Alert("error", errorMessage);
        }
    }

    /**
     * Cập nhật chức năng
     */
    async function updateFunction() {
        // Validate form trước khi submit
        if (!validateForm()) {
            return;
        }

        const functionId = $("#functionId").val();
        const tenFunction = $("#tenFunction").val().trim();
        const maFunction = $("#maFunction").val().trim();
        const moTa = $("#moTa").val().trim();
        // Get selected menu IDs
        const selectedMenuIds = getSelectedMenuIds();

        try {
            showLoading();

            const res = await $.ajax({
                url: `${BASE_URL}/Update-Function/${functionId}`,
                type: 'PUT',
                contentType: 'application/json',
                data: JSON.stringify({
                    Function: {
                        ID: parseInt(functionId),
                        TenChucNang: tenFunction,
                        MaChucNang: maFunction,
                        MoTa: moTa
                    },
                    MenuIds: selectedMenuIds
                })
            });

            hideLoading();

            if (res.success) {
                $("#FunctionModal").modal("hide");
                showNotification("success", res.message || "Cập nhật chức năng admin thành công");
                loadFunctionList();
            } else {
                showNotification("error", res.message || "Không thể cập nhật chức năng admin");
            }
        } catch (error) {
            hideLoading();

            let errorMessage = "Đã xảy ra lỗi khi cập nhật chức năng admin";
            if (error.responseJSON && error.responseJSON.message) {
                errorMessage = error.responseJSON.message;
            }

            showNotification("error", errorMessage);
        }
    }

    /**
     * Xóa chức năng
     */
    function deleteFunction(functionId) {
        Swal.fire({
            title: 'Xác nhận xóa?',
            text: "Bạn có chắc chắn muốn xóa chức năng admin này?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Xác nhận xóa',
            cancelButtonText: 'Hủy',
            allowOutsideClick: false,
            allowEscapeKey: false,
            // Responsive
            customClass: {
                popup: isMobile ? 'swal2-small-popup' : '',
                confirmButton: 'btn btn-danger',
                cancelButton: 'btn btn-secondary'
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    showLoading();

                    const res = await $.ajax({
                        url: `${BASE_URL}/Delete-Function/${functionId}`,
                        type: 'DELETE'
                    });

                    hideLoading();

                    if (res.success) {
                        showNotification("success", res.message || "Xóa chức năng admin thành công");
                        loadFunctionList();
                    } else {
                        showNotification("error", res.message || "Không thể xóa chức năng admin");
                    }
                } catch (error) {
                    hideLoading();

                    let errorMessage = "Đã xảy ra lỗi khi xóa chức năng admin";
                    if (error.responseJSON && error.responseJSON.message) {
                        errorMessage = error.responseJSON.message;
                    }

                    showNotification("error", errorMessage);
                }
            }
        });
    }

    /**
     * Validate form trước khi submit
     * @returns {boolean} - Form có hợp lệ hay không
     */
    function validateForm() {
        let isValid = true;

        // Xóa các thông báo lỗi cũ
        $(".is-invalid").removeClass("is-invalid");
        $(".invalid-feedback").remove();

        // Validate tên chức năng
        const tenFunction = $("#tenFunction").val().trim();
        if (!tenFunction) {
            $("#tenFunction").addClass("is-invalid");
            $('<div class="invalid-feedback">Vui lòng nhập tên chức năng</div>').insertAfter("#tenFunction");
            isValid = false;
        }

        // Validate mã chức năng
        const maFunction = $("#maFunction").val().trim();
        if (!maFunction) {
            $("#maFunction").addClass("is-invalid");
            $('<div class="invalid-feedback">Vui lòng nhập mã chức năng</div>').insertAfter("#maFunction");
            isValid = false;
        }

        // Validate mô tả
        const moTa = $("#moTa").val().trim();
        if (!moTa) {
            $("#moTa").addClass("is-invalid");
            $('<div class="invalid-feedback">Vui lòng nhập mô tả chức năng</div>').insertAfter("#moTa");
            isValid = false;
        }

        return isValid;
    }

    /**
     * Format thời gian từ Unix timestamp
     */
    function formatDateTime(unixTimestamp) {
        if (!unixTimestamp) return "N/A";

        try {
            const date = new Date(unixTimestamp * 1000);
            if (isNaN(date.getTime())) return "N/A";

            // Trên thiết bị di động, hiển thị định dạng ngắn gọn
            if (isMobile) {
                const day = String(date.getDate()).padStart(2, '0');
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const year = date.getFullYear();
                const hours = String(date.getHours()).padStart(2, '0');
                const minutes = String(date.getMinutes()).padStart(2, '0');
                return `${day}/${month}/${year} ${hours}:${minutes}`;
            }

            // Trên desktop, hiển thị đầy đủ
            const weekdays = ['CN', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
            const dayOfWeek = weekdays[date.getDay()];
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            const seconds = String(date.getSeconds()).padStart(2, '0');

            return `${dayOfWeek}, ${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
        } catch (error) {
            return "N/A";
        }
    }

    /**
     * Hiển thị thông báo với SweetAlert2
     */
    function showNotification(type, message) {
        const Toast = Swal.mixin({
            toast: true,
            position: isMobile ? "bottom" : "top-end",
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            didOpen: (toast) => {
                toast.addEventListener('mouseenter', Swal.stopTimer);
                toast.addEventListener('mouseleave', Swal.resumeTimer);
            },
            customClass: {
                popup: isMobile ? 'swal2-mobile-toast' : ''
            }
        });

        Toast.fire({
            icon: type,
            title: message
        });
    }

    /**
     * Hiển thị overlay loading
     */
    function showLoading() {
        Swal.fire({
            title: 'Đang xử lý...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            },
            showConfirmButton: false,
            backdrop: 'rgba(0,0,0,0.4)',
            customClass: {
                popup: isMobile ? 'swal2-small-popup' : ''
            }
        });
    }

    /**
     * Ẩn overlay loading
     */
    function hideLoading() {
        Swal.close();
    }

    // Thêm CSS cho responsive
    const responsiveCSS = `
        @media (max-width: 767px) {
            .swal2-small-popup {
                width: 85% !important;
                font-size: 14px !important;
            }
            
            .swal2-mobile-toast {
                width: 90% !important;
                margin: 0 auto !important;
            }
            
            .dataTables_info, .dataTables_paginate {
                text-align: center !important;
                float: none !important;
                display: block !important;
                margin: 10px 0 !important;
            }
            
            .dataTables_paginate .paginate_button {
                padding: 7px 10px !important;
            }
            
            .action-buttons {
                display: flex;
                flex-direction: column;
                align-items: center;
            }
            
            .action-buttons .btn-action {
                margin: 3px 0;
                width: 100%;
                padding: 6px 8px;
            }
        }
        
        .action-column {
            white-space: nowrap;
        }
    `;

    // Thêm CSS vào trang
    $("<style>")
        .prop("type", "text/css")
        .html(responsiveCSS)
        .appendTo("head");
});

// Load menu

function loadMenuTable() {
    console.log("Loading menu table...");
    const tableBody = $('#menuSelectionTable tbody');

    // Check if the table exists
    if (tableBody.length === 0) {
        console.error("Menu selection table not found in DOM");
        return;
    }

    tableBody.html('<tr><td colspan="3" class="text-center">Đang tải danh sách menu...</td></tr>');

    // Use jQuery AJAX for consistency with your other code
    $.ajax({
        url: `${BASE_URL}/get-menus`,
        type: 'GET',
        dataType: 'json',
        success: function (data) {
            console.log("Menu data loaded:", data);
            if (data && data.length > 0) {
                let tableContent = '';

                data.forEach((menu, index) => {
                    tableContent += `
                    <tr>
                        <td style="text-align: center;">
                            <div class="custom-control custom-checkbox">
                                <input type="checkbox" class="custom-control-input menu-checkbox" 
                                       id="menu${menu.MenuId}" value="${menu.MenuId}">
                                <label class="custom-control-label" for="menu${menu.MenuId}"></label>
                            </div>
                        </td>
                        <td>${menu.MenuName}</td>
                        <td>${menu.MenuLink || ''}</td>
                    </tr>`;
                });

                tableBody.html(tableContent);
            } else {
                tableBody.html('<tr><td colspan="3" class="text-center">Không có menu nào</td></tr>');
            }
        },
        error: function (xhr, status, error) {
            console.error("Error loading menus:", error);
            tableBody.html(`<tr><td colspan="3" class="text-center text-danger">Lỗi: ${error}</td></tr>`);
        }
    });
}

async function loadFunctionMenus(functionId) {
    try {
        console.log("Loading function menus for function ID:", functionId);

        // First load menus table (wait for it to complete)
        await loadMenuTable();

        // Then fetch the function's associated menus
        const response = await $.ajax({
            url: `${BASE_URL}/function-menus/${functionId}`,
            type: 'GET'
        });

        console.log("Function menus loaded:", response);

        if (response && Array.isArray(response)) {
            // Get menu IDs from the response
            const menuIds = response.map(item => item.MenuId.toString());
            console.log("Menu IDs to check:", menuIds);

            // Set the checkboxes based on the menu IDs
            setTimeout(() => {
                setSelectedMenus(menuIds);
            }, 300); // Small delay to ensure menu table is fully loaded
        }
    } catch (error) {
        console.error("Error loading function menus:", error);
    }
}


// Function to get selected menu IDs
function getSelectedMenuIds() {
    const selectedIds = [];
    $('#menuSelectionTable .menu-checkbox:checked').each(function () {
        selectedIds.push($(this).val());
    });
    return selectedIds;
}

// Function to set selected menus
function setSelectedMenus(menuIds) {
    console.log("Setting selected menus:", menuIds);

    // Clear all selections first
    $('#menuSelectionTable .menu-checkbox').prop('checked', false);

    // Set checked for the provided IDs
    if (menuIds && menuIds.length > 0) {
        menuIds.forEach(id => {
            const checkbox = $(`#menu${id}`);
            if (checkbox.length) {
                checkbox.prop('checked', true);
                console.log(`Checkbox for menu ${id} checked`);
            } else {
                console.warn(`Checkbox for menu ${id} not found`);
            }
        });
    }
}

// Display SweetAlert notifications
function Sweet_Alert(icon, title) {
    Swal.fire({
        position: "center",
        icon: icon,
        title: title,
        showConfirmButton: false,
        timer: 2500
    });
}