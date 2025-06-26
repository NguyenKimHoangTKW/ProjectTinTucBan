$(function () {
    function loadSideNav() {
        $.getJSON('/api/v1/admin/groupmenu-menus/17') // id cứng để test, sau này đổi lại trong api
            .done(function (group) {
                const $sideNav = $('.side-nav-menu').empty();

                if (!group || !Array.isArray(group.Menus) || group.Menus.length === 0) {
                    $sideNav.append('<li class="nav-item"><span class="title">Không có menu</span></li>');
                    return;
                }

                group.Menus.forEach(menu => {
                    const hasSub = Array.isArray(menu.SubMenus) && menu.SubMenus.length > 0;
                    const $li = $('<li></li>').addClass('nav-item');

                    const $a = $('<a></a>')
                        .attr('href', menu.MenuLink || 'javascript:void(0);')
                        .addClass(hasSub ? 'dropdown-toggle' : '');

                    // Icon holder
                    const $iconHolder = $('<span></span>').addClass('icon-holder');
                    $iconHolder.append($('<i></i>').addClass(menu.IconClass || 'anticon anticon-dashboard'));

                    // Title
                    const $title = $('<span></span>').addClass('title').text(menu.MenuName);

                    $a.append($iconHolder).append($title);

                    if (hasSub) {
                        // Add arrow for dropdown
                        const $arrow = $('<span></span>').addClass('arrow')
                            .append($('<i></i>').addClass('fas fa-chevron-down'));
                        $a.append($arrow);

                        // Create dropdown menu
                        const $dropdown = $('<ul></ul>').addClass('dropdown-menu');
                        menu.SubMenus.forEach(sub => {
                            const $subLi = $('<li></li>');
                            const $subA = $('<a></a>')
                                .attr('href',sub.SubMenuLink || '#')
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

                // Initialize dropdown toggles
                $('.dropdown-toggle').on('click', function (e) {
                    e.preventDefault();
                    $(this).parent().toggleClass('open');
                    $(this).next('.dropdown-menu').slideToggle(200);
                });
            })
            .fail(function (jqXHR, textStatus, errorThrown) {
                console.error('Lỗi khi tải side menu:', textStatus, errorThrown);
                $('.side-nav-menu').empty()
                    .append('<li class="nav-item"><span class="title text-danger">Lỗi tải menu</span></li>');
            });
    }

    loadSideNav();
});