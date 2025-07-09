using System.Web.Mvc;
using ProjectTinTucBan.Models;
using ProjectTinTucBan.Helper;

namespace ProjectTinTucBan.Areas.Admin.Controllers
{
    public class EditTaiKhoanController : Controller
    {
        WebTinTucTDMUEntities db = new WebTinTucTDMUEntities();

        // GET: Admin/EditTaiKhoan/EditTaiKhoan
        public ActionResult EditTaiKhoan()
        {
            var currentUser = SessionHelper.GetUser(System.Web.HttpContext.Current);
            if (currentUser == null)
                return RedirectToAction("Login", "InterfaceAdmin");

            var taiKhoan = db.TaiKhoans.Find(currentUser.ID);
            if (taiKhoan == null)
                return HttpNotFound();

            return View("~/Areas/Admin/Views/InterfaceAdmin/EditTaiKhoan.cshtml", taiKhoan);
        }

        // POST: Admin/EditTaiKhoan/EditTaiKhoan
        [HttpPost]
        [ValidateAntiForgeryToken]
        public ActionResult EditTaiKhoan([Bind(Include = "TenTaiKhoan,MatKhau,Name,Gmail,SDT")] TaiKhoan model)
        {
            var currentUser = SessionHelper.GetUser(System.Web.HttpContext.Current);
            if (currentUser == null)
                return Json(new { success = false, message = "Chưa đăng nhập" });

            var taiKhoan = db.TaiKhoans.Find(currentUser.ID);
            if (taiKhoan == null)
                return Json(new { success = false, message = "Không tìm thấy tài khoản" });

            taiKhoan.Name = model.Name;
            taiKhoan.SDT = model.SDT;
            db.SaveChanges();

            return Json(new { success = true, message = "Đã thay đổi thành công!" });
        }
    }
}