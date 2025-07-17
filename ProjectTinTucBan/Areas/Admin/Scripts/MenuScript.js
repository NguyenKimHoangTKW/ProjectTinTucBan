$(function () {

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

   

    // Add observer for dynamic updates
    const observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
            if (mutation.type === 'childList') {
                updateButtonStates();
            }
        });
    });

    // Start observing the menu list for changes
    observer.observe(document.getElementById('menu-list'), {
        childList: true,
        subtree: true
    });

    $(document).ajaxComplete(function () {
        updateButtonStates();
    });

    

    loadMenus();

    $('#openAddMenuModal').click(() => $('#addMenuModal').modal('show'));
    $('#closeAddMenuModal, #closeAddMenuModalFooter').click(() => $('#addMenuModal').modal('hide'));
    $('#closeAddSubMenuModal, #closeAddSubMenuModalFooter').click(() => $('#addSubMenuModal').modal('hide'));

    $('#menu-list').on('click', '.add-submenu-btn', function () {
        const menuId = $(this).data('menu-id');
        $('#parentMenuId').val(menuId);
        $('#subMenuName').val('');
        $('#subLink').val('');
        $('#addSubMenuModal').modal('show');
    });

    $('#menu-list').on('click', '.delete-menu-btn', function () {
        const menuId = $(this).data('menu-id');
        Swal.fire({
            title: 'Bạn có chắc chắn muốn xóa menu này?',
            icon: 'warning',
            showCancelButton: true,
            cancelButtonText: 'Hủy',
            confirmButtonText: 'Xóa'
        }).then((result) => {
            if (result.isConfirmed) {
                $.ajax({
                    url: `${BASE_URL}/delete-menu`,
                    type: 'POST',
                    contentType: 'application/json',
                    data: JSON.stringify(menuId),
                    success: (res) => {
                        if (res.success) {
                            loadMenus();
                            Sweet_Alert('success', 'Xóa menu thành công!');

                        } else {
                            Sweet_Alert('error', 'Xóa thất bại: ' + (res.message || ''));
                        }
                    },
                    error: () => Sweet_Alert('error', 'Có lỗi xảy ra khi xóa menu!')
                });
            }
        });
    });

    $('#menu-list').on('click', '.edit-menu-btn', function () {
        const menuId = $(this).data('menu-id');
        const currentName = $(this).data('menu-name');
        const currentLink = $(this).data('menu-link');
        const currentOrder = $(this).data('menu-order') || '';
        const currentIcon = $(this).data('icon-name') || '';

        Swal.fire({
            title: 'Chỉnh sửa Menu',
            html:
                `<input id="swal-menu-name" class="swal2-input" placeholder="Tên menu" value="${currentName}">` +
                `<input id="swal-menu-link" class="swal2-input" placeholder="Link" value="${currentLink}">` +
                `<input id="swal-menu-order" class="swal2-input" type="number" min="0" step="1" placeholder="Thứ tự show" value="${currentOrder}">` +
                `<input id="swal-menu-icon" class="swal2-input" placeholder="Icon menu (FontAwesome)" value="${currentIcon}">` +
                `<div id="icon-preview" class="mt-2" style="text-align:left;"> <i id="icon-preview-element" class="${currentIcon}"></i></div>`,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'Lưu',
            cancelButtonText: 'Hủy',
            didOpen: () => {
                // Xem trước icon khi người dùng thay đổi
                $('#swal-menu-icon').on('input', function () {
                    const iconClass = $(this).val().trim();
                    $('#icon-preview-element').attr('class', iconClass);
                });
            },
            preConfirm: () => {
                const name = $('#swal-menu-name').val().trim();
                const link = $('#swal-menu-link').val().trim();
                const order = $('#swal-menu-order').val().trim();
                const iconName = $('#swal-menu-icon').val().trim();

                if (!name) {
                    Swal.showValidationMessage('Tên menu không được để trống!');
                    return false;
                }

                if (order && (!/^\d+$/.test(order) || parseInt(order) < 0)) {
                    Swal.showValidationMessage('Thứ tự show phải là số nguyên không âm!');
                    return false;
                }

                return { name, link, order, iconName };
            }
        }).then((result) => {
            if (result.isConfirmed) {
                $.ajax({
                    url: `${BASE_URL}/edit-menu`,
                    type: 'POST',
                    contentType: 'application/json',
                    data: JSON.stringify({
                        ID: menuId,
                        Ten: result.value.name,
                        Link: result.value.link,
                        thuTuShow: result.value.order ? parseInt(result.value.order) : null,
                        IconName: result.value.iconName || null
                    }),
                    success: function (res) {
                        if (res.success) {
                            loadMenus();
                            Sweet_Alert('success', 'Cập nhật menu thành công!');

                        } else {
                            Sweet_Alert('error', 'Cập nhật thất bại: ' + (res.message || ''));
                        }
                    },
                    error: function (xhr) {
                        Sweet_Alert('error', 'Lỗi: ' + xhr.responseText);
                    }
                });
            }
        });
    });

    // Sửa submenu
    $('#menu-list').on('click', '.edit-submenu-btn', function () {
        const subMenuId = $(this).data('submenu-id');
        // Lấy tên submenu hiện tại từ DOM
        const $subItem = $(this).closest('.d-flex').find('span').first();
        const currentName = $(this).data('menu-name');
        const currentLink = $(this).data('menu-link') || '';
        const currentOrder = $(this).data('menu-order') || '';
        const currentIcon = $(this).data('menu-icon' || '')

        var SafeName = escapeHtml(currentName);

        Swal.fire({
            title: 'Chỉnh sửa Menu Con',
            html:
                `<input id="swal-submenu-name" class="swal2-input" placeholder="Tên menu con" value="${SafeName}">` +
                `<input id="swal-submenu-link" class="swal2-input" placeholder="Link" value="${currentLink}">` +
                `<input id="swal-submenu-order" class="swal2-input" type="number" placeholder="Thứ tự show" value="${currentOrder}">` +
                `<input id="swal-menu-icon" class="swal2-input" placeholder="Icon Menu (FontAwesome)" value="${currentIcon}">` +
                `<div id="icon-preview" class="mt-2" style="text-align:left;"> <i id="icon-preview-element" class="${currentIcon}"></i></div>`,

            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'Lưu',
            cancelButtonText: 'Hủy',
            preConfirm: () => {
                const name = $('#swal-submenu-name').val().trim();
                const link = $('#swal-submenu-link').val().trim();
                const order = $('#swal-submenu-order').val().trim();
                const icon = $('#swal-menu-icon').val().trim();

                if (!name) {
                    Swal.showValidationMessage('Tên menu không được để trống!');
                    return false;
                }

                if (order && (!/^\d+$/.test(order) || parseInt(order) < 0)) {
                    Swal.showValidationMessage('Thứ tự show phải là số nguyên không âm!');
                    return false;
                }

                return { name, link, order, icon };
            }
        }).then((result) => {
            if (result.isConfirmed) {
                $.ajax({
                    url: `${BASE_URL}/edit-sub-menu`,
                    type: 'POST',
                    contentType: 'application/json',
                    data: JSON.stringify({
                        ID: subMenuId,
                        Ten: result.value.name,
                        Link: result.value.link,
                        ThuTuShow: result.value.order ? parseInt(result.value.order) : null,
                        IconName: result.value.icon

                    }),
                    success: function (res) {
                        if (res.success) {
                            loadMenus();
                            Sweet_Alert('success', 'Cập nhật menu con thành công!');

                        } else {
                            Sweet_Alert('error', 'Cập nhật thất bại: ' + (res.message || ''));
                        }
                    },
                    error: function (xhr) {
                        Sweet_Alert('error', 'Lỗi: ' + xhr.responseText);
                    }
                });
            }
        });
    });

    $('#menu-list').on('click', '.delete-submenu-btn', function () {
        const subMenuId = $(this).data('submenu-id');
        Swal.fire({
            title: 'Bạn có chắc chắn muốn xóa menu con này?',
            icon: 'warning',
            showCancelButton: true,
            cancelButtonText: 'Hủy',
            confirmButtonText: 'Xóa'
        }).then((result) => {
            if (result.isConfirmed) {
                $.ajax({
                    url: `${BASE_URL}/delete-submenu`,
                    type: 'POST',
                    contentType: 'application/json',
                    data: JSON.stringify(subMenuId),
                    success: (res) => {
                        if (res.success) {
                            loadMenus();
                            Sweet_Alert('success', 'Xóa menu con thành công!');

                        } else {
                            Sweet_Alert('error', 'Xóa thất bại: ' + (res.message || ''));
                        }
                    },
                    error: () => Sweet_Alert('error', 'Có lỗi xảy ra khi xóa menu con!')
                });
            }
        });
    });

    $('#add-menu-form').submit(function (e) {
        e.preventDefault();
        const menuName = $('#menuName').val();
        const menuLink = $('#menuLink').val();
        const IconName = $('#iconName').val() || null;

        $.ajax({
            url: `${BASE_URL}/add-menu`,
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                Ten: menuName,
                Link: menuLink,
                IconName: IconName
            }),
            success: () => {
                $('#addMenuModal').modal('hide');
                $('#add-menu-form')[0].reset();
                loadMenus();
                Sweet_Alert('success',"Thêm menu thành công");
            },
            error: () => Sweet_Alert('error','Thêm menu thất bại!')
        });
    });

    

    
    $('#add-submenu-form').submit(function (e) {
        e.preventDefault();
        const parentMenuId = $('#parentMenuId').val();
        const subMenuName = $('#subMenuName').val();
        const subLink = $('#subLink').val();
        const subIcon = $('#subIconName').val();

        if (!subMenuName) {
            Sweet_Alert('warning','Tên menu con không được để trống!');
            return;
        }

        $.ajax({
            url: `${BASE_URL}/add-submenu`,
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                MenuId: parseInt(parentMenuId),
                SubMenuName: subMenuName,
                SubMenuLink: subLink,
                SubIconName: subIcon
            }),
            success: () => {
                $('#addSubMenuModal').modal('hide');
                loadMenus();
                Sweet_Alert('success','Thêm menu con thành công!');
            },
            error: (xhr) => {
                Sweet_Alert('error','Lỗi: ' + xhr.responseText);
            }
        });
    });

    


    function updateButtonStates() {
        // Update menu buttons based on permissions or conditions
        $('.menu-action-buttons').each(function () {
            const $buttons = $(this);
            const hasSubmenus = $buttons.closest('.list-group-item').find('.list-group').length > 0;

            // Update edit/delete buttons based on menu state
            const isEditable = !$buttons.closest('.list-group-item').hasClass('locked');
            $buttons.find('.edit-menu-btn, .edit-submenu-btn').prop('disabled', !isEditable);
            $buttons.find('.delete-menu-btn, .delete-submenu-btn').prop('disabled', !isEditable);
        });
    }

    function loadMenus() {
        $.getJSON(`${BASE_URL}/menus-with-submenus`, function (data) {
            const $menuList = $('#menu-list').empty();

            const getMenuIconElement = (iconName) => {
                return iconName
                    ? $('<i>').addClass(iconName + ' mr-2')
                    : $('<img>')
                        .addClass('mr-2')
                        .css({ width: '20px', height: '20px', objectFit: 'contain' });
            };

            data.forEach((menu, menuIndex) => {
                const menuNumber = menuIndex + 1;
                const hasSubMenus = menu.SubMenus?.length > 0;
                const menuName = escapeHtml(menu.MenuName);

                const $toggleSubBtn = hasSubMenus
                    ? $('<button type="button" class="btn btn-xs-custom btn-light toggle-submenu-btn">')
                        .html('<i class="fa fa-chevron-down small"></i>')
                        .attr('title', 'Ẩn/hiện menu con')
                        .on('click', function () {
                            $subList.slideToggle();
                            const $icon = $(this).find('i');
                            $icon.toggleClass('fa-chevron-down fa-chevron-up');
                        })
                    : $('<span class="mr-2" style="width:20px;"></span>');

                const $left = $('<div>')
                    .addClass('menu-info d-flex align-items-center')
                    .append(
                        $toggleSubBtn,
                        $('<span class="badge badge-secondary mr-2">').text(menuNumber),
                        getMenuIconElement(menu.IconName),
                        $('<span>').text(menuName),
                        menu.MenuLink ? $('<span class="text-muted ml-1">').text(' (' + menu.MenuLink + ')') : ''
                    );

                let $right;
                if (menu.IsImportant) {
                    $right = $('<div>')
                        .addClass('d-flex menu-action-buttons flex-row justify-content-end align-items-center flex-wrap gap-1 m-t-25')
                        .append(
                            $('<button class="btn btn-sm btn-link add-submenu-btn">')
                                .text('Thêm menu con')
                                .attr('data-menu-id', menu.MenuId),
                            $('<button class="btn btn-sm btn-warning edit-menu-btn">')
                                .text('Sửa')
                                .attr('data-menu-id', menu.MenuId)
                                .attr('data-menu-name', menuName)
                                .attr('data-menu-link', menu.MenuLink || '')
                                .attr('data-menu-order', menu.MenuOrder)
                                .attr('data-icon-name', menu.IconName || '')
                                .prop('disabled', menu.IsLocked)
                        );
                } else {
                    $right = $('<div>')
                        .addClass('d-flex menu-action-buttons flex-row justify-content-end align-items-center flex-wrap gap-1 m-t-25')
                        .append(
                            $('<button class="btn btn-sm btn-link add-submenu-btn">')
                                .text('Thêm menu con')
                                .attr('data-menu-id', menu.MenuId),
                            $('<button class="btn btn-sm btn-warning edit-menu-btn">')
                                .text('Sửa')
                                .attr('data-menu-id', menu.MenuId)
                                .attr('data-menu-name', menuName)
                                .attr('data-menu-link', menu.MenuLink || '')
                                .attr('data-menu-order', menu.MenuOrder)
                                .attr('data-icon-name', menu.IconName || '')
                                .prop('disabled', menu.IsLocked),
                            $('<button class="btn btn-sm btn-danger delete-menu-btn">')
                                .text('Xóa')
                                .attr('data-menu-id', menu.MenuId)
                                .prop('disabled', menu.IsLocked || hasSubMenus)
                        );
                }

                const $menuRow = $('<div>')
                    .addClass('d-flex justify-content-between align-items-start menu-row-responsive')
                    .append($left, $right);

                const $menuItem = $('<li class="list-group-item">').append($menuRow);

                let $subList = $('<div class="submenu-container mt-2 mb-2" style="display:none;"></div>');

                if (hasSubMenus) {
                    const $ul = $('<ul class="list-group">');

                    menu.SubMenus.forEach((sub, subIndex) => {
                        const subNumber = `${menuNumber}.${subIndex + 1}`;

                        const $subIcon = getMenuIconElement(sub.IconName);

                        const $order = $('<span>')
                            .addClass('badge badge-secondary mr-2')
                            .text(subNumber);

                        const $name = $('<span>').text(escapeHtml(sub.SubMenuName));
                        let $link = '';
                        if (sub.SubMenuLink) {
                            $link = $('<a>')
                                .attr('href', sub.SubMenuLink)
                                .attr('target', '_blank')
                                .addClass('ml-2 text-primary')
                                .text(sub.SubMenuLink);
                        }

                        const $left = $('<div>')
                            .addClass('menu-info d-flex align-items-center')
                            .append($order, $subIcon, $name, $link);
                        const $right = $('<div>')
                            .addClass('d-flex menu-action-buttons flex-row justify-content-end align-items-center flex-wrap gap-1')
                            .append(
                                $('<button class="btn btn-sm btn-warning edit-submenu-btn m-t-5">')
                                    .text('Sửa')
                                    .attr('data-submenu-id', sub.SubMenuId)
                                    .attr('data-menu-name', sub.SubMenuName)
                                    .attr('data-menu-link', sub.SubMenuLink || '')
                                    .attr('data-menu-order', sub.SubMenuOrder)
                                    .attr('data-menu-icon', sub.SubIconName || ''),
                                $('<button class="btn btn-sm btn-danger delete-submenu-btn">')
                                    .text('Xóa')
                                    .attr('data-submenu-id', sub.SubMenuId)
                            );

                        const $subItem = $('<li class="list-group-item py-1 px-3">')
                            .append(
                                $('<div>')
                                    .addClass('d-flex justify-content-between align-items-start menu-row-responsive')
                                    .append($left, $right)
                            );

                        $ul.append($subItem);
                    });

                    $subList.append($ul);
                    $menuItem.append($subList);
                }

                $menuList.append($menuItem);
            });

            updateButtonStates();
        });
    }
});