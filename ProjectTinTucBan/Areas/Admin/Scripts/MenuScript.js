
$(function () {
    function showSwal(message, type) {
        Swal.fire({
            icon: type,
            title: message,
            timer: 3000000,
            showConfirmButton: true
        });
    }
    function loadMenus() {
        $.getJSON('/api/v1/admin/menus-with-submenus', function (data) {
            const $menuList = $('#menu-list').empty();
            data.forEach(menu => {
                const $left = $('<div >').append(
                    $('<span>').text(menu.MenuName),
                    menu.MenuLink ? $('<span class="text-muted">').text(' (' + menu.MenuLink + ')') : ''
                );
                const $right = $('<div>').append(
                    $('<button class="btn btn-sm btn-link add-submenu-btn mb-3">')
                        .text('Thêm menu con').attr('data-menu-id', menu.MenuId),
                    $('<button class="btn btn-sm btn-primary edit-menu-btn ml-2">')
                        .text('Sửa').attr('data-menu-id', menu.MenuId)
                        .attr('data-menu-name', menu.MenuName)
                        .attr('data-menu-link', menu.MenuLink || ''),
                    $('<button class="btn btn-sm btn-danger delete-menu-btn ml-2">')
                        .text('Xóa').attr('data-menu-id', menu.MenuId)
                );
                const $menuRow = $('<div class="d-flex justify-content-between align-items-center">')
                    .append($left)
                    .append($right);

                const $menuItem = $('<li class="list-group-item">').append($menuRow);

                if (menu.SubMenus?.length > 0) {
                    const $subList = $('<ul class="list-group mt-2 mb-2">');
                    menu.SubMenus.forEach(sub => {
                        const $left  = $('<li class="list-group-item py-1 px-3 d-flex justify-content-between align-items-center">')
                            .append(
                                $('<span>').text(sub.SubMenuName),
                        );
                        const $right = $('<div>').append(
                            $('<button class="btn btn-sm btn-danger delete-submenu-btn">')
                                .text('Xóa').attr('data-submenu-id', sub.SubMenuId)
                        );
                        const $subItem = $('<div class="d-flex justify-content-between align-items-center">')
                            .append($left)
                            .append($right);
                        $subList.append($subItem);
                    });
                    $menuItem.append($subList);
                }

                $menuList.append($menuItem);
            });
        });
    }

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
            url: '/api/v1/admin/add-menu',
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
                    url: '/api/v1/admin/delete-menu',
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

        Swal.fire({
            title: 'Chỉnh sửa Menu',
            html:
                `<input id="swal-menu-name" class="swal2-input" placeholder="Tên menu" value="${currentName}">` +
                `<input id="swal-menu-link" class="swal2-input" placeholder="Link" value="${currentLink}">`,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'Lưu',
            cancelButtonText: 'Hủy',
            preConfirm: () => {
                const name = $('#swal-menu-name').val().trim();
                const link = $('#swal-menu-link').val().trim();
                if (!name) {
                    Swal.showValidationMessage('Tên menu không được để trống!');
                    return false;
                }
                return { name, link };
            }
        }).then((result) => {
            if (result.isConfirmed) {
                $.ajax({
                    url: '/api/v1/admin/edit-menu',
                    method: 'POST',
                    contentType: 'application/json',
                    data: JSON.stringify({
                        ID: menuId,
                        Ten: result.value.name,
                        Link: result.value.link
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
                    url: '/api/v1/admin/delete-submenu',
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
            url: '/api/v1/admin/add-submenu',
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
});
