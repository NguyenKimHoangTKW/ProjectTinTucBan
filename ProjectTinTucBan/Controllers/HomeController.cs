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
