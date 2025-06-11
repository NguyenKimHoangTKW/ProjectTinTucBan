using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using ProjectTinTucBan.Models;
using System.Data.Entity;
using System.Net.Http;
using System.Threading.Tasks;
using Newtonsoft.Json;

namespace ProjectTinTucBan.Areas.Admin.Controllers
{
    public class InterfaceAdminController : Controller
    {
        private WebTinTucTDMUEntities db = new WebTinTucTDMUEntities();

        // Gọi hàm thiết kế giao diện tại đây
        public ActionResult Index()
        {
            return View();
        }
        public ActionResult Menu()
        {
            // Get all menus
            var menus = db.Menus.ToList();

            // Build the menu DTOs with submenus
            var menuDtos = menus.Select(m => new
            {
                MenuId = m.ID,
                MenuName = m.Ten,
                MenuLink = m.Link,
                SubMenus = db.Menu_by_sub
                    .Where(mbs => mbs.id_menu == m.ID && mbs.Sub_Menu != null)
                    .Select(mbs => new
                    {
                        SubMenuId = mbs.Sub_Menu.id_sub,
                        SubMenuName = mbs.Sub_Menu.name_sub
                    }).ToList()
            }).ToList();

            ViewBag.MenusJson = JsonConvert.SerializeObject(menuDtos);
            return View();
        }
        [HttpPost]
        public ActionResult DeleteMenu(int id)
        {
            try
            {
                // Xóa menu và các submenu liên quan (nếu có)
                var menu = db.Menus.Find(id);
                if (menu == null)
                    return Json(new { success = false, message = "Menu không tồn tại" });

                // Xóa các submenu liên quan nếu cần
                var subMenus = db.Menu_by_sub.Where(m => m.id_menu == id).ToList();
                db.Menu_by_sub.RemoveRange(subMenus);

                db.Menus.Remove(menu);
                db.SaveChanges();
                return Json(new { success = true });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }
    }
}