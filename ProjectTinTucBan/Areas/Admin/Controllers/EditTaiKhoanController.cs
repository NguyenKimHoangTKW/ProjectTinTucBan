using System.Web.Mvc;
using ProjectTinTucBan.Models;
using ProjectTinTucBan.Helper;

namespace ProjectTinTucBan.Areas.Admin.Controllers
{
    public class EditTaiKhoanController : Controller
    {
        WebTinTucTDMUEntities db = new WebTinTucTDMUEntities();

        [HttpGet]
        public ActionResult EditTaiKhoan()
        {
            // Lấy user hiện tại (ví dụ: từ session)
            var currentUser = SessionHelper.GetUser(System.Web.HttpContext.Current);
            if (currentUser == null)
                return RedirectToAction("Index", "Login", new { area = "" });

            var taiKhoan = db.TaiKhoans.Find(currentUser.ID);
            if (taiKhoan == null)
                return HttpNotFound();

            return View("~/Areas/Admin/Views/InterfaceAdmin/EditTaiKhoan.cshtml", taiKhoan);
        }
    }
}