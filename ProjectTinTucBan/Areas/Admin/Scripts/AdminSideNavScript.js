$(function () {
    function loadSideNav() {
        $.getJSON('/api/v1/admin/groupmenu-menus/17') // id cứng để test
            .done(function (group) {
                if (!group || !Array.isArray(group.Menus) || group.Menus.length === 0) {
                    return; // Không có menu, giữ lại menu offline
                }

                const $sideNav = $('.side-nav-menu');
                $sideNav.empty(); // Chỉ xóa khi có dữ liệu hợp lệ

                const baseUrl = `${window.location.origin}/Admin/`;

                // --- GỘP MENU TRÙNG ---
                const menuMap = new Map();

                group.Menus.forEach(menu => {
                    if (!menuMap.has(menu.MenuId)) {
                        menuMap.set(menu.MenuId, {
                            ...menu,
                            SubMenus: [...(menu.SubMenus || [])]
                        });
                    } else {
                        const existing = menuMap.get(menu.MenuId);
                        const combinedSubs = [...(existing.SubMenus || []), ...(menu.SubMenus || [])];

                        // Lọc trùng SubMenuId
                        const subIdSet = new Set();
                        const uniqueSubs = [];
                        combinedSubs.forEach(sub => {
                            if (!subIdSet.has(sub.SubMenuId)) {
                                subIdSet.add(sub.SubMenuId);
                                uniqueSubs.push(sub);
                            }
                        });

                        existing.SubMenus = uniqueSubs;
                    }
                });

                // --- RENDER ---
                menuMap.forEach(menu => {
                    const hasSub = Array.isArray(menu.SubMenus) && menu.SubMenus.length > 0;
                    const $li = $('<li></li>').addClass('nav-item');

                    const menuLink = menu.MenuLink ? menu.MenuLink.replace(/^\/+/, '') : '';
                    const fullMenuLink = menuLink ? baseUrl + menuLink : 'javascript:void(0);';

                    const $a = $('<a></a>')
                        .attr('href', fullMenuLink)
                        .addClass(hasSub ? 'dropdown-toggle' : '');

                    const $iconHolder = $('<span></span>').addClass('icon-holder');
                    $iconHolder.append($('<i></i>').addClass(menu.IconClass || 'anticon anticon-dashboard'));

                    const $title = $('<span></span>').addClass('title').text(menu.MenuName);

                    $a.append($iconHolder).append($title);

                    if (hasSub) {
                        const $arrow = $('<span></span>').addClass('arrow')
                            .append($('<i></i>').addClass('fas fa-chevron-down'));
                        $a.append($arrow);

                        const $dropdown = $('<ul></ul>').addClass('dropdown-menu');
                        menu.SubMenus.forEach(sub => {
                            const $subLi = $('<li></li>');
                            const subLink = sub.SubMenuLink ? sub.SubMenuLink.replace(/^\/+/, '') : '';
                            const fullSubLink = subLink ? baseUrl + subLink : '#';

                            const $subA = $('<a></a>')
                                .attr('href', fullSubLink)
                                .text(sub.SubMenuName);
                            $subLi.append($subA);
                            $dropdown.append($subLi);
                        });

                        $li.addClass('dropdown').append($a).append($dropdown);
                    } else {
                        $li.append($a);
                    }

                    $sideNav.append($li);
                });

                // Gán sự kiện toggle dropdown
                $('.dropdown-toggle').off('click').on('click', function (e) {
                    e.preventDefault();
                    e.stopPropagation();

                    const $parent = $(this).parent();
                    const $dropdownMenu = $(this).next('.dropdown-menu');

                    if ($parent.hasClass('open')) {
                        $parent.removeClass('open');
                        $dropdownMenu.stop(true, true).slideUp(200);
                    } else {
                        $('.nav-item.dropdown').removeClass('open');
                        $('.dropdown-menu').slideUp(200);

                        $parent.addClass('open');
                        $dropdownMenu.stop(true, true).slideDown(200);
                    }
                });
            });
    }

    loadSideNav();
});
