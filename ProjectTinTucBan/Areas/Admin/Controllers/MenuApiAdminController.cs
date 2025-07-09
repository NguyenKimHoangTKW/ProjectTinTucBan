using Microsoft.Ajax.Utilities;
using Microsoft.EntityFrameworkCore.Query.Internal;
using ProjectTinTucBan.Helper;
using ProjectTinTucBan.Models;
using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Data.Entity.Infrastructure;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Runtime.CompilerServices;
using System.Threading.Tasks;
using System.Web.Http;
using System.Web.ModelBinding;
using System.Web.Security;

namespace ProjectTinTucBan.Areas.Admin.Controllers
{
    [RoutePrefix("api/v1/admin")]
    public class MenuApiAdminController : ApiController
    {
        private WebTinTucTDMUEntities db = new WebTinTucTDMUEntities();
        private int unixTimestamp;
        public MenuApiAdminController()
        {
            DateTime now = DateTime.UtcNow;
            unixTimestamp = (int)(now.Subtract(new DateTime(1970, 1, 1))).TotalSeconds;
        }

        // 1. Lấy danh sách menu và submenu
        [HttpGet]
        [Route("menus-with-submenus")]
        public async Task<IHttpActionResult> GetMenusWithSubmenus()
        {
            var user = SessionHelper.GetUser();
            if (user == null)
                return Unauthorized();

            IQueryable<Menu> query = db.Menus.OrderBy(x => x.ThuTuShow);
            if (user.ID_role != 1)
            {
                query = query.Where(x => x.IsImportant != 2);
            }

            var menus = await query
                .Select(m => new
                {
                    MenuId = m.ID,
                    MenuName = m.Ten,
                    MenuLink = m.Link,
                    IconName = m.IconName,
                    MenuOrder = m.ThuTuShow,
                    IsImportant = m.IsImportant,
                    SubMenus = m.Menu_by_sub
                        .Where(x => x.id_sub != null)
                        .OrderBy(x => x.Sub_Menu.ThuTuShow)
                        .Select(x => new
                        {
                            SubMenuId = x.Sub_Menu.id_sub,
                            SubMenuName = x.Sub_Menu.name_sub,
                            SubMenuLink = x.Sub_Menu.Link,
                            IconName = x.Sub_Menu.IconName,
                            SubMenuOrder = x.Sub_Menu.ThuTuShow
                        })
                        .ToList()
                })
                .ToListAsync();

            if (menus == null || menus.Count == 0)
                return NotFound();
            else
                return Ok(menus);
        }

        [HttpGet]
        [Route("get-submenus")]
        public async Task<IHttpActionResult> GetSubmenus()
        {
            var submenus = await db.Sub_Menu.
                OrderBy(x => x.ThuTuShow)
                        .Select(x => new
                        {
                            SubMenuId = x.id_sub,
                            SubMenuName = x.name_sub,
                            SubMenuLink = x.Link,
                            IconName = x.IconName,
                            SubMenuOrder = x.ThuTuShow
                        }).ToListAsync();
            if (submenus == null || submenus.Count == 0)
                return NotFound();
            else
                return Ok(submenus);
        }

        public class MenuDto
        {
            public int MenuId { get; set; }
            public string MenuName { get; set; }
            public string MenuLink { get; set; }
            public string IconName { get; set; }
            public int? IsImportant { get; set; }
            public int? MenuOrder { get; set; }
        }

        [HttpGet]
        [Route("get-menus")]
        public async Task<IHttpActionResult> Getmenus()
        {
            var user = SessionHelper.GetUser();
            if (user == null)
                return Unauthorized();

            int userId = (int)user.ID_role;

            IQueryable<Menu> query = db.Menus
            .OrderBy(x => x.ThuTuShow);

            if (userId != 1)
            {
                query = query.Where(x => x.IsImportant != 2);
            }

            var menus = await query
                .Select(x => new MenuDto
                {
                    MenuId = x.ID,
                    MenuName = x.Ten,
                    MenuLink = x.Link,
                    IconName = x.IconName,
                    IsImportant = x.IsImportant,
                    MenuOrder = x.ThuTuShow
                })
                .ToListAsync();


            if (menus == null || menus.Count == 0)
                return NotFound();
            else
                return Ok(menus);
        }

        // 2. Thêm menu mới
        [HttpPost]
        [Route("add-menu")]
        public async Task<IHttpActionResult> AddMenu([FromBody] Menu menu)
        {
            if (string.IsNullOrEmpty(menu.Ten))
                return BadRequest("Tên menu không được để trống.");

            // Lấy Unix timestamp hiện tại
            var unixTimestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds();

            // Tìm giá trị ThuTuShow lớn nhất
            int maxThuTuShow = await db.Menus.MaxAsync(m => (int?)m.ThuTuShow) ?? 0;

            // Gán giá trị ThuTuShow mới
            menu.ThuTuShow = maxThuTuShow + 1;
            menu.IsImportant = 0;   
            menu.NgayDang = (int)unixTimestamp;
            menu.NgayCapNhat = (int)unixTimestamp;

            db.Menus.Add(menu);
            await db.SaveChangesAsync();

            return Ok();
        }

        public class AddSubMenuDto
        {
            public int MenuId { get; set; }
            public string SubMenuName { get; set; }
            public string SubMenuLink { get; set; }
            public string IconName { get; set; }
        }

        // 3. Thêm submenu mới
        [HttpPost]
        [Route("add-submenu")]
        public async Task<IHttpActionResult> AddSubMenu([FromBody] AddSubMenuDto dto)
        {
            if (dto == null)
                return BadRequest("Dữ liệu gửi lên không hợp lệ.");

            if (string.IsNullOrWhiteSpace(dto.SubMenuName))
                return BadRequest("Tên menu con không được để trống.");

            // Kiểm tra menu cha có tồn tại không
            var menu = await db.Menus.FindAsync(dto.MenuId);
            if (menu == null)
                return BadRequest("Menu cha không tồn tại.");

            // Lấy Unix timestamp hiện tại
            var unixTimestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds();

            // Lấy ThuTuShow lớn nhất từ Sub_Menu
            int maxThuTuShow = await db.Sub_Menu.MaxAsync(s => (int?)s.ThuTuShow) ?? 0;

            // Tạo đối tượng submenu
            var subMenu = new Sub_Menu
            {
                name_sub = dto.SubMenuName,
                Link = string.IsNullOrWhiteSpace(dto.SubMenuLink) ? null : dto.SubMenuLink,
                IconName = string.IsNullOrWhiteSpace(dto.IconName) ? null : dto.IconName,
                time_create = (int)unixTimestamp,
                time_update = (int)unixTimestamp,
                ThuTuShow = maxThuTuShow + 1
            };

            try
            {
                // Thêm SubMenu
                db.Sub_Menu.Add(subMenu);
                await db.SaveChangesAsync(); // Sau lệnh này id_sub sẽ có giá trị

                // Tạo liên kết trong Menu_by_sub
                var menuBySub = new Menu_by_sub
                {
                    id_menu = dto.MenuId,
                    id_sub = subMenu.id_sub
                };

                db.Menu_by_sub.Add(menuBySub);
                await db.SaveChangesAsync();

                return Ok(new { success = true, message = "Thêm menu con thành công." });
            }
            catch (DbUpdateException ex)
            {
                var inner = ex.InnerException?.InnerException?.Message ?? ex.Message;
                return InternalServerError(new Exception("Lỗi khi cập nhật cơ sở dữ liệu: " + inner));
            }
            catch (Exception ex)
            {
                return InternalServerError(new Exception("Lỗi không xác định: " + ex.Message));
            }
        }


        public class EditMenuDto
        {
            public int ID { get; set; }
            public string Ten { get; set; }
            public string Link { get; set; }
            public int? ThuTuShow { get; set; }
            public string IconName { get; set; }
        }

        [HttpPost]
        [Route("edit-menu")]
        public async Task<IHttpActionResult> EditMenu([FromBody] EditMenuDto dto)
        {
            if (dto == null)
                return BadRequest("Dữ liệu gửi lên không hợp lệ.");

            if (string.IsNullOrWhiteSpace(dto.Ten))
                return BadRequest("Tên menu không được để trống.");

            var menu = await db.Menus.FindAsync(dto.ID);
            if (menu == null)
                return BadRequest("Không tìm thấy menu.");

            // Nếu thay đổi thứ tự show và có menu khác đang dùng thứ tự này
            if (menu.ThuTuShow != dto.ThuTuShow)
            {
                var conflictedMenu = await db.Menus
                    .FirstOrDefaultAsync(m => m.ThuTuShow == dto.ThuTuShow && m.ID != dto.ID);

                if (conflictedMenu != null)
                {
                    // Hoán đổi ThuTuShow giữa hai menu
                    conflictedMenu.ThuTuShow = menu.ThuTuShow;
                }
            }

            menu.Ten = dto.Ten;
            menu.Link = dto.Link;
            menu.ThuTuShow = dto.ThuTuShow;
            menu.IconName = dto.IconName;
            menu.NgayCapNhat = (int)(DateTime.UtcNow.Subtract(new DateTime(1970, 1, 1))).TotalSeconds;

            try
            {
                await db.SaveChangesAsync();
                return Ok(new { success = true, message = "Cập nhật menu thành công." });
            }
            catch (Exception ex)
            {
                return InternalServerError(new Exception("Lỗi khi cập nhật menu: " + ex.Message));
            }
        }


        [HttpPost]
        [Route("edit-sub-menu")]
        public async Task<IHttpActionResult> EditSubMenu([FromBody] EditMenuDto dto)
        {
            if (dto == null)
                return BadRequest("Dữ liệu gửi lên không hợp lệ.");

            if (string.IsNullOrWhiteSpace(dto.Ten))
                return BadRequest("Tên menu không được để trống.");

            var subMenu = await db.Sub_Menu.FindAsync(dto.ID);
            if (subMenu == null)
                return BadRequest("Không tìm thấy menu con.");

            // Nếu thay đổi thứ tự show và có menu con khác đang dùng thứ tự này
            if (subMenu.ThuTuShow != dto.ThuTuShow)
            {
                var conflictedSubMenu = await db.Sub_Menu
                    .FirstOrDefaultAsync(s => s.ThuTuShow == dto.ThuTuShow && s.id_sub != dto.ID);

                if (conflictedSubMenu != null)
                {
                    // Hoán đổi thứ tự show
                    conflictedSubMenu.ThuTuShow = subMenu.ThuTuShow;
                }
            }

            subMenu.name_sub = dto.Ten;
            subMenu.Link = dto.Link;
            subMenu.ThuTuShow = dto.ThuTuShow;
            subMenu.IconName = dto.IconName;
            subMenu.time_update = (int)(DateTime.UtcNow.Subtract(new DateTime(1970, 1, 1))).TotalSeconds;

            try
            {
                await db.SaveChangesAsync();
                return Ok(new { success = true, message = "Cập nhật menu con thành công." });
            }
            catch (Exception ex)
            {
                return InternalServerError(new Exception("Lỗi khi cập nhật menu con: " + ex.Message));
            }
        }


        // 4. Xóa menu
        [HttpPost]
        [Route("delete-menu")]
        public async Task<IHttpActionResult> DeleteMenu([FromBody] int id)
        {
            var menu = await db.Menus.FindAsync(id);
            if (menu == null)
                return Ok(new { success = false, message = "Không tìm thấy menu." });

            // Xóa các liên kết Menu_by_sub và submenu liên quan
            var menuSubs = db.Menu_by_sub.Where(x => x.id_menu == id).ToList();
            foreach (var ms in menuSubs)
            {
                var sub = await db.Sub_Menu.FindAsync(ms.id_sub);
                if (sub != null)
                    db.Sub_Menu.Remove(sub);
                db.Menu_by_sub.Remove(ms);
            }
            db.Menus.Remove(menu);
            await db.SaveChangesAsync();
            return Ok(new { success = true });
        }

        // 5. Xóa submenu
        [HttpPost]
        [Route("delete-submenu")]
        public async Task<IHttpActionResult> DeleteSubMenu([FromBody] int id)
        {
            var subMenu = await db.Sub_Menu.FindAsync(id);
            if (subMenu == null)
                return Ok(new { success = false, message = "Không tìm thấy menu con." });

            // Xóa liên kết Menu_by_sub
            var menuSubs = db.Menu_by_sub.Where(x => x.id_sub == id).ToList();
            foreach (var ms in menuSubs)
            {
                db.Menu_by_sub.Remove(ms);
            }
            db.Sub_Menu.Remove(subMenu);
            await db.SaveChangesAsync();
            return Ok(new { success = true });
        }


        /* Bắt đầu phần xử lý api quản lý cho group menu */


        // Thêm DTO cho GroupMenu
        public class GroupMenuDto
        {
            public int ID { get; set; }
            public string Ten { get; set; }
            public int? IsImportant { get; set; }
            public int? AsignTo { get; set; }
        }

        // Lấy danh sách group menu
        [HttpGet]
        [Route("groupmenus")]
        public async Task<IHttpActionResult> GetGroupMenus()
        {
            var groups = await db.Menu_Group
                .Select(g => new
                {
                    g.ID,
                    g.Ten,
                    g.NgayTao,
                    g.NgayCapNhat
                }).ToListAsync();

            if (groups == null || groups.Count == 0)
                return NotFound();
            else
                return Ok(groups);
        }

        // Thêm group menu
        [HttpPost]
        [Route("add-groupmenu")]
        public async Task<IHttpActionResult> AddGroupMenu([FromBody] GroupMenuDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Ten))
                return BadRequest("Tên group menu không được để trống.");

            var now = (int)(DateTime.UtcNow.Subtract(new DateTime(1970, 1, 1))).TotalSeconds;
            var group = new Menu_Group
            {
                Ten = dto.Ten,
                NgayTao = now,
                NgayCapNhat = now,
                IsImportant = dto.IsImportant,
                AsignTo = dto.AsignTo
            };
            db.Menu_Group.Add(group);
            await db.SaveChangesAsync();
            return Ok(new { success = true, message = "Thêm group menu thành công." });
        }

        // Sửa group menu
        [HttpPost]
        [Route("edit-groupmenu")]
        public async Task<IHttpActionResult> EditGroupMenu([FromBody] GroupMenuDto dto)
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.Ten))
                return BadRequest("Dữ liệu không hợp lệ.");

            var group = await db.Menu_Group.FindAsync(dto.ID);
            if (group == null)
                return BadRequest("Không tìm thấy group menu.");

            group.Ten = dto.Ten;
            group.IsImportant = dto.IsImportant;
            group.AsignTo = dto.AsignTo;
            group.NgayCapNhat = (int)(DateTime.UtcNow.Subtract(new DateTime(1970, 1, 1))).TotalSeconds;

            // Luôn đồng bộ IsImportant cho tất cả menu thuộc group này
            var menuIds = db.Group_By_Menu_And_Sub
                .Where(x => x.ID_GROUP == group.ID)
                .Select(x => x.ID_MENU)
                .Distinct()
                .ToList();

            var menus = db.Menus.Where(m => menuIds.Contains(m.ID)).ToList();
            foreach (var menu in menus)
            {
                menu.IsImportant = dto.IsImportant;
            }

            await db.SaveChangesAsync();
            return Ok(new { success = true, message = "Cập nhật group menu thành công." });
        }

        // Xóa group menu
        [HttpPost]
        [Route("delete-groupmenu")]
        public async Task<IHttpActionResult> DeleteGroupMenu([FromBody] int id)
        {
            var group = await db.Menu_Group.FindAsync(id);
            if (group == null)
                return Ok(new { success = false, message = "Không tìm thấy group menu." });

            var groupLinks = db.Group_By_Menu_And_Sub.Where(x => x.ID_GROUP == id).ToList();
            foreach (var link in groupLinks)
            {
                db.Group_By_Menu_And_Sub.Remove(link);
            }

            db.Menu_Group.Remove(group);
            await db.SaveChangesAsync();
            return Ok(new { success = true });
        }



        /* Xử lý tương tác giữa groupmenu với các bảng khác*/


        // Thêm DTO cho việc thêm menu vào group menu
        public class AddMenuToGroupDto
        {
            public int MenuId { get; set; }
            public int GroupMenuId { get; set; }

        }

        [HttpPost]
        [Route("add-menu-to-group")]
        public async Task<IHttpActionResult> AddMenuToGroup([FromBody] AddMenuToGroupDto dto)
        {
            if (dto == null)
                return BadRequest("Dữ liệu gửi lên không hợp lệ.");

            // Kiểm tra menu tồn tại
            var menu = await db.Menus.FindAsync(dto.MenuId);
            if (menu == null)
                return BadRequest("Menu không tồn tại.");

            // Kiểm tra group menu tồn tại
            var group = await db.Menu_Group.FindAsync(dto.GroupMenuId);
            if (group == null)
                return BadRequest("Group menu không tồn tại.");

            // Nếu group menu IsImportant = 1 thì cập nhật menu IsImportant = 1
            if (group.IsImportant == 1 && menu.IsImportant != 1)
            {
                menu.IsImportant = 1;
            }

            // Lấy danh sách submenu (nếu có) từ Menu_by_sub
            var subMenuIds = await db.Menu_by_sub
                .Where(ms => ms.id_menu == dto.MenuId)
                .Select(ms => ms.id_sub)
                .ToListAsync();

            if (subMenuIds == null || subMenuIds.Count == 0)
            {
                // Không có submenu → thêm bản ghi với ID_SUB = null (nếu chưa tồn tại)
                var exists = await db.Group_By_Menu_And_Sub.AnyAsync(x =>
                    x.ID_MENU == dto.MenuId &&
                    x.ID_GROUP == dto.GroupMenuId &&
                    x.ID_SUB == null);

                if (!exists)
                {
                    db.Group_By_Menu_And_Sub.Add(new Group_By_Menu_And_Sub
                    {
                        ID_MENU = dto.MenuId,
                        ID_GROUP = dto.GroupMenuId,
                        ID_SUB = null
                    });
                }
            }
            else
            {
                // Có submenu → kiểm tra và thêm từng submenu
                var existingSubLinks = await db.Group_By_Menu_And_Sub
                    .Where(x => x.ID_MENU == dto.MenuId && x.ID_GROUP == dto.GroupMenuId && x.ID_SUB != null)
                    .Select(x => x.ID_SUB.Value)
                    .ToListAsync();

                var newSubLinks = subMenuIds
                    .Where(subId => !existingSubLinks.Contains((int)subId))
                    .Select(subId => new Group_By_Menu_And_Sub
                    {
                        ID_MENU = dto.MenuId,
                        ID_GROUP = dto.GroupMenuId,
                        ID_SUB = subId
                    });

                db.Group_By_Menu_And_Sub.AddRange(newSubLinks);
            }

            await db.SaveChangesAsync();

            return Ok(new { success = true, message = "Thêm menu vào group thành công." });
        }



        public class AddSubMenuToGroupDto
        {
            public int GroupMenuId { get; set; }
            public int MenuId { get; set; }
            public int SubMenuId { get; set; }
        }

        /*
        [HttpPost]
        [Route("add-submenus-to-menu-in-group")]
        public async Task<IHttpActionResult> AddSubmenusToMenuInGroup(AddSubmenuRequest req)
        {
            if (req == null || req.GroupMenuId <= 0 || req.MenuId <= 0 || req.SubMenuIds == null || !req.SubMenuIds.Any())
                return BadRequest("Dữ liệu không hợp lệ.");

            // Kiểm tra tồn tại Group & Menu
            var groupExists = await db.Menu_Group.AnyAsync(g => g.ID == req.GroupMenuId);
            var menuExists = await db.Menus.AnyAsync(m => m.ID == req.MenuId);
            if (!groupExists || !menuExists)
                return BadRequest("Group hoặc Menu không tồn tại.");

            // Duyệt danh sách SubMenu
            foreach (var subId in req.SubMenuIds)
            {
                var exists = await db.Group_By_Menu_And_Sub.AnyAsync(x =>
                    x.ID_GROUP == req.GroupMenuId &&
                    x.ID_MENU == req.MenuId &&
                    x.ID_SUB == subId);

                if (!exists)
                {
                    db.Group_By_Menu_And_Sub.Add(new Group_By_Menu_And_Sub
                    {
                        ID_GROUP = req.GroupMenuId,
                        ID_MENU = req.MenuId,
                        ID_SUB = subId
                    });
                }
            }

            await db.SaveChangesAsync();

            return Ok(new { success = true, message = "Gán submenu thành công." });
        }
        */

        public class AddSubmenuRequest
        {
            public int GroupMenuId { get; set; }
            public int MenuId { get; set; }
            public List<int> SubMenuIds { get; set; }
        }


        [HttpPost]
        [Route("delete-menu-from-group")]
        public async Task<IHttpActionResult> DeleteMenuFromGroup([FromBody] AddMenuToGroupDto dto)
        {
            if (dto == null)
                return BadRequest("Dữ liệu gửi lên không hợp lệ.");

            // Lấy tất cả các liên kết có MenuId và GroupMenuId
            var groupMenuLinks = await db.Group_By_Menu_And_Sub
                .Where(x => x.ID_MENU == dto.MenuId && x.ID_GROUP == dto.GroupMenuId)
                .ToListAsync();

            if (groupMenuLinks == null || groupMenuLinks.Count == 0)
                return Ok(new { success = false, message = "Không tìm thấy menu trong group này." });

            try
            {
                // Kiểm tra group menu có IsImportant = 1 không
                var group = await db.Menu_Group.FindAsync(dto.GroupMenuId);
                if (group != null && group.IsImportant == 1)
                {
                    // Tắt IsImportant của menu
                    var menu = await db.Menus.FindAsync(dto.MenuId);
                    if (menu != null)
                    {
                        menu.IsImportant = 0;
                    }
                }

                // Xóa toàn bộ các liên kết
                db.Group_By_Menu_And_Sub.RemoveRange(groupMenuLinks);
                await db.SaveChangesAsync();

                return Ok(new { success = true, message = "Đã xóa toàn bộ menu khỏi group thành công." });
            }
            catch (Exception ex)
            {
                return InternalServerError(new Exception("Lỗi khi xóa menu khỏi group: " + ex.Message));
            }
        }


        [HttpPost]
        [Route("delete-submenu-from-group")]
        public async Task<IHttpActionResult> DeleteSubMenuFromGroup([FromBody] AddSubMenuToGroupDto dto)
        {
            if (dto == null)
                return BadRequest("Dữ liệu không hợp lệ.");

            var entry = await db.Group_By_Menu_And_Sub.FirstOrDefaultAsync(x =>
                x.ID_GROUP == dto.GroupMenuId &&
                x.ID_MENU == dto.MenuId &&
                x.ID_SUB == dto.SubMenuId
            );

            if (entry == null)
                return Ok(new { success = false, message = "Không tìm thấy submenu trong group." });

            db.Group_By_Menu_And_Sub.Remove(entry);
            await db.SaveChangesAsync();
            return Ok(new { success = true, message = "Xóa submenu khỏi group thành công." });
        }


        // API: Lấy danh sách group menu kèm menu và submenu
        [HttpGet]
        [Route("groupmenus-with-menus")]
        public async Task<IHttpActionResult> GetGroupMenusWithMenus()
        {

            var groups = await db.Menu_Group
                        .Select(g => new
                        {
                            g.ID,
                            g.Ten,
                            g.IsImportant,
                            g.AsignTo,
                            g.NgayTao,
                            g.NgayCapNhat,

                            Menus = g.Group_By_Menu_And_Sub
                                .OrderBy(gbm => gbm.Menu.ThuTuShow)
                                .Select(gbm => new
                                {
                                    MenuId = gbm.Menu.ID,
                                    MenuName = gbm.Menu.Ten,
                                    MenuLink = gbm.Menu.Link,
                                    MenuThuTuShow = gbm.Menu.ThuTuShow,

                                    SubMenus = gbm.Menu.Menu_by_sub
                                        .Where(x => x.id_sub != null)
                                        .OrderBy(x => x.Sub_Menu.ThuTuShow)
                                        .Select(x => new
                                        {
                                            SubMenuId = x.Sub_Menu.id_sub,
                                            SubMenuName = x.Sub_Menu.name_sub,
                                            SubMenuLink = x.Sub_Menu.Link,
                                            SubMenuThuTuShow = x.Sub_Menu.ThuTuShow
                                        })
                                })
                        }).ToListAsync();
            if (groups == null || groups.Count == 0)
                return NotFound();
            else
                return Ok(groups);
        }

        // API: Lấy menu và submenu theo group menu ID để hiển thị 
        [HttpGet]
        [Route("groupmenu-menus/{groupId:int}")]
        public async Task<IHttpActionResult> GetMenusByGroupMenu(int groupId)
        {
            var group = await db.Menu_Group
                .Where(g => g.ID == groupId)
                .Select(g => new
                {
                    g.ID,
                    g.Ten,
                    g.NgayTao,
                    g.NgayCapNhat,
                    Menus = g.Group_By_Menu_And_Sub
                        .Select(gbm => new
                        {
                            MenuId = gbm.Menu.ID,
                            MenuName = gbm.Menu.Ten,
                            MenuLink = gbm.Menu.Link,
                            ThuTuShow = gbm.Menu.ThuTuShow,
                            IconName = gbm.Menu.IconName,
                            SubMenus = gbm.Menu.Menu_by_sub
                                .Where(mbs => mbs.id_sub != null)
                                .Select(mbs => new
                                {
                                    SubMenuId = mbs.Sub_Menu.id_sub,
                                    SubMenuName = mbs.Sub_Menu.name_sub,
                                    SubMenuLink = mbs.Sub_Menu.Link,
                                    IconName = mbs.Sub_Menu.IconName,
                                    ThuTuShow = mbs.Sub_Menu.ThuTuShow
                                })
                                .OrderBy(sm => sm.ThuTuShow)
                                .ToList()
                        })
                        .OrderBy(m => m.ThuTuShow)
                        .ToList()
                })
                .FirstOrDefaultAsync();

            if (group == null)
                return NotFound();
            else
                return Ok(group);
        }

        // API: Lấy menu theo group menu ID để cho phần thêm submenu
        [HttpGet]
        [Route("get-groupmenu-menus/{groupId:int}")]
        public async Task<IHttpActionResult> GetMenusByGroup(int groupId)
        {
            var group = await db.Menu_Group
                .Where(g => g.ID == groupId)
                .Select(g => new
                {
                    g.ID,
                    g.Ten,
                    g.NgayTao,
                    g.NgayCapNhat,
                    Menus = g.Group_By_Menu_And_Sub
                        .Select(gbm => new
                        {
                            MenuId = gbm.Menu.ID,
                            MenuName = gbm.Menu.Ten,
                            MenuLink = gbm.Menu.Link,
                            ThuTuShow = gbm.Menu.ThuTuShow
                        })
                        .OrderBy(m => m.ThuTuShow)
                        .ToList()
                })
                .FirstOrDefaultAsync();

            if (group == null)
                return NotFound();
            else
                return Ok(group);
        }

        //lấy danh sách menu theo user
        [HttpGet]
        [Route("get-user-menus")]
        public IHttpActionResult GetUserMenus()
        {
            try
            {
                var user = SessionHelper.GetUser(); // Lấy user từ session
                if (user == null)
                    return Unauthorized();

                int userId = user.ID;

                // Lấy các function user có quyền
                var functionIds = db.PhanQuyenUsers
                    .Where(p => p.ID_TaiKhoan == userId)
                    .Select(p => p.ID_Function)
                    .Distinct()
                    .ToList();

                if (!functionIds.Any())
                    return Ok(new List<object>());

                // Lấy các menu tương ứng function
                var menuIds = db.Function_By_Menu
                    .Where(fm => functionIds.Contains(fm.ID_FUNCTION))
                    .Select(fm => fm.ID_MENU)
                    .Distinct()
                    .ToList();

                // Lấy Menu và SubMenu liên kết
                var menus = db.Menus
                    .Where(m => menuIds.Contains(m.ID))
                    .Select(m => new
                    {
                        ID = m.ID,
                        Ten = m.Ten,
                        Link = m.Link,
                        ThuTuShow = m.ThuTuShow,
                        IconName = m.IconName,
                        IsImportant = m.IsImportant,
                        NgayCapNhat = m.NgayCapNhat,
                        SubMenus = db.Menu_by_sub
                            .Where(ms => ms.id_menu == m.ID)
                            .Select(ms => ms.Sub_Menu)
                            .Select(sm => new
                            {
                                ID = sm.id_sub,
                                Ten = sm.name_sub,
                                Link = sm.Link,
                                ThuTuShow = sm.ThuTuShow,
                                IconName = sm.IconName,
                                NgayTao = sm.time_create,
                                NgayCapNhat = sm.time_update
                            })
                            .OrderBy(sm => sm.ThuTuShow)
                            .ToList()
                    })
                    .OrderBy(m => m.ThuTuShow)
                    .ToList();

                return Ok(menus);
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        [HttpGet]
        [Route("get-menus-user")]
        public async Task<IHttpActionResult> Getmenus_U()
        {
            var menus = await db.Menus.
                OrderBy(x => x.ThuTuShow)
                        .Select(x => new
                        {
                            MenuId = x.ID,
                            MenuName = x.Ten,
                            MenuLink = x.Link,
                            IconName = x.IconName,
                            IsImportant = x.IsImportant,
                            MenuOrder = x.ThuTuShow
                        }).Where(x => x.IsImportant != 2)
                        .ToListAsync();

            if (menus == null || menus.Count == 0)
                return NotFound();
            else
                return Ok(menus);
        }

        [HttpGet]
        [Route("get-menus-QL")]
        public async Task<IHttpActionResult> Getmenus_A()
        {
            var menus = await db.Menus.
                OrderBy(x => x.ThuTuShow)
                        .Select(x => new
                        {
                            MenuId = x.ID,
                            MenuName = x.Ten,
                            MenuLink = x.Link,
                            IconName = x.IconName,
                            IsImportant = x.IsImportant,
                            MenuOrder = x.ThuTuShow
                        }).Where(x => x.IsImportant == 2)
                        .ToListAsync();

            if (menus == null || menus.Count == 0)
                return NotFound();
            else
                return Ok(menus);
        }

    }
}