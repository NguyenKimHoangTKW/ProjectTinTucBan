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
using System.Data.Entity; // Thêm using này cho Include

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
            var userFromDb = db.TaiKhoans
                               .FirstOrDefault(u => u.TenTaiKhoan == username && u.MatKhau == password);

            if (userFromDb != null)
            {
                if (userFromDb.IsBanned == true)
                {
                    ViewBag.Error = "Tài khoản này đã bị khóa.";
                    return View();
                }

                Session["AdminUser"] = userFromDb.TenTaiKhoan;
                Session["UserID"] = userFromDb.ID;

                // Lấy vai trò thông qua bảng TaiKhoan_by_role
                var userRoleMapping = db.TaiKhoan_by_roles
                                        .Include(tbr => tbr.Role) // Tải thông tin Role liên quan
                                        .FirstOrDefault(tbr => tbr.id_taikhoan == userFromDb.ID); // Giả sử mỗi user chỉ có 1 role hoặc lấy role đầu tiên

                Session["UserRole"] = userRoleMapping?.Role?.TenRole;
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
                MatKhau = password, // NÊN MÃ HÓA MẬT KHẨU
                Gmail = email,
                IsBanned = false,
                NgayTao = (int)(DateTime.UtcNow.Subtract(new DateTime(1970, 1, 1))).TotalSeconds // Ví dụ
            };

            db.TaiKhoans.Add(newUser);
            try
            {
                db.SaveChanges(); // Lưu newUser để có newUser.ID

                // (Tùy chọn) Gán vai trò mặc định cho người dùng mới
                // Ví dụ: gán Role có ID là 2 (bạn cần thay ID này cho phù hợp)
                var defaultRoleId = db.Roles.FirstOrDefault(r => r.TenRole == "User")?.ID; // Hoặc ID cố định nếu biết
                if (defaultRoleId != null && defaultRoleId != 0)
                {
                    TaiKhoan_by_role newUserRole = new TaiKhoan_by_role
                    {
                        id_taikhoan = newUser.ID,
                        id_roles = defaultRoleId
                    };
                    db.TaiKhoan_by_roles.Add(newUserRole);
                    db.SaveChanges(); // Lưu thông tin vai trò
                }

                ViewBag.SuccessMessage = "Đăng ký tài khoản thành công! Bạn có thể đăng nhập ngay bây giờ.";
                return View("Login");
            }
            catch (System.Data.Entity.Validation.DbEntityValidationException ex)
            {
                var errorMessages = ex.EntityValidationErrors
                    .SelectMany(x => x.ValidationErrors)
                    .Select(x => $"{x.PropertyName}: {x.ErrorMessage}");
                ViewBag.Error = "Lỗi validation: " + string.Join("; ", errorMessages);
                return View(newUser);
            }
            catch (Exception ex)
            {
                // Ghi log lỗi chi tiết ở đây (ví dụ: using Serilog, NLog)
                ViewBag.Error = "Đã xảy ra lỗi trong quá trình đăng ký. Vui lòng thử lại." + ex.Message;
                return View(newUser);
            }
        }

        public ActionResult Logout()
        {
            Session.Clear();
            AuthenticationManager.SignOut(DefaultAuthenticationTypes.ApplicationCookie, DefaultAuthenticationTypes.ExternalCookie);
            return RedirectToAction("Login");
        }

        [HttpPost]
        [AllowAnonymous]
        [ValidateAntiForgeryToken]
        public ActionResult ExternalLogin(string provider, string returnUrl)
        {
            return new ChallengeResult(provider, Url.Action("ExternalLoginCallback", "InterfaceAdmin", new { ReturnUrl = returnUrl, Area = "Admin" }));
        }

        [AllowAnonymous]
        public async Task<ActionResult> ExternalLoginCallback(string returnUrl)
        {
            var loginInfo = await AuthenticationManager.GetExternalLoginInfoAsync();
            if (loginInfo == null || loginInfo.ExternalIdentity == null)
            {
                ViewBag.Error = "Không thể lấy thông tin đăng nhập từ nhà cung cấp ngoài.";
                return View("Login");
            }

            var emailClaim = loginInfo.ExternalIdentity.FindFirst(ClaimTypes.Email);
            string email = null;

            if (emailClaim != null && !string.IsNullOrEmpty(emailClaim.Value))
            {
                email = emailClaim.Value;
                var userFromDb = db.TaiKhoans
                                   .FirstOrDefault(u => u.Gmail == email);

                if (userFromDb != null)
                {
                    if (userFromDb.IsBanned == true)
                    {
                        ViewBag.Error = "Tài khoản Google (" + email + ") của bạn đã bị khóa trong hệ thống.";
                        return View("Login");
                    }
                    Session["AdminUser"] = userFromDb.TenTaiKhoan;
                    Session["UserID"] = userFromDb.ID;

                    // Lấy vai trò thông qua bảng TaiKhoan_by_role
                    var userRoleMapping = db.TaiKhoan_by_roles
                                            .Include(tbr => tbr.Role)
                                            .FirstOrDefault(tbr => tbr.id_taikhoan == userFromDb.ID);
                    Session["UserRole"] = userRoleMapping?.Role?.TenRole;
                    return RedirectToLocal(returnUrl);
                }
                else
                {
                    ViewBag.Error = "Không tìm thấy tài khoản nào được liên kết với email Google: " + email + ". Vui lòng đăng ký.";
                    return View("Login");
                }
            }
            else
            {
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