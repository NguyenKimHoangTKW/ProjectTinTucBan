$(function () {
    function loadTopMenu() {
        $.ajax({
            url: '/api/v1/admin/menus-with-submenus-by-asignto/2',
            type: 'GET',
            dataType: 'json',
            success: function (data) {
                const $nav = $('.admin-topmenu-nav').empty();
                if (!Array.isArray(data) || data.length === 0) {
                    $nav.append('<li><span class="admin-topmenu-link">Không có menu</span></li>');
                    return;
                }

                const addedMenus = new Set(); // Dùng để lọc trùng theo tên

                data.forEach(group => {
                    if (!Array.isArray(group.Menus) || group.Menus.length === 0) return;

                    group.Menus.forEach(menu => {
                        const menuName = menu.MenuName?.trim();
                        if (!menuName || addedMenus.has(menuName)) return; // Bỏ qua nếu trùng

                        addedMenus.add(menuName); // Đánh dấu đã thêm

                        const hasSub = Array.isArray(menu.SubMenus) && menu.SubMenus.length > 0;
                        const $li = $('<li></li>');
                        if (hasSub) $li.addClass('has-dropdown');

                        let href = 'javascript:void(0)';
                        if (!hasSub) {
                            if (menuName.toLowerCase() === 'đăng nhập') {
                                href = 'https://localhost:44305/Home/Login';
                            } else {
                                href = menu.MenuLink || '#';
                            }
                        }

                        const $a = $('<a></a>')
                            .addClass('admin-topmenu-link text-base')
                            .attr('href', href)
                            .html(menuName + (hasSub ? ' <span class="dropdown-icon"></span>' : ''));

                        $li.append($a);

                        if (hasSub) {
                            const $dropdown = $('<ul></ul>').addClass('admin-topmenu-dropdown');
                            menu.SubMenus.forEach(sub => {
                                const $subLi = $('<li></li>');
                                const $subA = $('<a></a>')
                                    .attr('href', sub.SubMenuLink || '#')
                                    .text(sub.SubMenuName);
                                $subLi.append($subA);
                                $dropdown.append($subLi);
                            });
                            $li.append($dropdown);
                        }

                        $nav.append($li);
                    });
                });
            },
            error: function () {
                $('.admin-topmenu-nav').empty()
                    .append('<li><span class="admin-topmenu-link text-danger">Lỗi tải menu</span></li>');
            }
        });
    }

    loadTopMenu();
});
