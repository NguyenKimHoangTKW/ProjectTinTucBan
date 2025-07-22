using ProjectTinTucBan.Models;

using System.Linq;
using System.Web.Mvc;

using Newtonsoft.Json.Linq;


using ProjectTinTucBan.Helper;



namespace ProjectTinTucBan.Areas.Admin.Controllers
{
    public class InterfaceAdminController : Controller
    {
        WebTinTucTDMUEntities db = new WebTinTucTDMUEntities();
        // Gọi hàm thiết kế giao diện tại đây
        [UserAuthorizeAttribute()]
        public ActionResult Index()
        {

            return View();
        }
        [UserAuthorizeAttribute()]
        public ActionResult EditTaiKhoan()
        {
            return RedirectToAction("EditTaiKhoan", "EditTaiKhoan");
        }
   
        [UserAuthorizeAttribute()]
        public ActionResult Index_Footer()
        {
            return View();
        }

        // Gọi hàm thiết kế giao diện Quản lý mục lục
        [UserAuthorizeAttribute()]
        public ActionResult Index_MucLuc_Admin()
        {
            return View();
        }

        // Gọi hàm thiết kế giao diện quản lý quyền Admin
        [UserAuthorizeAttribute(1)]
        public ActionResult Index_Roles_Admin()
        {
            return View();
        }

        [UserAuthorizeAttribute()]
        public ActionResult Menu()
        {
            return View();
        }

        [UserAuthorizeAttribute()]
        public ActionResult Slider()
        {
            return View();
        }

        [UserAuthorizeAttribute()]
        public ActionResult BaiViet()
        {
            return View();
        }

        [UserAuthorizeAttribute(1)]
        // Gọi hàm thiết kế giao diện quản lý người dùng Admin
        public ActionResult Index_Users_Admin()
        {
            return View();
        }

        // Gọi hàm thiết kế giao diện quản lý chức năng admin
        [UserAuthorizeAttribute(1)]
        public ActionResult Index_Function_Admin()
        {
            return View();
        }


        [UserAuthorizeAttribute()]
        public ActionResult XemNoiDung(int id)
        {
            using (var db = new WebTinTucTDMUEntities())
            {
                var baiViet = db.BaiViets.Find(id);
                if (baiViet == null)
                {
                    return HttpNotFound();
                }

                // Load người đăng
                if (baiViet.ID_NguoiDang.HasValue)
                {
                    db.Entry(baiViet).Reference(x => x.TaiKhoan).Load();
                    ViewBag.TenTaiKhoan = baiViet.TaiKhoan?.TenTaiKhoan ?? "Không rõ";
                }
                else
                {
                    ViewBag.TenTaiKhoan = "Không rõ";
                }

                return View("XemNoiDung", baiViet);
            }
        }
        [UserAuthorizeAttribute()]
        public ActionResult Index_DonViTrucThuoc()
        {
            return View();
        }
        [UserAuthorizeAttribute()]
        public ActionResult Index_Khoi()
        {
            return View("Index_Khoi");
        }
    }
}