using ProjectTinTucBan.Helper;
using ProjectTinTucBan.Models;
using System.Data.Entity;
using System.Linq;
using System.Web.Mvc;

namespace ProjectTinTucBan.Controllers
{
    public class HomeController : Controller
    {
        private WebTinTucTDMUEntities db = new WebTinTucTDMUEntities();

        // Trang chủ
        public ActionResult Index()
        {
            return View(); // ~/Views/Home/Index.cshtml
        }
        public ActionResult TinTuc()
        {
            return View();
        }
        [Route("danh-sach-bai-viet")]
        public ActionResult DanhSachBaiViet(int mucId, string slug)
        {
            var muc = db.MucLucs.FirstOrDefault(m => m.ID == mucId);
            if (muc == null)
                return HttpNotFound();

            ViewBag.MucId = mucId;
            ViewBag.Slug = slug;
            ViewBag.TenMucLuc = muc.TenMucLuc; // ✅ Gán tên có dấu cho View hiển thị

            return View();
        }


        // Gọi hàm thiết kế giao diện đăng nhập
        public ActionResult Login()
        {
            if (SessionHelper.IsUserLoggedIn())
            {
                return Redirect("~/Admin/InterfaceAdmin/Index");
            }

            return View();
        }

    }
}
