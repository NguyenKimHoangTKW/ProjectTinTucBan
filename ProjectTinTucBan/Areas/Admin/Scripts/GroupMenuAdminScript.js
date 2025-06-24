// Lấy danh sách group menu kèm menu và submenu
function loadGroupMenus() {
    $.ajax({
        url: `${BASE_URL}/groupmenus-with-menus`,
        type: 'GET',
        success: function(data) {
            
            renderGroupMenuTabs(data);
        },
        error: function(xhr, status, error) {
            
            Swal.fire({
                icon: 'error',
                title: 'Lỗi tải group menu',
                text: 'Đã xảy ra lỗi khi tải danh sách group menu'
            });
        }
    });
}

// Biến toàn cục theo dõi trạng thái tab hiện tại
var currentActiveTabId = null;
var foundActive = false;

function renderGroupMenuTabs(groupMenus) {
    if (!groupMenus || groupMenus.length === 0) {
        $('#groupMenuTabsContainer').html('<div class="alert alert-info">Không có group menu nào.</div>');
        return;
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
                        <button class="btn btn-light text-primary add-menu-to-group-btn" 
                                data-id="${group.ID}" 
                                title="Thêm menu vào group">
                            <i class="fas fa-plus"></i><span class="d-none d-md-inline ml-1">Thêm</span>
                        </button>
                        <button class="btn btn-light text-warning edit-groupmenu-btn" 
                                data-id="${group.ID}" 
                                data-ten="${group.Ten}"
                                title="Sửa group menu">
                            <i class="fas fa-edit"></i><span class="d-none d-md-inline ml-1">Sửa</span>
                        </button>
                        <button class="btn btn-light text-danger delete-groupmenu-btn" 
                                data-id="${group.ID}"
                                title="Xóa group menu">
                            <i class="fas fa-trash"></i><span class="d-none d-md-inline ml-1">Xóa</span>
                        </button>
                    </div>
                </div>
            </li>
        `;

        var menuContent = '';
        if (group.Menus && group.Menus.length > 0) {
            menuContent = '<ul class="list-group list-group-flush">';
            group.Menus.forEach(function (menu) {
                menuContent += `
                    <li class="list-group-item">
                        <div class="d-flex justify-content-between align-items-center flex-wrap">
                            <div>
                                <strong>${menu.MenuName}</strong>
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
    $('[title]').tooltip();
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
        `)
        .appendTo('head');
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
// Thêm group menu
function addGroupMenu(ten) {
    $.ajax({
        url: `${BASE_URL}/add-groupmenu`,
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ Ten: ten }),
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
function editGroupMenu(id, ten) {
    $.ajax({
        url: `${BASE_URL}/edit-groupmenu`,
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ ID: id, Ten: ten }),
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

// Xóa menu khỏi group
function deleteMenuFromGroup(menuId, groupMenuId, btn) {
    if (btn) $(btn).prop('disabled', true);
    $.ajax({
        url: `${BASE_URL}/delete-menu-from-group`,
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
            MenuId: menuId,
            GroupMenuId: groupMenuId
        }),
        success: function (res) {
            Swal.fire({
                icon: res.success ? 'success' : 'error',
                title: res.message || (res.success ? 'Xóa menu thành công' : 'Xóa menu thất bại'),
                timer: 1500,
                showConfirmButton: false
            });
            if (res.success) {
                loadGroupMenus();
            }
        },
        error: function (xhr, status, error) {
            Swal.fire({
                icon: 'error',
                title: 'Lỗi',
                text: 'Đã xảy ra lỗi khi xóa menu khỏi group'
            });
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

// Thêm menu đã có vào group
function addExistingMenuToGroup(menuId, groupMenuId) {
    $.ajax({
        url: `${BASE_URL}/add-menu-to-group`,
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ MenuId: menuId, GroupMenuId: groupMenuId }),
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

// Hiển thị modal thêm menu vào group
function openAddMenuToGroupModal(groupMenuId) {
    loadMenusForSelect(function (menus) {
        var options = menus.map(m => `<option value="${m.MenuId}">${m.MenuName}</option>`).join('');
        $('#selectExistingMenu').html(options);
        $('#addMenuToGroupModal').data('group-id', groupMenuId).modal('show');
    });
}

// Xử lý submit form thêm menu vào group
$('#add-menu-to-group-form').submit(function (e) {
    e.preventDefault();
    var groupMenuId = $('#addMenuToGroupModal').data('group-id');
    var menuId = $('#selectExistingMenu').val();
    if (menuId) {
        addExistingMenuToGroup(menuId, groupMenuId);
        $('#addMenuToGroupModal').modal('hide');
        loadGroupMenus();
    }
});

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

// Helper function to render submenus
function renderSubMenus(subMenus, menuId, groupId) {
    if (!subMenus || subMenus.length === 0) return '';

    var html = '<div class="submenu-list ml-4 mt-2">';
    subMenus.forEach(function (submenu) {
        html += `
            <div class="submenu-item d-flex justify-content-between align-items-center py-2">
                <div>
                    <i class="fas fa-level-down-alt mr-2"></i>
                    <span>${submenu.SubMenuName}</span>
                    ${submenu.SubMenuLink ?
                `<span class="text-muted ml-2">(${submenu.SubMenuLink})</span>` :
                ''}
                </div>
                <button class="btn btn-sm btn-danger delete-submenu-from-group-btn"
                        data-submenuid="${submenu.SubMenuId}"
                        data-menuid="${menuId}"
                        data-groupid="${groupId}"
                        title="Xóa submenu khỏi group">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
    });
    html += '</div>';
    return html;
}

function updateTabStyles() {
    $('<style>')
        .text(`
            /* Existing styles */

            /* Add these new styles */
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
        if (!ten) {
            alert('Tên group không được để trống!');
            return;
        }
        addGroupMenu(ten);
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
        var id = $(this).data('id');
        var ten = $(this).data('ten');
        $('#editGroupMenuId').val(id);
        $('#editGroupMenuName').val(ten);
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
        if (!ten) {
            alert('Tên group không được để trống!');
            return;
        }
        editGroupMenu(id, ten);
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

    // Xóa submenu khỏi group
    function deleteSubMenuFromGroup(subMenuId, menuId, groupMenuId, btn) {
        if (btn) $(btn).prop('disabled', true);
        $.ajax({
            url: `${BASE_URL}/delete-submenu-from-group`,
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ SubMenuId: subMenuId, MenuId: menuId, GroupMenuId: groupMenuId }),
            success: function (res) {
                Swal.fire({
                    icon: res.success ? 'success' : 'error',
                    title: res.message || (res.success ? 'Xóa submenu thành công' : 'Xóa submenu thất bại'),
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

    // Event handlers
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
    /* //Chưa có api và  chưa có thuộc tính để lưu sau xử lý
    $(document).on('click', '.delete-submenu-from-group-btn', function (e) {
        e.stopPropagation();
        var subMenuId = $(this).data('submenuid');
        var menuId = $(this).data('menuid');
        var groupId = $(this).data('groupid');
        var btn = this;
        Swal.fire({
            title: 'Bạn có chắc muốn xóa submenu này khỏi group?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Xóa',
            cancelButtonText: 'Hủy'
        }).then((result) => {
            if (result.isConfirmed) {
                deleteSubMenuFromGroup(subMenuId, menuId, groupId, btn);
            }
        });
    }); */
});