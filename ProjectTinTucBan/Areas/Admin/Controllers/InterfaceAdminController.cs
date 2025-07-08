using System;
using ProjectTinTucBan.Models;
using System.Collections.Generic;
using System.Linq;
using System.Web.Mvc;
using System.Data.Entity;
using System.Net.Http;
using System.Threading.Tasks;
using ProjectTinTucBan.Helper;
using Newtonsoft.Json;
using System.Security.Claims;
using System.Threading.Tasks;
using System.Web;
using Microsoft.AspNet.Identity;
using Microsoft.AspNet.Identity.Owin;
using Microsoft.Owin.Security;
using ProjectTinTucBan.Models;
using Microsoft.Owin.Security.Cookies;
using System.Data.Entity;
using System.Collections.Generic; 


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

        // Gọi hàm thiết kế giao diện Quản lý mục lục
        [UserAuthorizeAttribute(1, 4)]
        public ActionResult Index_MucLuc_Admin()
        {
            return View();
        }

        // Gọi hàm thiết kế giao diện quản lý quyền Admin
        [UserAuthorizeAttribute(1, 4)]
        public ActionResult Index_Roles_Admin()
        {
            return View();
        }

        [UserAuthorizeAttribute(1, 4)]
        public ActionResult Menu()
        {
            return View();
        }

        [UserAuthorizeAttribute(1, 4)]
        public ActionResult Slider()
        {
            return View();
        }

        [UserAuthorizeAttribute(1, 4)]
        public ActionResult BaiViet()
        {
            return View();
        }

        [UserAuthorizeAttribute(1, 4)]
        // Gọi hàm thiết kế giao diện quản lý người dùng Admin
        public ActionResult Index_Users_Admin()
        {
            return View();
        }

        // Gọi hàm thiết kế giao diện quản lý chức năng admin
        [UserAuthorizeAttribute(1, 4)]
        public ActionResult Index_Function_Admin()
        {
            return View();
        }

        // Gọi hàm thiết kế giao diện đăng nhập
        public ActionResult Login()
        {
            return View();
        }
        [UserAuthorizeAttribute(1, 4)]
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

        public ActionResult Index_DonViTrucThuoc()
        {
            return View();
        }
        public ActionResult Index_Khoi()
        {
            return View("Index_Khoi");
        }
    }
}