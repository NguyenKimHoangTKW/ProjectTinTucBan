$(document).ready(function () {
    loadGroupMenus();

    $('#myTabJustified a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
        if ($(e.target).attr('id') === 'group-tab-justified') {
            currentActiveTabId = null;
            sessionStorage.removeItem('activeGroupMenuTab');
            loadGroupMenus();
        }
    });

    // Mở modal khi bấm nút
    $('#openAddGroupMenuModal').click(function () {
        $('#groupMenuName').val('');
        $('#addGroupMenuModal').modal('show');
    });

    // Xử lý submit form thêm group
    $('#add-groupmenu-form').submit(function (e) {
        e.preventDefault();
        var ten = $('#groupMenuName').val().trim();
        var asignTo = $('#groupAsignTo').val().trim();
        if (!ten) {
            alert('Tên group không được để trống!');
            return;
        }
        addGroupMenu(ten, asignTo);
        $('#addGroupMenuModal').modal('hide');
        loadGroupMenus();
    });

    $(document).on('shown.bs.tab', 'a[data-toggle="tab"]', function (e) {
        var activeTabId = $(e.target).attr('id'); // e.g., groupmenu-tab-1
        $('.tab-action-buttons').hide(); // Hide all button groups
        $('.tab-pane.active .tab-action-buttons').show(); // Show for active tab
    });

    // Xử lý click nút xóa group menu  
    $(document).on('click', '.delete-groupmenu-btn', function (e) {
        e.stopPropagation();
        var id = $(this).data('id');
        var btn = this;
        Swal.fire({
            title: 'Bạn có chắc muốn xóa group menu này?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Xóa',
            cancelButtonText: 'Hủy'
        }).then((result) => {
            if (result.isConfirmed) {
                deleteGroupMenu(id, btn);
                loadGroupMenus();
            }
        });
    });

    // Xử lý click nút sửa group menu
    $(document).on('click', '.edit-groupmenu-btn', function (e) {
        e.stopPropagation();

        // Xóa thông tin cũ trước khi load mới
        $('#editGroupMenuId').val('');
        $('#editGroupMenuName').val('');
        $('#editGroupAsignTo').val('');


        var id = $(this).data('id');
        var ten = $(this).data('ten');
        var asignTo = $(this).data('asignto');

        $('#editGroupMenuId').val(id);
        $('#editGroupMenuName').val(ten);
        $('#editGroupAsignTo').val(asignTo);
        $('#editGroupMenuModal').modal('show');
    });

    $(document).on('click', '.add-menu-to-group-btn', function (e) {
        e.stopPropagation();
        var groupMenuId = $(this).data('id');
        openAddMenuToGroupModal(groupMenuId);
        loadGroupMenus();
    });

    // Xử lý submit form sửa group menu
    $('#edit-groupmenu-form').submit(function (e) {
        e.preventDefault();
        var id = $('#editGroupMenuId').val();
        var ten = $('#editGroupMenuName').val().trim();
        var asignTo = parseInt($('#editGroupAsignTo').val(), 10);

        if (!ten) {
            alert('Tên group không được để trống!');
            return;
        }
        editGroupMenu(id, ten, asignTo);
        $('#editGroupMenuModal').modal('hide');
        loadGroupMenus();
    });

    // Xóa menu khỏi group
    function deleteMenuFromGroup(menuId, groupMenuId, btn) {
        if (btn) $(btn).prop('disabled', true);
        $.ajax({
            url: `${BASE_URL}/delete-menu-from-group`,
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ MenuId: menuId, GroupMenuId: groupMenuId }),
            success: function (res) {
                Swal.fire({
                    icon: res.success ? 'success' : 'error',
                    title: res.message || (res.success ? 'Xóa menu thành công' : 'Xóa menu thất bại'),
                    timer: 1500,
                    showConfirmButton: false
                });
                loadGroupMenus();
            },
            complete: function () {
                if (btn) $(btn).prop('disabled', false);
            }
        });
    }

    // Xử lý sự kiện nhấn nút xóa để xóa menu khỏi group
    $(document).on('click', '.delete-menu-from-group-btn', function (e) {
        e.stopPropagation();
        var menuId = $(this).data('menuid');
        var groupId = $(this).data('groupid');
        var btn = this;
        Swal.fire({
            title: 'Bạn có chắc muốn xóa menu này khỏi group?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Xóa',
            cancelButtonText: 'Hủy'
        }).then((result) => {
            if (result.isConfirmed) {
                deleteMenuFromGroup(menuId, groupId, btn);
                loadGroupMenus();
            }
        });
    });
});

// Lấy danh sách group menu kèm menu và submenu
function loadGroupMenus() {
    $.ajax({
        url: `${BASE_URL}/groupmenus-with-menus`,
        type: 'GET',
        success: function (data) {

            renderGroupMenuTabs(data);
        },
        error: function (xhr, status, error) {

            Swal.fire({
                icon: 'error',
                title: 'Lỗi tải group menu',
                text: 'Đã xảy ra lỗi khi tải danh sách group menu'
            });
        }
    });
}



/* Code render menu */
// Biến toàn cục theo dõi trạng thái tab hiện tại
var currentActiveTabId = null;
var foundActive = false;

function truncateString(str, maxLength) {
    if (str.length <= maxLength) {
        return str;
    }
    return str.slice(0, maxLength - 3) + '...';
}
function renderGroupMenuTabs(groupMenus) {
    if (!groupMenus || groupMenus.length === 0) {
        $('#groupMenuTabsContainer').html('<div class="alert alert-info">Không có group menu nào.</div>');
        return;
    }

    // Ánh xạ giá trị AsignTo sang tên vị trí
    function getAsignToName(asignTo) {
        switch (asignTo) {
            case 1: return 'Header';
            case 2: return 'User Navbar';
            case 0: return 'Chưa được dùng';
            default: return 'Không xác định';
        }
    }

    

    var tabList = '';
    var tabContent = '';
    var first = true;

    foundActive = false;

    groupMenus.forEach(function (group) {
        var tabId = 'groupmenu-tab-' + group.ID;
        var paneId = 'groupmenu-pane-' + group.ID;

        var isActive = false;
        if (currentActiveTabId && tabId === currentActiveTabId) {
            isActive = true;
            foundActive = true;
        } else if (!currentActiveTabId && first) {
            isActive = true;
            currentActiveTabId = tabId;
        }

        

        // Tạo nút xóa chỉ khi IsImportant !== 1
        var deleteButtonHtml = '';
        if (group.IsImportant !== 1) {
            deleteButtonHtml = `
                <button class="btn btn-danger delete-groupmenu-btn" 
                        data-id="${group.ID}"
                        title="Xóa group menu">
                    <i class="fas fa-trash"></i><span class="d-none d-md-inline ml-1">Xóa</span>
                </button>
            `;
        }

        tabList += `
            <li class="nav-item">
                <div class="d-flex align-items-start justify-content-between w-100 flex-column flex-md-row">
                    <a class="nav-link${isActive ? ' active' : ''}" 
                       id="${tabId}" 
                       data-toggle="tab"
                       href="#${paneId}" 
                       role="tab"
                       aria-selected="${isActive}">
                        ${group.Ten}
                    </a>
                    <div class="btn-group btn-group-sm d-flex flex-wrap flex-md-nowrap ml-md-2 mt-2 mt-md-0" role="group">
                        <button class="btn btn-sm btn-primary add-menu-to-group-btn" 
                                data-id="${group.ID}" 
                                title="Thêm menu vào group">
                            <i class="fas fa-plus"></i><span class="d-none d-md-inline ml-1">Thêm</span>
                        </button>
                        <button class="btn btn-sm btn-warning edit-groupmenu-btn" 
                                data-id="${group.ID}" 
                                data-ten="${group.Ten}"
                                data-asignto="${group.AsignTo}"
                                title="Sửa group menu">
                            <i class="fas fa-edit"></i><span class="d-none d-md-inline ml-1">Sửa</span>
                        </button>
                        ${deleteButtonHtml}
                    </div>
                </div>
            </li>
        `;

        var menuContent = '';
        if (group.Menus && group.Menus.length > 0) {
            // Gộp các menu trùng ID
            const menuMap = new Map();

            group.Menus.forEach(function (menu) {
                if (!menuMap.has(menu.MenuId)) {
                    menuMap.set(menu.MenuId, {
                        MenuId: menu.MenuId,
                        MenuName: menu.MenuName,
                        MenuLink: menu.MenuLink,
                        SubMenus: [...(menu.SubMenus || [])]
                    });
                } else {
                    const existing = menuMap.get(menu.MenuId);
                    const combined = [...existing.SubMenus, ...(menu.SubMenus || [])];

                    // Lọc trùng theo SubMenuId
                    const uniqueSubs = [];
                    const subIdSet = new Set();
                    combined.forEach(sub => {
                        if (!subIdSet.has(sub.SubMenuId)) {
                            subIdSet.add(sub.SubMenuId);
                            uniqueSubs.push(sub);
                        }
                    });
                    existing.SubMenus = uniqueSubs;
                }
            });

            

            menuContent = '<ul class="list-group list-group-flush">';
            menuMap.forEach(function (menu) {
                var MnName = escapeHtml(truncateString(menu.MenuName, 30)); 
                menuContent += `
                    <li class="list-group-item">
                        <div class="d-flex justify-content-between align-items-center flex-wrap">
                            <div>
                                <strong>${MnName}</strong>
                                ${menu.MenuLink ? `<span class="text-muted ml-2">(${menu.MenuLink})</span>` : ''}
                            </div>
                            <button class="btn btn-sm btn-outline-danger delete-menu-from-group-btn mt-2 mt-md-0" 
                                    data-menuid="${menu.MenuId}" 
                                    data-groupid="${group.ID}">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        ${renderSubMenus(menu.SubMenus, menu.MenuId, group.ID)}
                    </li>
                `;
            });
            menuContent += '</ul>';
        } else {
            menuContent = '<p class="text-muted m-3">Chưa có menu nào trong group này.</p>';
        }

        tabContent += `
            <div class="tab-pane fade${isActive ? ' show active' : ''}" 
                 id="${paneId}" 
                 role="tabpanel">
                <div class="card">
                    <div class="card-body">
                        <h6 class="card-subtitle mb-3 text-muted">
                            Vị trí sử dụng: <strong>${getAsignToName(group.AsignTo)}</strong><br>
                            Ngày tạo: ${formatUnixToDate(group.NgayTao)}
                            <br>
                            Ngày cập nhật: ${formatUnixToDate(group.NgayCapNhat)}
                        </h6>
                        ${menuContent}
                    </div>
                </div>
            </div>
        `;

        first = false;
    });

    if (!foundActive && groupMenus.length > 0) {
        var firstTabId = 'groupmenu-tab-' + groupMenus[0].ID;
        currentActiveTabId = firstTabId;
    }

    var html = `
        <div class="card">
            <div class="card-body">
                <div class="d-flex flex-column flex-md-row">
                    <ul class="nav nav-tabs flex-column" id="myTabVertical" role="tablist" style="min-width: 250px; border-right: 1px solid #dee2e6;">
                        ${tabList}
                    </ul>
                    <div class="tab-content ml-md-3 mt-3 mt-md-0 flex-grow-1" id="myTabContentVertical">
                        ${tabContent}
                    </div>
                </div>
            </div>
        </div>
    `;

    $('#groupMenuTabsContainer').html(html);

    updateTabStyles();
    $('[title]').tooltip({
        trigger: 'hover',
        delay: { show: 500, hide: 100 }
    });
    initializeTabHandlers();
}

// Cập nhật style
function updateTabStyles() {
    $('<style>')
        .text(`
            #myTabVertical .nav-link {
                border-radius: 0;
                border: none;
                border-right: 3px solid transparent;
                padding: 0.75rem 1rem;
                color: #495057;
                cursor: pointer;
            }
            #myTabVertical .nav-link.active {
                color: #007bff;
                background-color: #f8f9fa;
                border-right-color: #007bff;
            }
            #myTabVertical .nav-item {
                margin-bottom: 0;
                border-bottom: 1px solid #dee2e6;
            }
            #myTabVertical .nav-item:last-child {
                border-bottom: none;
            }
            .tab-content {
                min-height: 300px;
            }
            .list-group-item {
                border-left: none;
                border-right: none;
            }
            .btn-group .btn {
                padding: 0.25rem 0.5rem;
                font-size: 0.875rem;
            }
            @media (max-width: 767.98px) {
                .btn-group {
                    flex-wrap: wrap;
                    gap: 4px;
                }
                .btn-group .btn {
                    flex: 1 0 30%;
                    text-align: center;
                }
            }
            .submenu-list {
                border-left: 2px solid #dee2e6;
            }
            .submenu-item {
                padding: 0.5rem 1rem;
                border-bottom: 1px solid #f8f9fa;
            }
            .submenu-item:last-child {
                border-bottom: none;
            }
            .submenu-item .fas.fa-level-down-alt {
                color: #6c757d;
            }
            .submenu-item:hover {
                background-color: #f8f9fa;
            }
        `)
        .appendTo('head');
}
function renderSubMenus(subMenus, menuId, groupId) {
    if (!subMenus || subMenus.length === 0) {
        return '<small class="text-muted d-block ml-3">Không có submenu</small>';
    }

    var html = '<ul class="list-group list-group-flush ml-3 mt-2">';
    subMenus.forEach(function (sub) {
        var SubName = escapeHtml(truncateString(sub.SubMenuName, 30)); 
        html += `
            <li class="list-group-item py-1 px-2">
                <div class="d-flex justify-content-between align-items-center">
                    <span>${SubName} ${sub.SubMenuLink ? `<span class="text-muted ml-2">(${sub.SubMenuLink})</span>` : ''}</span>
                    <button class="btn btn-sm btn-outline-danger delete-submenu-btn"
                            data-submenuid="${sub.SubMenuId}" 
                            data-menuid="${menuId}" 
                            data-groupid="${groupId}">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </li>
        `;
    });
    html += '</ul>';
    return html;
}


// Cập nhật handlers cho tab
function initializeTabHandlers() {
    $(document).off('click', 'a[data-toggle="tab"]');

    // Add new click handler
    $(document).on('click', 'a[data-toggle="tab"]', function (e) {
        e.preventDefault();

        // Remove active class from all tabs in the same tab group
        $(this).closest('.nav').find('.nav-link').removeClass('active');

        // Find the parent container and remove active class from all panes
        var $tabContainer = $(this).closest('.card').find('.tab-content');
        $tabContainer.find('.tab-pane').removeClass('show active');

        // Add active class to clicked tab
        $(this).addClass('active');

        // Show corresponding tab content
        var targetId = $(this).attr('href');
        $(targetId).addClass('show active');

        // Update current active tab ID
        currentActiveTabId = $(this).attr('id');

        // Store the active tab ID in sessionStorage
        sessionStorage.setItem('activeGroupMenuTab', currentActiveTabId);
    });

    // Restore active tab from session storage if exists
    var savedTabId = sessionStorage.getItem('activeGroupMenuTab');
    if (savedTabId) {
        currentActiveTabId = savedTabId;
    }
}


/* Code chức năng */
// Thêm group menu
function addGroupMenu(ten, asignTo) {
    $.ajax({
        url: `${BASE_URL}/add-groupmenu`,
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
            Ten: ten,
            AsignTo: asignTo
        }),
        success: function (res) {
            Swal.fire({
                icon: res.success ? 'success' : 'error',
                title: res.message || (res.success ? 'Thêm thành công' : 'Thêm thất bại'),
                timer: 1500,
                showConfirmButton: false
            });
            loadGroupMenus();
        }
    });
}

// Sửa group menu
function editGroupMenu(id, ten, asignTo) {
    $.ajax({
        url: `${BASE_URL}/edit-groupmenu`,
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
            ID: id,
            Ten: ten,
            AsignTo: asignTo
        }),
        success: function (res) {
            Swal.fire({
                icon: res.success ? 'success' : 'error',
                title: res.message || (res.success ? 'Cập nhật thành công' : 'Cập nhật thất bại'),
                timer: 1500,
                showConfirmButton: false
            });
            loadGroupMenus();
        }
    });
}

// Xóa group menu
function deleteGroupMenu(id, btn) {
    if (btn) $(btn).prop('disabled', true);
    $.ajax({
        url: `${BASE_URL}/delete-groupmenu`,
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(id),
        success: function (res) {
            Swal.fire({
                icon: res.success ? 'success' : 'error',
                title: res.message || (res.success ? 'Xóa thành công' : 'Xóa thất bại'),
                timer: 1500,
                showConfirmButton: false
            });
            loadGroupMenus();
        },
        complete: function () {
            if (btn) $(btn).prop('disabled', false);
        }
    });
}

// Lấy danh sách menu để chọn khi thêm vào group
function loadMenusForSelect(callback) {
    $.get(`${BASE_URL}/menus-with-submenus`, function (data) {
        if (callback) callback(data);
    });
}


// Thêm mới menu vào group
function addNewMenuToGroup(menuName, menuLink, groupMenuId) {

    $.ajax({
        url: `${BASE_URL}/add-menu`,
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ Ten: menuName, Link: menuLink }),
        success: function (res, status, xhr) {
            // Lấy ID menu vừa tạo (giả sử API trả về ID, nếu không cần sửa lại backend)
            if (xhr.responseJSON && xhr.responseJSON.ID) {
                var newMenuId = xhr.responseJSON.ID;
                addExistingMenuToGroup(newMenuId, groupMenuId);
            } else {
                // Nếu API không trả về ID, cần lấy lại danh sách menu và tìm theo tên
                loadMenusForSelect(function (menus) {
                    var found = menus.find(m => m.MenuName === menuName);
                    if (found) addExistingMenuToGroup(found.MenuId, groupMenuId);
                });
            }
        }
    });
}

//Tạo mới menu và thêm vào group

// Xử lý submit form thêm mới menu vào group (nút "Thêm mới và gán vào group")
$('#add-new-menu-to-group-form').off('submit').on('submit', function (e) {
    e.preventDefault();

    var groupMenuId = $('#addMenuToGroupModal').data('group-id');
    var menuName = $('#newMenuName').val().trim();
    var menuLink = $('#newMenuLink').val().trim();

    if (!menuName) {
        Swal.fire('Lỗi', 'Tên menu không được để trống!', 'warning');
        return;
    }

    // Gọi API add-menu
    $.ajax({
        url: `${BASE_URL}/add-menu`,
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
            Ten: menuName,
            Link: menuLink
        }),
        success: function (res, status, xhr) {
            // Sau khi thêm menu thành công, lấy lại danh sách menu để tìm ID menu vừa thêm
            $.get(`${BASE_URL}/get-menus`, function (menus) {
                var found = menus && menus.length
                    ? menus.find(m => m.MenuName === menuName && m.MenuLink === menuLink)
                    : null;
                if (found) {
                    // Gọi API add-menu-to-group
                    $.ajax({
                        url: `${BASE_URL}/add-menu-to-group`,
                        type: 'POST',
                        contentType: 'application/json',
                        data: JSON.stringify({
                            MenuId: found.MenuId,
                            GroupMenuId: groupMenuId
                        }),
                        success: function (res2) {
                            Swal.fire({
                                icon: res2.success ? 'success' : 'error',
                                title: res2.message || (res2.success ? 'Thêm thành công' : 'Thêm thất bại'),
                                timer: 1500,
                                showConfirmButton: false
                            });
                            $('#addMenuToGroupModal').modal('hide');
                            loadGroupMenus();
                        },
                        error: function () {
                            Swal.fire('Lỗi', 'Không thể gán menu vào group', 'error');
                        }
                    });
                } else {
                    Swal.fire('Lỗi', 'Không tìm thấy menu vừa thêm!', 'error');
                }
            });
        },
        error: function (xhr) {
            Swal.fire('Lỗi', xhr.responseJSON && xhr.responseJSON.Message ? xhr.responseJSON.Message : 'Không thể thêm menu', 'error');
        }
    });
});

// Hiển thị modal thêm menu vào group
function openAddMenuToGroupModal(groupId) {
    $('#selectExistingMenu').empty();
    $('#selectTargetMenuInGroup').empty();
    $('#selectSubMenu').empty();
    $('#newMenuName').val('');
    $('#newMenuLink').val('');

    $('#addMenuToGroupModal').data('group-id', groupId);

    // Load tất cả menu (cho dropdown bên trái)
    $.get(`${BASE_URL}/get-menus`, function (menus) {
        menus.forEach(m => {
            $('#selectExistingMenu').append(`<option value="${m.MenuId}">${m.MenuName}</option>`);
        });
    });

    // Load submenu
    $.get(`${BASE_URL}/get-submenus`, function (subs) {
        subs.forEach(s => {
            $('#selectSubMenu').append(`<option value="${s.SubMenuId}">${s.SubMenuName}</option>`);
        });
    });

    // Load menu trong group cho dropdown mục tiêu
    $.get(`${BASE_URL}/get-groupmenu-menus/${groupId}`, function (group) {
        if (group && group.Menus && group.Menus.length > 0) {
            group.Menus.forEach(menu => {
                $('#selectTargetMenuInGroup').append(`<option value="${menu.MenuId}">${menu.MenuName}</option>`);
            });
        }
    });

    $('#addMenuToGroupModal').modal('show');
}



// Xử lý submit form thêm mới menu vào group
$('#add-new-menu-to-group-form').submit(function (e) {
    e.preventDefault();
    var groupMenuId = $('#addMenuToGroupModal').data('group-id');
    var menuName = $('#newMenuName').val().trim();
    var menuLink = $('#newMenuLink').val().trim();
    if (!menuName) {
        alert('Tên menu không được để trống!');
        return;
    }
    addNewMenuToGroup(menuName, menuLink, groupMenuId);
    $('#addMenuToGroupModal').modal('hide');
    loadGroupMenus();
});


function formatUnixToDate(unixTime) {
    if (!unixTime) return '';
    if (unixTime < 10000000000) unixTime *= 1000;
    var date = new Date(unixTime);
    var days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    var dayName = days[date.getDay()];
    var day = ('0' + date.getDate()).slice(-2);
    var month = ('0' + (date.getMonth() + 1)).slice(-2);
    var year = date.getFullYear();
    var hours = ('0' + date.getHours()).slice(-2);
    var minutes = ('0' + date.getMinutes()).slice(-2);
    var seconds = ('0' + date.getSeconds()).slice(-2);
    return `${dayName}, ${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
}


// Submit thêm menu vào group + gán submenu
$('#add-menu-to-group-form').off('submit').on('submit', function (e) {
    e.preventDefault();
    const $submitBtn = $('#add-menu-to-group-form button[type="submit"]');
    $submitBtn.prop('disabled', true);

    const groupId = $('#addMenuToGroupModal').data('group-id');
    const menuId = $('#selectExistingMenu').val();
    const subMenuIds = $('#selectSubMenu').val() || [];

    if (!menuId) {
        Swal.fire('Lỗi', 'Vui lòng chọn menu', 'warning');
        return;
    }

    //Thêm menu vào group
    $.ajax({
        url: `${BASE_URL}/add-menu-to-group`,
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ GroupMenuId: groupId, MenuId: menuId }),
        success: function (res) {
            if (res.success) {
                Swal.fire('Thành công', res.message, 'success');
                $('#addMenuToGroupModal').modal('hide');
                loadGroupMenus();
                $submitBtn.prop('disabled', false);
            } else {
                Swal.fire('Lỗi', res.message || 'Không thể thêm menu vào group', 'error');
                $submitBtn.prop('disabled', false);
            }
        },
        error: function () {
            Swal.fire('Lỗi', 'Không thể thêm menu vào group', 'error');
            $submitBtn.prop('disabled', false);
        }
    });
});


// Example usage: add selected submenus to a menu in a group
function addSubmenusToMenuInGroup(groupMenuId, menuId, subMenuIds) {
    $.ajax({
        url: '/api/v1/admin/add-submenus-to-menu-in-group',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
            GroupMenuId: groupMenuId,
            MenuId: menuId,
            SubMenuIds: subMenuIds // array of submenu IDs
        }),
        success: function (res) {
            if (res.success) {
                Swal.fire('Thành công', res.message, 'success');
                // Optionally reload group menus or update UI here
            } else {
                Swal.fire('Lỗi', res.message || 'Không thể thêm submenu', 'error');
            }
        },
        error: function (xhr) {
            Swal.fire('Lỗi', xhr.responseJSON && xhr.responseJSON.Message ? xhr.responseJSON.Message : 'Không thể thêm submenu', 'error');
        }
    });
}