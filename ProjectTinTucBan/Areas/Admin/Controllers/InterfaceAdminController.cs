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
        
        // Gọi hàm thiết kế giao diện tại đây

        private WebTinTucTDMUEntities db = new WebTinTucTDMUEntities();

        // Trang chính

        public ActionResult Index()
        {
            /*
            if (Session["AdminUser"] == null)
            {
                return RedirectToAction("Login");
            }
            ViewBag.Username = Session["AdminUser"]?.ToString();
            ViewBag.Message = "Chào mừng đến trang quản trị!";
            return View();*/
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

        // Xử lý đăng nhập (POST)
        [HttpPost]
        [ValidateAntiForgeryToken]
        public ActionResult Login(string username, string password)
        {
            if (string.IsNullOrEmpty(username) || string.IsNullOrEmpty(password))
            {
                ViewBag.Error = "Tên đăng nhập và mật khẩu không được để trống.";
                return View();
            }

            // 1. Kiểm tra tài khoản admin cứng (nếu vẫn muốn giữ)
            if (username == "admin" && password == "123456")
            {
                Session["AdminUser"] = "admin_hardcoded";
                Session["UserRole"] = "SuperAdmin"; // Ví dụ gán role cho admin cứng
                return RedirectToAction("Index");
            }

            // 2. Kiểm tra trong CSDL
            // QUAN TRỌNG: Trong thực tế, bạn NÊN MÃ HÓA MẬT KHẨU trước khi so sánh.
            var userFromDb = db.TaiKhoans.FirstOrDefault(u => u.TenTaiKhoan == username && u.MatKhau == password);

            if (userFromDb != null)
            {
                if (userFromDb.IsBanned == 1)
                {
                    ViewBag.Error = "Tài khoản này đã bị khóa.";
                    return View();
                }

                Session["AdminUser"] = userFromDb.TenTaiKhoan;
                Session["UserID"] = userFromDb.ID;
                // Giả sử model Role có thuộc tính TenRole và TaiKhoan có navigation property Role
                // Session["UserRole"] = userFromDb.Role?.TenRole; 
                return RedirectToAction("Index");
            }

            ViewBag.Error = "Tên đăng nhập hoặc mật khẩu không đúng!";
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

        // Xử lý đăng ký (POST)
        [HttpPost]
        [ValidateAntiForgeryToken]
        public ActionResult Register(string username, string password, string confirmPassword, string email)
        {
            if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(password))
            {
                ViewBag.Error = "Tên đăng nhập và mật khẩu không được để trống.";
                return View();
            }

            if (password != confirmPassword)
            {
                ViewBag.Error = "Mật khẩu xác nhận không khớp.";
                return View();
            }

            if (db.TaiKhoans.Any(u => u.TenTaiKhoan == username))
            {
                ViewBag.Error = "Tên đăng nhập đã tồn tại.";
                return View();
            }

            if (!string.IsNullOrEmpty(email) && db.TaiKhoans.Any(u => u.Gmail == email))
            {
                ViewBag.Error = "Địa chỉ email này đã được sử dụng.";
                return View();
            }

            TaiKhoan newUser = new TaiKhoan
            {
                TenTaiKhoan = username,
                MatKhau = password, // QUAN TRỌNG: NÊN MÃ HÓA MẬT KHẨU.
                Gmail = email,
                IsBanned = 0,
                // NgayTao và ID_role sẽ được gán giá trị null (nếu CSDL cho phép)
                // hoặc bạn cần logic cụ thể để gán giá trị cho chúng nếu chúng là bắt buộc
                // hoặc có giá trị mặc định khác.
                // Ví dụ: NgayTao = (int)(DateTime.UtcNow.Subtract(new DateTime(1970, 1, 1))).TotalSeconds, // Unix timestamp
                // ID_role = 1, // ID của role mặc định cho người dùng mới
            };

            db.TaiKhoans.Add(newUser);
            try
            {
                db.SaveChanges();
                ViewBag.SuccessMessage = "Đăng ký tài khoản thành công! Bạn có thể đăng nhập ngay bây giờ.";
                return View();
            }
            catch (System.Data.Entity.Validation.DbEntityValidationException ex)
            {
                var errorMessages = ex.EntityValidationErrors
                    .SelectMany(x => x.ValidationErrors)
                    .Select(x => $"{x.PropertyName}: {x.ErrorMessage}");
                ViewBag.Error = "Lỗi validation: " + string.Join("; ", errorMessages);
                return View();
            }
            catch (Exception ex)
            {
                ViewBag.Error = "Đã xảy ra lỗi trong quá trình đăng ký: " + ex.Message;
                return View();
            }
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
    }
}  