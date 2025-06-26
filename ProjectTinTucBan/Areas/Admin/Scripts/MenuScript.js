
$(function () {
    function showSwal(message, type) {
        Swal.fire({
            icon: type,
            title: message,
            timer: 3000,
            showConfirmButton: true
        });
    }

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
            data.forEach(menu => {
                // Left side with menu info
                const $left = $('<div>')
                    .addClass('menu-info') // Add this class for responsive layout
                    .append(
                        $('<span>').text(menu.MenuName),
                        menu.MenuLink ? $('<span class="text-muted">').text(' (' + menu.MenuLink + ')') : '',
                        menu.MenuOrder ? $('<span class="text-muted">').text(' - Thứ tự: ' + menu.MenuOrder) : ''
                    );

                // Right side with buttons
                const $right = $('<div>')
                    .addClass('d-flex menu-action-buttons flex-row justify-content-end align-items-center m-t-25')
                    .append(
                        $('<button class="btn btn-sm btn-link add-submenu-btn">')
                            .text('Thêm menu con')
                            .attr('data-menu-id', menu.MenuId),
                        $('<button class="btn btn-sm btn-warning edit-menu-btn">')
                            .text('Sửa')
                            .attr('data-menu-id', menu.MenuId)
                            .attr('data-menu-name', menu.MenuName)
                            .attr('data-menu-link', menu.MenuLink || '')
                            .attr('data-menu-order', menu.MenuOrder)
                            .prop('disabled', menu.IsLocked),
                        $('<button class="btn btn-sm btn-danger delete-menu-btn">')
                            .text('Xóa')
                            .attr('data-menu-id', menu.MenuId)
                            .prop('disabled', menu.IsLocked || (menu.SubMenus?.length > 0))
                    );

                // Menu row with responsive class
                const $menuRow = $('<div>')
                    .addClass('d-flex justify-content-between align-items-start menu-row-responsive')
                    .append($left)
                    .append($right);

                const $menuItem = $('<li class="list-group-item">').append($menuRow);

                // Update submenu buttons with the same pattern
                if (menu.SubMenus?.length > 0) {
                    const $subList = $('<ul class="list-group mt-2 mb-2">');
                    menu.SubMenus.forEach(sub => {
                        const $name = $('<span>').text(sub.SubMenuName);
                        let $link = '';
                        if (sub.SubMenuLink) {
                            $link = $('<a>')
                                .attr('href', sub.SubMenuLink)
                                .attr('target', '_blank')
                                .addClass('ml-2 text-primary')
                                .text(sub.SubMenuLink);
                        }

                        const $left = $('<div>')
                            .addClass('menu-info')
                            .append($name)
                            .append($link);

                        const $right = $('<div>')
                            .addClass('d-flex menu-action-buttons flex-row justify-content-end align-items-center m-t-25')
                            .append(
                                $('<button class="btn btn-sm btn-warning edit-submenu-btn m-t-5">')
                                    .text('Sửa')
                                    .attr('data-submenu-id', sub.SubMenuId)
                                    .attr('data-menu-name', sub.SubMenuName)
                                    .attr('data-menu-link', sub.SubMenuLink || '')
                                    .attr('data-menu-order', sub.SubMenuOrder),
                                $('<button class="btn btn-sm btn-danger delete-submenu-btn">')
                                    .text('Xóa')
                                    .attr('data-submenu-id', sub.SubMenuId)
                            );

                        const $subItem = $('<li class="list-group-item py-1 px-3">')
                            .append(
                                $('<div>')
                                    .addClass('d-flex justify-content-between align-items-start menu-row-responsive')
                                    .append($left)
                                    .append($right)
                            );

                        $subList.append($subItem);
                    });
                    $menuItem.append($subList);
                    
                }

                $menuList.append($menuItem);
            });
            updateButtonStates();
        });
    }

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

    $('#add-menu-form').submit(function (e) {
        e.preventDefault();
        const menuName = $('#menuName').val();
        const menuLink = $('#menuLink').val();
        const thuTuShow = $('#thuTuShow').val();

        $.ajax({
            url: `${BASE_URL}/add-menu`,
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                Ten: menuName,
                Link: menuLink,
                ThuTuShow: thuTuShow ? parseInt(thuTuShow) : null
            }),
            success: () => {
                $('#addMenuModal').modal('hide');
                $('#add-menu-form')[0].reset();
                loadMenus();
                showSwal("Thêm menu thành công", 'success');
            },
            error: () => showSwal('Thêm menu thất bại!', 'error')
        });
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
                    method: 'POST',
                    contentType: 'application/json',
                    data: JSON.stringify(menuId),
                    success: (res) => {
                        if (res.success) {
                            showSwal('Xóa menu thành công!', 'success');
                            loadMenus();
                        } else {
                            showSwal('Xóa thất bại: ' + (res.message || ''), 'error');
                        }
                    },
                    error: () => showSwal('Có lỗi xảy ra khi xóa menu!', 'error')
                });
            }
        });
    });

    $('#menu-list').on('click', '.edit-menu-btn', function () {
        const menuId = $(this).data('menu-id');
        const currentName = $(this).data('menu-name');
        const currentLink = $(this).data('menu-link');
        const currentOrder = $(this).data('menu-order') || '';

        Swal.fire({
            title: 'Chỉnh sửa Menu',
            html:
                `<input id="swal-menu-name" class="swal2-input" placeholder="Tên menu" value="${currentName}">` +
                `<input id="swal-menu-link" class="swal2-input" placeholder="Link" value="${currentLink}">` +
                `<input id="swal-menu-order" class="swal2-input" type="number" min="0" step="1" placeholder="Thứ tự show" value="${currentOrder}">`,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'Lưu',
            cancelButtonText: 'Hủy',
            preConfirm: () => {
                const name = $('#swal-menu-name').val().trim();
                const link = $('#swal-menu-link').val().trim();
                const order = $('#swal-menu-order').val().trim();

                if (!name) {
                    Swal.showValidationMessage('Tên menu không được để trống!');
                    return false;
                }

                if (order && (!/^\d+$/.test(order) || parseInt(order) < 0)) {
                    Swal.showValidationMessage('Thứ tự show phải là số nguyên không âm!');
                    return false;
                }

                return { name, link, order };
            }
        }).then((result) => {
            if (result.isConfirmed) {
                $.ajax({
                    url: `${BASE_URL}/edit-menu`,
                    method: 'POST',
                    contentType: 'application/json',
                    data: JSON.stringify({
                        ID: menuId,
                        Ten: result.value.name,
                        Link: result.value.link,
                        thuTuShow: result.value.order ? parseInt(result.value.order) : null
                    }),
                    success: function (res) {
                        if (res.success) {
                            showSwal('Cập nhật menu thành công!', 'success');
                            loadMenus();
                        } else {
                            showSwal('Cập nhật thất bại: ' + (res.message || ''), 'error');
                        }
                    },
                    error: function (xhr) {
                        showSwal('Lỗi: ' + xhr.responseText, 'error');
                    }
                });
            }
        });
    });


    $('#menu-list').on('click', '.add-submenu-btn', function () {
        const menuId = $(this).data('menu-id');
        $('#parentMenuId').val(menuId);
        $('#subMenuName').val('');
        $('#subLink').val('');  
        $('#addSubMenuModal').modal('show');
    });

    $('#add-submenu-form').submit(function (e) {
        e.preventDefault();
        const parentMenuId = $('#parentMenuId').val();
        const subMenuName = $('#subMenuName').val();
        const subLink = $('#subLink').val();

        if (!subMenuName) {
            showSwal('Tên menu con không được để trống!', 'warning');
            return;
        }

        $.ajax({
            url: `${BASE_URL}/add-submenu`,
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                MenuId: parseInt(parentMenuId),
                SubMenuName: subMenuName,
                SubMenuLink: subLink
            }),
            success: () => {
                $('#addSubMenuModal').modal('hide');
                loadMenus();
                showSwal('Thêm menu con thành công!', 'success');
            },
            error: (xhr) => {
                showSwal('Lỗi: ' + xhr.responseText, 'error');
            }
        });
    });

    // Sửa submenu
    $('#menu-list').on('click', '.edit-submenu-btn', function () {
        const subMenuId = $(this).data('submenu-id');
        // Lấy tên submenu hiện tại từ DOM
        const $subItem = $(this).closest('.d-flex').find('span').first();
        const currentName = $subItem.text();
        const currentLink = $(this).data('menu-link') || '';
        const currentOrder = $(this).data('menu-order') || '';



        Swal.fire({
            title: 'Chỉnh sửa Menu Con',
            html:
                `<input id="swal-submenu-name" class="swal2-input" placeholder="Tên menu con" value="${currentName}">` +
                `<input id="swal-submenu-link" class="swal2-input" placeholder="Link" value="${currentLink}">` +
                `<input id="swal-submenu-order" class="swal2-input" type="number" placeholder="Thứ tự show" value="${currentOrder}">`,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'Lưu',
            cancelButtonText: 'Hủy',
            preConfirm: () => {
                const name = $('#swal-submenu-name').val().trim();
                const link = $('#swal-submenu-link').val().trim();
                const order = $('#swal-submenu-order').val().trim();
                if (!name) {
                    Swal.showValidationMessage('Tên menu không được để trống!');
                    return false;
                }

                if (order && (!/^\d+$/.test(order) || parseInt(order) < 0)) {
                    Swal.showValidationMessage('Thứ tự show phải là số nguyên không âm!');
                    return false;
                }
                
                return { name, link,order };
            }
        }).then((result) => {
            if (result.isConfirmed) {
                $.ajax({
                    url: `${BASE_URL}/edit-sub-menu`,
                    method: 'POST',
                    contentType: 'application/json',
                    data: JSON.stringify({
                        ID: subMenuId,
                        Ten: result.value.name,
                        Link: result.value.link,
                        ThuTuShow: result.value.order ? parseInt(result.value.order) : null
                    }),
                    success: function (res) {
                        if (res.success) {
                            showSwal('Cập nhật menu con thành công!', 'success');
                            loadMenus();
                        } else {
                            showSwal('Cập nhật thất bại: ' + (res.message || ''), 'error');
                        }
                    },
                    error: function (xhr) {
                        showSwal('Lỗi: ' + xhr.responseText, 'error');
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
                    method: 'POST',
                    contentType: 'application/json',
                    data: JSON.stringify(subMenuId),
                    success: (res) => {
                        if (res.success) {
                            showSwal('Xóa menu con thành công!', 'success');
                            loadMenus();
                        } else {
                            showSwal('Xóa thất bại: ' + (res.message || ''), 'error');
                        }
                    },
                    error: () => showSwal('Có lỗi xảy ra khi xóa menu con!', 'error')
                });
            }
        });
    });

});
