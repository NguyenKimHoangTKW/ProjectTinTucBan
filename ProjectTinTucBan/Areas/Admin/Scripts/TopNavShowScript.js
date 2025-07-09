$(function () {
    function loadTopMenu() {
        $.getJSON('/api/v1/admin/groupmenu-menus/15')// id cứng để test, sau này đổi
            .done(function (group) {
                const $nav = $('.admin-topmenu-nav').empty();
                if (!group || !Array.isArray(group.Menus) || group.Menus.length === 0) {
                    $nav.append('<li><span class="admin-topmenu-link">Không có menu</span></li>');
                    return;
                }
                group.Menus.forEach(menu => {
                    const hasSub = Array.isArray(menu.SubMenus) && menu.SubMenus.length > 0;
                    const $li = $('<li></li>');
                    const $a = $('<a></a>')
                        .addClass('admin-topmenu-link')
                        .attr('href', menu.MenuLink || '#')
                        .text(menu.MenuName);
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
            })
            .fail(function (jqXHR, textStatus, errorThrown) {
                console.error('Lỗi khi tải menu:', textStatus, errorThrown);
                $('.admin-topmenu-nav').empty()
                    .append('<li><span class="admin-topmenu-link text-danger">Lỗi tải menu</span></li>');
            });
    }
    loadTopMenu();
});