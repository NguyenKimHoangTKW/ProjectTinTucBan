using System;
using ProjectTinTucBan.Models;
using System.Collections.Generic;
using System.Linq;
using System.Web.Mvc;
using System.Data.Entity;
using System.Net.Http;
using System.Threading.Tasks;
using Newtonsoft.Json;


namespace ProjectTinTucBan.Areas.Admin.Controllers
{

    public class InterfaceAdminController : Controller
    {
               
        // Gọi hàm thiết kế giao diện tại đây
        public ActionResult Index()
        {
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
        public ActionResult Login()
        {
            return View();
        }
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

    }
}  