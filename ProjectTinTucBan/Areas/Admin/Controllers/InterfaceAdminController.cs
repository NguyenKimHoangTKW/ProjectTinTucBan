using System;
using ProjectTinTucBan.Models;

using System.Linq;
using System.Web.Mvc;

using Newtonsoft.Json.Linq;


namespace ProjectTinTucBan.Areas.Admin.Controllers
{

    public class InterfaceAdminController : Controller
    {
        WebTinTucTDMUEntities db = new WebTinTucTDMUEntities();

        // Gọi hàm thiết kế giao diện tại đây
        public ActionResult Index()
        {

            return View();
        }
        public ActionResult EditTaiKhoan()
        {
            return RedirectToAction("EditTaiKhoan", "EditTaiKhoan");
        }
        public ActionResult EditFooter()
        {
            // Lấy dữ liệu Footer từ DB
            var footer = db.Footers.FirstOrDefault();
            JObject model = new JObject();
            if (footer != null)
            {
                model["id"] = footer.ID;
                model["fullName"] = footer.FullName;
                model["englishName"] = footer.EnglishName;
                model["established"] = footer.NgayThanhLap;
                model["address"] = footer.DiaChi;
                model["phone"] = footer.DienThoai;
                model["email"] = footer.Email;
                model["videoUrl"] = footer.VideoUrl;
                model["footerCopyright"] = footer.FooterCopyright;
                model["footerNote"] = footer.FooterNote;
            }
            // Nếu không có dữ liệu, vẫn phải trả về model rỗng để tránh null
            return View(model);
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