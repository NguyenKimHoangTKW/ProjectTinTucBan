// Lấy danh sách group menu kèm menu và submenu
function loadGroupMenus() {
    $.get(`${BASE_URL}/groupmenus-with-menus`, function (data) {
        renderGroupMenuTabs(data);
    });
}

function renderGroupMenuTabs(groupMenus) {
    var tabList = '';
    var tabContent = '';
    var first = true;

    groupMenus.forEach(function (group) {
        var tabId = 'groupmenu-tab-' + group.ID;
        var paneId = 'groupmenu-pane-' + group.ID;

        var isActive = false;
        if (currentActiveTabId && tabId === currentActiveTabId) {
            isActive = true;
            foundActive = true;
        } else if (!currentActiveTabId && first) {
            isActive = true;
        }

        tabList += `
            <li class="nav-item" style="position:relative; padding-right:120px;">
                <div style="display:flex; align-items:center;">
                    <a class="nav-link${first ? ' active' : ''}" id="${tabId}" data-toggle="tab"
                        href="#${paneId}" role="tab" aria-controls="${paneId}" aria-selected="${first}"
                        style="flex:1 1 auto;">
                        ${group.Ten}
                    </a>
                    <div style="position:absolute; padding-top:200px; right:8px; top:50%; transform:translateY(-50%); display:flex; flex-direction:column; gap:4px; z-index:2;">
                        <button class="btn btn-sm btn-success add-menu-to-group-btn" data-id="${group.ID}" title="Thêm menu vào group">
                            <i class="fas fa-plus"></i>
                        </button>
                        <button class="btn btn-sm btn-info edit-groupmenu-btn" data-id="${group.ID}" data-ten="${group.Ten}" title="Sửa group menu">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger delete-groupmenu-btn" data-id="${group.ID}" title="Xóa group menu">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
            </li>
        `;

        // Render menu và submenu
        var menuHtml = '';
        if (group.Menus && group.Menus.length > 0) {
            menuHtml += '<ul class="list-group mt-2">';
            group.Menus.forEach(function (menu) {
                menuHtml += `<li class="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                        <strong>${menu.MenuName}</strong> ${menu.MenuLink ? `<span class="text-muted">(${menu.MenuLink})</span>` : ''}
                    </div>
                    <button class="btn btn-xs btn-danger delete-menu-from-group-btn" data-menuid="${menu.MenuId}" data-groupid="${group.ID}" title="Xóa menu khỏi group">
                        <i class="fas fa-times"></i>
                    </button>
                `;
                if (menu.SubMenus && menu.SubMenus.length > 0) {
                    menuHtml += '<ul class="list-group mt-2">';
                    menu.SubMenus.forEach(function (sub) {
                        menuHtml += `<li class="list-group-item py-1 px-3 d-flex justify-content-between align-items-center">
                            <div>
                                <span>${sub.SubMenuName}</span>
                                ${sub.SubMenuLink ? `<a href="${sub.SubMenuLink}" target="_blank" class="ml-2 text-primary">${sub.SubMenuLink}</a>` : ''}
                            </div>
                            <button class="btn btn-xs btn-danger delete-submenu-from-group-btn" data-submenuid="${sub.SubMenuId}" data-menuid="${menu.MenuId}" data-groupid="${group.ID}" title="Xóa submenu khỏi group">
                                <i class="fas fa-times"></i>
                            </button>
                        </li>`;
                    });
                    menuHtml += '</ul>';
                }
                menuHtml += '</li>';
            });
            menuHtml += '</ul>';
        } else {
            menuHtml = '<p class="text-muted">Chưa có menu nào trong group này.</p>';
        }

        tabContent += `
            <div class="tab-pane fade${first ? ' show active' : ''}" id="${paneId}" role="tabpanel" aria-labelledby="${tabId}">
                <p>ID: ${group.ID}</p>
                <p>Ngày tạo: ${formatUnixToDate(group.NgayTao)}</p>
                <p>Ngày cập nhật: ${formatUnixToDate(group.NgayCapNhat)}</p>
                <div>
                    <h6>Menus:</h6>
                    ${menuHtml}
                </div>
            </div>
        `;

        first = false;
    });

    var html = `
        <div class="d-flex">
            <ul class="nav nav-tabs flex-column" id="myTabVertical" role="tablist" style="min-width:180px;">
                ${tabList}
            </ul>
            <div class="tab-content m-l-15 flex-grow-1" id="myTabContentVertical">
                ${tabContent}
            </div>
        </div>
    `;

    $('#groupMenuTabsContainer').html(html);
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
        loadGroupMenus();
        $('#addMenuToGroupModal').modal('hide');
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
    loadGroupMenus();
    $('#addMenuToGroupModal').modal('hide');
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



$(document).ready(function () {
    loadGroupMenus();
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
        loadGroupMenus();
        $('#addGroupMenuModal').modal('hide');
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
        loadGroupMenus();
        $('#editGroupMenuModal').modal('hide');
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
            }
        });
    });

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
    });
});