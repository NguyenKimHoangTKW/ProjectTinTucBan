using ProjectTinTucBan.Models;
using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Data.Entity.Infrastructure;
using System.Linq;
using System.Threading.Tasks;
using System.Web.Http;

namespace ProjectTinTucBan.Areas.Admin.Controllers
{
    [RoutePrefix("api/v1/admin")]
    public class TestController : ApiController
    {
        WebTinTucTDMUEntities db = new WebTinTucTDMUEntities();
        private int unixTimestamp;

        public TestController()
        {
            DateTime now = DateTime.UtcNow;
            unixTimestamp = (int)(now.Subtract(new DateTime(1970, 1, 1))).TotalSeconds;
        }

        [HttpGet]
        [Route("test")]
        public async Task<IHttpActionResult> test()
        {
            var get = db.BaiViets.ToListAsync();
            return Ok();
        }

        [HttpPost]
        [Route("test-tao")]
        public async Task<IHttpActionResult> tao_moi(BaiViet items)
        {
            var new_record = new BaiViet
            {
                NgayCapNhat = unixTimestamp,
                NgayDang = unixTimestamp
            };
            return Ok();
        }

        // 1. Lấy danh sách menu và submenu
        [HttpGet]
        [Route("menus-with-submenus")]
        public async Task<IHttpActionResult> GetMenusWithSubmenus()
        {
            var menus = await db.Menus
                .OrderBy(m => m.ThuTuShow)
                .Select(m => new
                {
                    MenuId = m.ID,
                    MenuName = m.Ten,
                    MenuLink = m.Link,
                    SubMenus = db.Menu_by_sub
                        .Where(x => x.id_menu == m.ID && x.id_sub != null)
                        .Select(x => new
                        {
                            SubMenuId = x.Sub_Menu.id_sub,
                            SubMenuName = x.Sub_Menu.name_sub,
                            SubMenuLink = x.Sub_Menu.Link
                        }).ToList()
                }).ToListAsync();

            return Ok(menus);
        }

        // 2. Thêm menu mới
        [HttpPost]
        [Route("add-menu")]
        public async Task<IHttpActionResult> AddMenu([FromBody] Menu menu)
        {
            if (string.IsNullOrEmpty(menu.Ten))
                return BadRequest("Tên menu không được để trống.");

            menu.NgayDang = unixTimestamp;
            menu.NgayCapNhat = unixTimestamp;
            db.Menus.Add(menu);
            await db.SaveChangesAsync();
            return Ok();
        }
        public class AddSubMenuDto
        {
            public int MenuId { get; set; }
            public string SubMenuName { get; set; }
            public string SubMenuLink { get; set; }
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

            // Tạo đối tượng submenu
            var subMenu = new Sub_Menu
            {
                name_sub = dto.SubMenuName,
                Link = string.IsNullOrWhiteSpace(dto.SubMenuLink) ? null : dto.SubMenuLink,
                time_create = unixTimestamp,
                time_update = unixTimestamp
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

            menu.Ten = dto.Ten;
            menu.Link = dto.Link;
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
    }
}
