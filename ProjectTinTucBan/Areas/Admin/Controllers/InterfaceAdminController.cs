using System;
using System.Linq;
using System.Web.Mvc;
using System.Security.Claims;
using System.Threading.Tasks;
using System.Web;
using Microsoft.AspNet.Identity;
using Microsoft.AspNet.Identity.Owin;
using Microsoft.Owin.Security;
using ProjectTinTucBan.Models;
using Microsoft.Owin.Security.Cookies;
// Quan trọng: Using models

namespace ProjectTinTucBan.Areas.Admin.Controllers
{
    public class InterfaceAdminController : Controller
    {
        // Sử dụng đúng tên DbContext của bạn
        private WebTinTucTDMUEntities db = new WebTinTucTDMUEntities();

        // Trang chính
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
                if (userFromDb.IsBanned == true)
                {
                    ViewBag.Error = "Tài khoản này đã bị khóa.";
                    return View();
                }

                Session["AdminUser"] = userFromDb.TenTaiKhoan;
                Session["UserID"] = userFromDb.ID;
                // Giả sử model Role có thuộc tính TenRole và TaiKhoan có navigation property Role
                // Cần đảm bảo Role được load, ví dụ: .Include(u => u.Role) trong truy vấn userFromDb
                Session["UserRole"] = userFromDb.Role?.TenRole;
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

            // QUAN TRỌNG: NÊN MÃ HÓA MẬT KHẨU TRƯỚC KHI LƯU.
            // string hashedPassword = System.Web.Helpers.Crypto.HashPassword(password);

            TaiKhoan newUser = new TaiKhoan
            {
                TenTaiKhoan = username,
                MatKhau = password, // THAY BẰNG hashedPassword
                Gmail = email,
                IsBanned = false,
                // Cân nhắc gán giá trị mặc định nếu cột trong CSDL không cho phép null
                // hoặc nếu logic ứng dụng yêu cầu
                // NgayTao = (int)(DateTime.UtcNow.Subtract(new DateTime(1970, 1, 1))).TotalSeconds,
                // ID_role = 1, // ID của role mặc định cho người dùng mới (ví dụ: tìm ID của role "User")
            };

            db.TaiKhoans.Add(newUser);
            try
            {
                db.SaveChanges();
                ViewBag.SuccessMessage = "Đăng ký tài khoản thành công! Bạn có thể đăng nhập ngay bây giờ.";
                // return RedirectToAction("Login"); // Chuyển hướng đến trang đăng nhập
                return View("Login"); // Hoặc hiển thị lại view Login với thông báo
            }
            catch (System.Data.Entity.Validation.DbEntityValidationException ex)
            {
                var errorMessages = ex.EntityValidationErrors
                    .SelectMany(x => x.ValidationErrors)
                    .Select(x => $"{x.PropertyName}: {x.ErrorMessage}");
                ViewBag.Error = "Lỗi validation: " + string.Join("; ", errorMessages);
                return View(newUser); // Trả lại model để người dùng không phải nhập lại
            }
            catch (Exception ex)
            {
                ViewBag.Error = "Đã xảy ra lỗi trong quá trình đăng ký: " + ex.Message;
                // Nên ghi log lỗi chi tiết ở đây
                return View(newUser);
            }
        }

        public ActionResult Logout()
        {
            Session.Clear(); // Xóa tất cả session variables
            AuthenticationManager.SignOut(DefaultAuthenticationTypes.ApplicationCookie, DefaultAuthenticationTypes.ExternalCookie);
            return RedirectToAction("Login");
        }

        // POST: /Admin/InterfaceAdmin/ExternalLogin
        [HttpPost]
        [AllowAnonymous]
        [ValidateAntiForgeryToken]
        public ActionResult ExternalLogin(string provider, string returnUrl)
        {
            // Yêu cầu chuyển hướng đến nhà cung cấp đăng nhập bên ngoài
            return new ChallengeResult(provider, Url.Action("ExternalLoginCallback", "InterfaceAdmin", new { ReturnUrl = returnUrl, Area = "Admin" }));
        }

        // GET: /Admin/InterfaceAdmin/ExternalLoginCallback
        [AllowAnonymous]
        public async Task<ActionResult> ExternalLoginCallback(string returnUrl)
        {
            var loginInfo = await AuthenticationManager.GetExternalLoginInfoAsync();
            if (loginInfo == null || loginInfo.ExternalIdentity == null) // Kiểm tra thêm ExternalIdentity
            {
                ViewBag.Error = "Không thể lấy thông tin đăng nhập từ nhà cung cấp ngoài.";
                return View("Login"); // Trả về view Login để hiển thị lỗi
            }

            var emailClaim = loginInfo.ExternalIdentity.FindFirst(ClaimTypes.Email);
            string email = null; // Khai báo email ở đây để có thể truy cập sau khối if

            if (emailClaim != null && !string.IsNullOrEmpty(emailClaim.Value))
            {
                email = emailClaim.Value;
                var userFromDb = db.TaiKhoans.FirstOrDefault(u => u.Gmail == email);

                if (userFromDb != null)
                {
                    if (userFromDb.IsBanned == true)
                    {
                        ViewBag.Error = "Tài khoản Google (" + email + ") của bạn đã bị khóa trong hệ thống.";
                        return View("Login");
                    }
                    // Đăng nhập người dùng
                    Session["AdminUser"] = userFromDb.TenTaiKhoan;
                    Session["UserID"] = userFromDb.ID;
                    Session["UserRole"] = userFromDb.Role?.TenRole; // Đảm bảo Role được load
                    return RedirectToLocal(returnUrl);
                }
                else
                {
                    // Người dùng chưa có tài khoản với email này
                    // Có thể chuyển hướng đến trang đăng ký với email đã điền sẵn
                    // Hoặc hiển thị thông báo yêu cầu đăng ký
                    ViewBag.Error = "Không tìm thấy tài khoản nào được liên kết với email Google: " + email + ". Vui lòng đăng ký.";
                    return View("Login");
                }
            }
            else
            {
                // Không lấy được email từ Google
                ViewBag.Error = "Không thể lấy địa chỉ email từ tài khoản Google của bạn. Vui lòng kiểm tra cài đặt tài khoản Google.";
                return View("Login");
            }
        }

        #region Helpers
        private IAuthenticationManager AuthenticationManager
        {
            get
            {
                return HttpContext.GetOwinContext().Authentication;
            }
        }

        private ActionResult RedirectToLocal(string returnUrl)
        {
            if (Url.IsLocalUrl(returnUrl))
            {
                return Redirect(returnUrl);
            }
            // Chuyển hướng về trang Index của controller này nếu returnUrl không hợp lệ
            return RedirectToAction("Index", "InterfaceAdmin", new { Area = "Admin" });
        }

        internal class ChallengeResult : HttpUnauthorizedResult
        {
            public ChallengeResult(string provider, string redirectUri)
                : this(provider, redirectUri, null)
            {
            }

            public ChallengeResult(string provider, string redirectUri, string userId)
            {
                LoginProvider = provider;
                RedirectUri = redirectUri;
                UserId = userId;
            }

            public string LoginProvider { get; set; }
            public string RedirectUri { get; set; }
            public string UserId { get; set; }

            public override void ExecuteResult(ControllerContext context)
            {
                var properties = new AuthenticationProperties { RedirectUri = RedirectUri };
                if (UserId != null)
                {
                    properties.Dictionary[XsrfKey] = UserId;
                }
                context.HttpContext.GetOwinContext().Authentication.Challenge(properties, LoginProvider);
            }
        }
        private const string XsrfKey = "XsrfId";

        protected override void Dispose(bool disposing)
        {
            if (disposing)
            {
                db.Dispose();
            }
            base.Dispose(disposing);
        }
    }
    #endregion
}