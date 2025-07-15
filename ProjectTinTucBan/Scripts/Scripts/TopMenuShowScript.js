$(function () {
    function loadTopMenu() {
        $.getJSON('/api/v1/admin/menus-with-submenus-by-asignto/2')
            .done(function (data) {
                const $nav = $('.admin-topmenu-nav').empty();
                if (!Array.isArray(data) || data.length === 0) {
                    $nav.append('<li><span class="admin-topmenu-link">Không có menu</span></li>');
                    return;
                }

                data.forEach(group => {
                    if (!Array.isArray(group.Menus) || group.Menus.length === 0) return;

                    group.Menus.forEach(menu => {
                        const hasSub = Array.isArray(menu.SubMenus) && menu.SubMenus.length > 0;

                        const $li = $('<li></li>');
                        if (hasSub) $li.addClass('has-dropdown');

                        // Kiểm tra nếu là "Đăng Nhập" thì link cứng
                        let href = 'javascript:void(0)';
                        if (!hasSub) {
                            if (menu.MenuName?.trim().toLowerCase() === 'đăng nhập') {
                                href = 'https://localhost:44305/Home/Login';
                            } else {
                                href = menu.MenuLink || '#';
                            }
                        }

                        const $a = $('<a></a>')
                            .addClass('admin-topmenu-link')
                            .attr('href', href)
                            .html(menu.MenuName + (hasSub ? ' <span class="dropdown-icon">▼</span>' : ''));

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
            })
            .fail(function () {
                $('.admin-topmenu-nav').empty()
                    .append('<li><span class="admin-topmenu-link text-danger">Lỗi tải menu</span></li>');
            });
    }

    loadTopMenu();
});
