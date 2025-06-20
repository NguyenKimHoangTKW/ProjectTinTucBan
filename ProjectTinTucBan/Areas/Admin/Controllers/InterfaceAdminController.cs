using System;
using System.Linq;
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
            if (Session["AdminUser"] == null)
            {
                return RedirectToAction("Login");
            }
            ViewBag.Username = Session["AdminUser"]?.ToString();
            ViewBag.Message = "Chào mừng đến trang quản trị!";
            return View();
        }

        // Gọi hàm thiết kế giao diện Quản lý mục lục
        public ActionResult Index_MucLuc_Admin()
        {
            return View();
        }
        // Gọi hàm thiết kế giao diện quản lý quyền Admin
        public ActionResult Index_Roles_Admin()
        {
            return View();
        }

        public ActionResult Menu()
        {
            return View();
        }
        public ActionResult Slider()
        {
            return View();
        }
        public ActionResult BaiViet()
        {
            return View();
        }
        public ActionResult ThemBaiViet()
        {
            return View();
        }
        public ActionResult SuaBaiViet()
        {
            return View();
        }
        public ActionResult XoaBaiViet()
        {
            return View();
        }
        // Trang đăng nhập (GET)
        [HttpGet]
        public ActionResult Login()
        {
            // Nếu đã đăng nhập, chuyển hướng về trang Index
            if (Session["AdminUser"] != null)
            {
                return RedirectToAction("Index");
            }
            return View();
        }

        // Trang đăng ký (GET)
        [HttpGet]
        public ActionResult Register()
        {
            // Nếu đã đăng nhập, chuyển hướng về trang Index
            if (Session["AdminUser"] != null)
            {
                return RedirectToAction("Index");
            }
            return View();
        }

        

        public ActionResult Logout()
        {
            Session.Clear(); // Xóa tất cả session variables
            return RedirectToAction("Login");
        }

        protected override void Dispose(bool disposing)
        {
            if (disposing)
            {
                db.Dispose();
            }
            base.Dispose(disposing);
        }
        // Gọi hàm thiết kế giao diện quản lý người dùng Admin
        public ActionResult Index_Users_Admin()
        {
            return View();
        }
        // Gọi hàm thiết kế giao diện quản lý chức năng admin
        public ActionResult Index_Function_Admin()
        {
            return View();
        }
        // Gọi hàm thiết kế giao diện đăng nhập

    }
}  