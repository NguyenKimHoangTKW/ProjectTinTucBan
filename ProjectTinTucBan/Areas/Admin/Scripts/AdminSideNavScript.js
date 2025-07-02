$(function () {
    function loadSideNav() {
        $.getJSON('/api/v1/admin/get-user-menus')
            .done(function (menus) {
                if (!menus || !Array.isArray(menus) || menus.length === 0) return;

                const $sideNav = $('.side-nav-menu');
                $sideNav.empty();
                const baseUrl = `${window.location.origin}/Admin/`;

                const menuMap = new Map();

                menus.forEach(menu => {
                    if (!menuMap.has(menu.ID)) {
                        menuMap.set(menu.ID, {
                            ...menu,
                            SubMenus: [...(menu.SubMenus || [])]
                        });
                    } else {
                        const existing = menuMap.get(menu.ID);
                        const combinedSubs = [...(existing.SubMenus || []), ...(menu.SubMenus || [])];

                        const subIdSet = new Set();
                        const uniqueSubs = [];
                        combinedSubs.forEach(sub => {
                            if (!subIdSet.has(sub.ID)) {
                                subIdSet.add(sub.ID);
                                uniqueSubs.push(sub);
                            }
                        });

                        existing.SubMenus = uniqueSubs;
                    }
                });

                // RENDER
                menuMap.forEach(menu => {
                    const hasSub = Array.isArray(menu.SubMenus) && menu.SubMenus.length > 0;
                    const $li = $('<li>').addClass('nav-item');

                    const menuLink = menu.Link ? menu.Link.replace(/^\/+/, '') : '';
                    const fullMenuLink = menuLink ? baseUrl + menuLink : 'javascript:void(0);';

                    const $a = $('<a>')
                        .attr('href', fullMenuLink)
                        .addClass(hasSub ? 'dropdown-toggle' : '');

                    const $iconHolder = $('<span>').addClass('icon-holder');
                    if (menu.IconName) {
                        $iconHolder.append($('<i>').addClass(menu.IconName));
                    } else {
                        $iconHolder.append(
                            $('<img>')
                                .attr('src', 'Areas/assets/images/logo/favicon.png')
                                .css({ width: '20px', height: '20px', objectFit: 'contain' })
                        );
                    }

                    const $title = $('<span>').addClass('title').text(menu.Ten);
                    $a.append($iconHolder).append($title);

                    if (hasSub) {
                        const $arrow = $('<span>').addClass('arrow')
                            .append($('<i>').addClass('fas fa-chevron-down'));
                        $a.append($arrow);

                        const $dropdown = $('<ul>').addClass('dropdown-menu');

                        menu.SubMenus.forEach(sub => {
                            const $subLi = $('<li>');
                            const subLink = sub.Link ? sub.Link.replace(/^\/+/, '') : '';
                            const fullSubLink = subLink ? baseUrl + subLink : '#';

                            const $subA = $('<a>').attr('href', fullSubLink);

                            if (sub.IconName) {
                                $subA.append($('<i>').addClass(sub.IconName).addClass('mr-2'));
                            } else {
                                $subA.append(
                                    $('<img>')
                                        .attr('src', 'Areas/assets/images/logo/favicon.png')
                                        .css({
                                            width: '16px',
                                            height: '16px',
                                            objectFit: 'contain',
                                            marginRight: '6px'
                                        })
                                );
                            }

                            $subA.append(document.createTextNode(sub.Ten));
                            $subLi.append($subA);
                            $dropdown.append($subLi);
                        });

                        $li.addClass('dropdown').append($a).append($dropdown);
                    } else {
                        $li.append($a);
                    }

                    $sideNav.append($li);
                });

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
}); $(function () {
    function loadSideNav() {
        $.getJSON('/api/v1/admin/get-user-menus')
            .done(function (menus) {
                if (!menus || !Array.isArray(menus) || menus.length === 0) return;

                const $sideNav = $('.side-nav-menu');
                $sideNav.empty();
                const baseUrl = `${window.location.origin}/Admin/`;

                const menuMap = new Map();

                menus.forEach(menu => {
                    if (!menuMap.has(menu.ID)) {
                        menuMap.set(menu.ID, {
                            ...menu,
                            SubMenus: [...(menu.SubMenus || [])]
                        });
                    } else {
                        const existing = menuMap.get(menu.ID);
                        const combinedSubs = [...(existing.SubMenus || []), ...(menu.SubMenus || [])];

                        const subIdSet = new Set();
                        const uniqueSubs = [];
                        combinedSubs.forEach(sub => {
                            if (!subIdSet.has(sub.ID)) {
                                subIdSet.add(sub.ID);
                                uniqueSubs.push(sub);
                            }
                        });

                        existing.SubMenus = uniqueSubs;
                    }
                });

                // RENDER
                menuMap.forEach(menu => {
                    const hasSub = Array.isArray(menu.SubMenus) && menu.SubMenus.length > 0;
                    const $li = $('<li>').addClass('nav-item');

                    const menuLink = menu.Link ? menu.Link.replace(/^\/+/, '') : '';
                    const fullMenuLink = menuLink ? baseUrl + menuLink : 'javascript:void(0);';

                    const $a = $('<a>')
                        .attr('href', fullMenuLink)
                        .addClass(hasSub ? 'dropdown-toggle' : '');

                    const $iconHolder = $('<span>').addClass('icon-holder');
                    if (menu.IconName) {
                        $iconHolder.append($('<i>').addClass(menu.IconName));
                    } else {
                        $iconHolder.append(
                            $('<img>')
                                .attr('src', 'Areas/assets/images/logo/favicon.png')
                                .css({ width: '20px', height: '20px', objectFit: 'contain' })
                        );
                    }

                    const $title = $('<span>').addClass('title').text(menu.Ten);
                    $a.append($iconHolder).append($title);

                    if (hasSub) {
                        const $arrow = $('<span>').addClass('arrow')
                            .append($('<i>').addClass('fas fa-chevron-down'));
                        $a.append($arrow);

                        const $dropdown = $('<ul>').addClass('dropdown-menu');

                        menu.SubMenus.forEach(sub => {
                            const $subLi = $('<li>');
                            const subLink = sub.Link ? sub.Link.replace(/^\/+/, '') : '';
                            const fullSubLink = subLink ? baseUrl + subLink : '#';

                            const $subA = $('<a>').attr('href', fullSubLink);

                            if (sub.IconName) {
                                $subA.append($('<i>').addClass(sub.IconName).addClass('mr-2'));
                            } else {
                                $subA.append(
                                    $('<img>')
                                        .attr('src', 'Areas/assets/images/logo/favicon.png')
                                        .css({
                                            width: '16px',
                                            height: '16px',
                                            objectFit: 'contain',
                                            marginRight: '6px'
                                        })
                                );
                            }

                            $subA.append(document.createTextNode(sub.Ten));
                            $subLi.append($subA);
                            $dropdown.append($subLi);
                        });

                        $li.addClass('dropdown').append($a).append($dropdown);
                    } else {
                        $li.append($a);
                    }

                    $sideNav.append($li);
                });

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