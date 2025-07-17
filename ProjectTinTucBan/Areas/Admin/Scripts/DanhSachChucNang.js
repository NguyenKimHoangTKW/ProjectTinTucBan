defaultContent = "Không có dữ liệu";

$(document).ready(function () {
    // Biến toàn cục
    let dataTableInstance = null;
    let isMobile = window.innerWidth < 768;

    // Khởi tạo các thành phần và sự kiện
    initializeComponents();
    setupEventHandlers();
    loadFunctionList();
    loadMenuTable();

    /**
     * Khởi tạo các thành phần UI ban đầu
     */
    function initializeComponents() {
        // Khởi tạo Select2 nếu có
        if ($.select2) {
            $(".select2").select2({
                width: '100%',
                dropdownAutoWidth: true
            });
        }

        // Thiết lập trạng thái responsive ban đầu
        adjustUIForScreenSize();

        // Focus vào ô nhập đầu tiên sau khi modal hiển thị (một lần duy nhất)
        $("#FunctionModal").on("shown.bs.modal", function () {
            $("#tenFunction").focus();
        });
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
   

    function loadFunctionList() {
        // Hiển thị loading - Sử dụng showLoading
        showLoading(null, 'Đang tải dữ liệu chức năng...');

        $.ajax({
            url: '/api/v1/admin/Get-All-Functions',
            type: 'GET',
            dataType: 'json',
            cache: false,
            success: function (response) {
                // Ẩn loading - Sử dụng hideLoading
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
                        // Escape các trường text
                        newItem.TenChucNang = escapeHtml(item.TenChucNang);
                        newItem.MaChucNang = escapeHtml(item.MaChucNang);
                        newItem.MoTa = escapeHtml(item.MoTa);

                        // Xử lý timestamp, sử dụng formatTimestamp
                        if (item.NgayTao !== undefined && !isNaN(parseInt(item.NgayTao))) {
                            newItem.NgayTao = formatTimestamp(parseInt(item.NgayTao));
                        } else if (item.ngayTao !== undefined && !isNaN(parseInt(item.ngayTao))) {
                            newItem.NgayTao = formatTimestamp(parseInt(item.ngayTao));
                        }

                        if (item.NgayCapNhat !== undefined && !isNaN(parseInt(item.NgayCapNhat))) {
                            newItem.NgayCapNhat = formatTimestamp(parseInt(item.NgayCapNhat));
                        } else if (item.ngayCapNhat !== undefined && !isNaN(parseInt(item.ngayCapNhat))) {
                            newItem.NgayCapNhat = formatTimestamp(parseInt(item.ngayCapNhat));
                        }

                        return newItem;
                    });
                }

                // Khởi tạo DataTable với dữ liệu, sử dụng dataTableDefaults
                dataTableInstance = $('#data-table').DataTable({
                    ...dataTableDefaults,
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

                // Hiển thị thông báo nếu không có dữ liệu, sử dụng Sweet_Alert
                if (processedData.length === 0) {
                    Sweet_Alert("info", "Không có dữ liệu chức năng admin");
                }
            },
            error: function (xhr, status, error) {
                // Ẩn loading - Sử dụng hideLoading
                hideLoading();

                // Hiển thị thông báo lỗi - Sử dụng Sweet_Alert
                Sweet_Alert("error", "Không thể tải danh sách: " + xhr.statusText);
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

        // Xóa checked menu (nếu có)
        $('#menuSelectionTable .menu-checkbox').prop('checked', false);

        // Xóa các giá trị cũ của trường chi tiết (nếu có)
        $("#tenFunction").val("");
        $("#maFunction").val("");
        $("#moTa").val("");
        $("#ngayTao").val("");
        $("#ngayCapNhat").val("");

        // Hiển thị modal
        $("#FunctionModal").modal("show");
    }

    /**
     * Mở modal chỉnh sửa chức năng
     */
    async function openEditFunctionModal(functionId) {
    $("#FunctionModal").modal("show");
    showLoading("#function-content", "Đang tải thông tin...");

    try {
        const response = await $.ajax({
            url: `/api/v1/admin/Get-All-Functions`,
            type: 'GET'
        });

        await waitMinLoading("#function-content", 1000);

        if (response.success && response.data) {
            const functionData = response.data.find(item => item.ID === functionId);

            if (!functionData) {
                hideLoading("#function-content");
                Sweet_Alert("error", "Không tìm thấy thông tin chức năng admin");
                return;
            }

            // Cập nhật tiêu đề và nút lưu cho chế độ sửa
            $("#FunctionModalLabel").text("Chỉnh sửa chức năng admin");
            $("#btnSaveText").text("Cập nhật");

            // Hiển thị các trường chỉ dành cho sửa
            $("#editOnlyFields").show();

            // Render lại nội dung form và bảng menu vào #function-content
            const html = `
                <form id="FunctionForm">
                    <input type="hidden" id="formMode" value="edit">
                    <input type="hidden" id="functionId" value="${functionData.ID}">
                    <div class="form-group">
                        <label for="tenFunction">Tên chức năng</label>
                        <input type="text" class="form-control" id="tenFunction" value="${functionData.TenChucNang || ''}">
                    </div>
                    <div class="form-group">
                        <label for="maFunction">Mã chức năng</label>
                        <input type="text" class="form-control" id="maFunction" value="${functionData.MaChucNang || ''}">
                    </div>
                    <div class="form-group">
                        <label for="moTa">Mô tả</label>
                        <textarea class="form-control" id="moTa">${functionData.MoTa || ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label>Menu liên kết</label>
                        <table id="menuSelectionTable" class="table">
                            <thead>
                                <tr>
                                    <th></th>
                                    <th>Tên menu</th>
                                    <th>Link</th>
                                </tr>
                            </thead>
                            <tbody></tbody>
                        </table>
                    </div>
                </form>
            `;
            hideLoading("#function-content", html);

            await loadMenuTable();
            await loadFunctionMenus(functionId);

            $(".is-invalid").removeClass("is-invalid");
            $(".invalid-feedback").remove();
        } else {
            hideLoading("#function-content");
            Sweet_Alert("error", "Không thể tải thông tin chức năng admin");
        }
    } catch (error) {
        hideLoading("#function-content");
        Sweet_Alert("error", "Không thể tải thông tin chức năng admin");
    }
}

    /**
     * Mở modal xem chi tiết chức năng
     */
    async function openDetailFunctionModal(functionId) {
        $("#detailFunctionModal").modal("show");
        showLoading("#FunctionDetailModal");
        try {
            const functionPromise = $.ajax({
                url: `/api/v1/admin/Get-All-Functions`,
                type: 'GET'
            });

            await waitMinLoading("#FunctionDetailModal");
            hideLoading("#FunctionDetailModal");

            const response = await functionPromise;
            if (response.success && response.data) {
                const functionData = response.data.find(item => item.ID === functionId);

                if (!functionData) {
                    Sweet_Alert("error", "Không tìm thấy thông tin chức năng admin");
                    return;
                }

                // Điền dữ liệu vào modal chi tiết
                $("#detailFunctionModalLabel").text("Chi tiết chức năng admin");
                $("#detailTenFunction").text(functionData.TenChucNang || defaultContent);
                $("#detailMaFunction").text(functionData.MaChucNang || defaultContent);
                $("#detailMoTa").text(functionData.MoTa || defaultContent);

                let ngayTao = functionData.NgayTao || functionData.ngayTao;
                let ngayCapNhat = functionData.NgayCapNhat || functionData.ngayCapNhat;
                $("#detailNgayTao").text(ngayTao ? formatTimestamp(parseInt(ngayTao)) : "N/A");
                $("#detailNgayCapNhat").text(ngayCapNhat ? formatTimestamp(parseInt(ngayCapNhat)) : "N/A");

                $("#btnEditFromDetail").data("id", functionId);

                loadFunctionMenusForDetails(functionId);

                // Chỉ mở modal chi tiết
                $("#detailFunctionModal").modal("show");
            } else {
                Sweet_Alert("error", "Không thể tải thông tin chức năng admin");
            }
        } catch (error) {
            hideLoading("#function-content");
            Sweet_Alert("error", "Không thể tải thông tin chức năng admin");
        }
    }

    // Add this new function to load menus for detail view
    async function loadFunctionMenusForDetails(functionId) {
        try {
            const response = await $.ajax({
                url: `/api/v1/admin/function-menus/${functionId}`,
                type: 'GET'
            });

            if (response && Array.isArray(response) && response.length > 0) {
                let tableContent = '';

                // Generate table rows for each menu
                response.forEach((menu, index) => {
                    tableContent += `
                <tr>
                    <td class="text-center">${index + 1}</td>
                    <td>${menu.MenuName || ''}</td>
                    <td>${menu.MenuLink || ''}</td>
                </tr>`;
                });

                $("#detailMenuTableBody").html(tableContent);
            } else {
                $("#detailMenuTableBody").html('<tr><td colspan="3" class="text-center">Không có menu nào được liên kết</td></tr>');
            }
        } catch (error) {
            $("#detailMenuTableBody").html('<tr><td colspan="3" class="text-center text-danger">Không thể tải dữ liệu menu</td></tr>');
            console.error("Error loading function menus:", error);
        }
    }

    // Add event handler for Edit button in detail view
    $(document).on("click", "#btnEditFromDetail", function () {
        const id = $(this).data("id");
        $("#detailFunctionModal").modal("hide");
        openEditFunctionModal(id);
    });

    /**
     * Thêm chức năng mới
     */
    async function addNewFunction() {
        if (!validateForm()) {
            return;
        }

        const tenFunction = $("#tenFunction").val().trim();
        const maFunction = $("#maFunction").val().trim();
        const moTa = $("#moTa").val().trim();
        const selectedMenuIds = getSelectedMenuIds();

        try {
            $("#btnSaveFunction").prop("disabled", true);
            $("#btnSaveText").html('<i class="anticon anticon-loading"></i> Đang xử lý...');
            showLoading(null, "Đang thêm chức năng...");

            const res = await $.ajax({
                url: '/api/v1/admin/Create-Function',
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({
                    Function: {
                        TenChucNang: tenFunction,
                        MaChucNang: maFunction,
                        MoTa: moTa
                    },
                    MenuIds: selectedMenuIds
                })
            });

            hideLoading();
            $("#btnSaveFunction").prop("disabled", false);
            $("#btnSaveText").text("Thêm mới");

            if (res.success) {
                $("#FunctionModal").modal("hide");
                Sweet_Alert("success", res.message || "Thêm chức năng thành công");
                loadFunctionList();
            } else {
                Sweet_Alert("error", res.message || "Không thể thêm chức năng");
            }
        } catch (error) {
            hideLoading();
            $("#btnSaveFunction").prop("disabled", false);
            $("#btnSaveText").text("Thêm mới");

            let errorMessage = "Đã xảy ra lỗi khi thêm chức năng";
            if (error.responseJSON) {
                if (error.responseJSON.message) {
                    errorMessage = error.responseJSON.message;
                } else if (error.responseJSON.error) {
                    errorMessage = error.responseJSON.error;
                }
            }
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
            // Vô hiệu hóa nút lưu và hiển thị loading trên nút
            $("#btnSaveFunction").prop("disabled", true);
            $("#btnSaveText").html('<i class="anticon anticon-loading"></i> Đang xử lý...');

            // Hiển thị loading overlay toàn màn hình
            showLoading(null, "Đang cập nhật...");

            const res = await $.ajax({
                url: `/api/v1/admin/Update-Function/${functionId}`,
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

            // Ẩn loading
            hideLoading();

            // Kích hoạt lại nút
            $("#btnSaveFunction").prop("disabled", false);
            $("#btnSaveText").text("Cập nhật");

            if (res.success) {
                $("#FunctionModal").modal("hide");

                // Hiển thị thông báo thành công
                Sweet_Alert("success", res.message || "Cập nhật chức năng admin thành công");

                loadFunctionList();
            } else {
                // Hiển thị thông báo lỗi
                Sweet_Alert("error", res.message || "Không thể cập nhật chức năng admin");
            }
        } catch (error) {
            // Ẩn loading
            hideLoading();

            // Kích hoạt lại nút
            $("#btnSaveFunction").prop("disabled", false);
            $("#btnSaveText").text("Cập nhật");

            let errorMessage = "Đã xảy ra lỗi khi cập nhật chức năng admin";
            if (error.responseJSON && error.responseJSON.message) {
                errorMessage = error.responseJSON.message;
            }

            // Hiển thị thông báo lỗi
            Sweet_Alert("error", errorMessage);
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
                    // Hiển thị loading
                    showLoading(null, "Đang xóa...");

                    const res = await $.ajax({
                        url: `/api/v1/admin/Delete-Function/${functionId}`,
                        type: 'DELETE'
                    });

                    // Ẩn loading
                    hideLoading();

                    if (res.success) {
                        // Hiển thị thông báo thành công
                        Sweet_Alert("success", res.message || "Xóa chức năng admin thành công");
                        loadFunctionList();
                    } else {
                        // Hiển thị thông báo lỗi
                        Sweet_Alert("error", res.message || "Không thể xóa chức năng admin");
                    }
                } catch (error) {
                    // Ẩn loading
                    hideLoading();

                    let errorMessage = "Đã xảy ra lỗi khi xóa chức năng admin";
                    if (error.responseJSON && error.responseJSON.message) {
                        errorMessage = error.responseJSON.message;
                    }

                    // Hiển thị thông báo lỗi
                    Sweet_Alert("error", errorMessage);
                }
            }
        });
    }


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
    return new Promise((resolve, reject) => {
        const tableBody = $('#menuSelectionTable tbody');
        if (tableBody.length === 0) {
            resolve();
            return;
        }

        // Hiển thị indicator loading trực tiếp trong bảng
        tableBody.html('<tr><td colspan="3" class="text-center"><div class="spinner-border text-primary" role="status"></div><p class="mt-2">Đang tải danh sách menu...</p></td></tr>');

        $.ajax({
            url: '/api/v1/admin/get-menus-QL',
            type: 'GET',
            dataType: 'json',
            success: function (data) {
                // Debug dữ liệu trả về
                console.log("Menu API response:", data);

                let menuData = data;
                if (data && data.data) {
                    menuData = data.data;
                }

                if (Array.isArray(menuData) && menuData.length > 0) {
                    let tableContent = '';
                    menuData.forEach((menu, index) => {
                        tableContent += `
                        <tr>
                            <td style="text-align: center;">
                                <div class="custom-control custom-checkbox">
                                    <input type="checkbox" class="custom-control-input menu-checkbox" 
                                        id="menu${menu.MenuId}" value="${menu.MenuId}">
                                    <label class="custom-control-label" for="menu${menu.MenuId}"></label>
                                </div>
                            </td>
                            <td>${menu.MenuName || ''}</td>
                            <td>${menu.MenuLink || ''}</td>
                        </tr>`;
                    });
                    tableBody.html(tableContent);
                    resolve();
                } else {
                    tableBody.html('<tr><td colspan="3" class="text-center">Không có menu nào</td></tr>');
                    resolve();
                }
            },
            error: function (xhr, status, error) {
                tableBody.html(`<tr><td colspan="3" class="text-center text-danger">Lỗi: ${error}</td></tr>`);
                reject(error);
            }
        });
    });
}

async function loadFunctionMenus(functionId) {
    try {
        // Then fetch the function's associated menus
        const response = await $.ajax({
            url: `/api/v1/admin/function-menus/${functionId}`,
            type: 'GET'
        });

        if (response && Array.isArray(response)) {
            // Get menu IDs from the response
            const menuIds = response.map(item => item.MenuId.toString());

            // Set the checkboxes based on the menu IDs
            setTimeout(() => {
                setSelectedMenus(menuIds);
            }, 300); // Small delay to ensure menu table is fully loaded
        }
    } catch (error) {
        Sweet_Alert("error", "Không thể tải menu cho chức năng này");
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
    // Clear all selections first
    $('#menuSelectionTable .menu-checkbox').prop('checked', false);

    // Set checked for the provided IDs
    if (menuIds && menuIds.length > 0) {
        menuIds.forEach(id => {
            const checkbox = $(`#menu${id}`);
            if (checkbox.length) {
                checkbox.prop('checked', true);
            }
        });
    }
}