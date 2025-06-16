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
            // QUAN TRỌNG: Trong thực tế, bạn NÊN MÃ HÓA MẬT KHẨU trước khi so sánh.
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
                                        .FirstOrDefault(tbr => tbr.id_taikhoan == userFromDb.ID);

                string currentUserRole = "DefaultUser"; // Giá trị mặc định nếu không có vai trò
                if (userRoleMapping != null && userRoleMapping.Role != null)
                {
                    currentUserRole = userRoleMapping.Role.TenRole;
                }
                Session["UserRole"] = currentUserRole;
                return RedirectToAction("Index");
            }

            ViewBag.Error = "Tên đăng nhập hoặc mật khẩu không đúng!";
            return View();
        }

        // Trang đăng ký (GET)
        [HttpGet]
        public ActionResult Register()
        {
            if (Session["AdminUser"] != null)
            {
                return RedirectToAction("Index");
            }
            return View();
        }

        // Xử lý đăng ký (POST)
        [HttpPost]
        [ValidateAntiForgeryToken]
        public ActionResult Register(string username, string password, string confirmPassword, string email, string sdt)
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

            string hashedPassword = System.Web.Helpers.Crypto.HashPassword(password); // Sử dụng Crypto trực tiếp

            TaiKhoan newUser = new TaiKhoan
            {
                TenTaiKhoan = username,
                MatKhau = hashedPassword,
                Gmail = email,
                SDT = sdt,
                IsBanned = false,
                NgayTao = (int)(DateTime.UtcNow.Subtract(new DateTime(1970, 1, 1))).TotalSeconds,
                NgayCapNhat = (int)(DateTime.UtcNow.Subtract(new DateTime(1970, 1, 1))).TotalSeconds
            };

            db.TaiKhoans.Add(newUser);
            try
            {
                db.SaveChanges();

                var defaultRole = db.Roles.FirstOrDefault(r => r.TenRole == "User");
                if (defaultRole != null)
                {
                    TaiKhoan_by_role newUserRole = new TaiKhoan_by_role
                    {
                        id_taikhoan = newUser.ID,
                        id_roles = defaultRole.ID
                    };
                    db.TaiKhoan_by_roles.Add(newUserRole);
                    db.SaveChanges();
                }

                ViewBag.SuccessMessage = "Đăng ký tài khoản thành công! Bạn có thể đăng nhập ngay bây giờ.";
                return View("Login");
            }
            catch (System.Data.Entity.Validation.DbEntityValidationException ex)
            {
                var errorMessages = ex.EntityValidationErrors
                    .SelectMany(x => x.ValidationErrors)
                    .Select(x => $"{x.PropertyName}: {x.ErrorMessage}");
                ViewBag.Error = "Lỗi validation khi đăng ký: " + string.Join("; ", errorMessages);
                return View(newUser);
            }
            catch (Exception ex)
            {
                ViewBag.Error = "Đã xảy ra lỗi trong quá trình đăng ký: " + ex.Message;
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
                var userFromDb = db.TaiKhoans.FirstOrDefault(u => u.Gmail == email);

                if (userFromDb != null)
                {
                    // Tài khoản đã tồn tại trong CSDL
                    if (userFromDb.IsBanned == true)
                    {
                        ViewBag.Error = "Tài khoản Google (" + email + ") của bạn đã bị khóa trong hệ thống.";
                        return View("Login");
                    }

                    // Tiến hành đăng nhập người dùng
                    Session["AdminUser"] = userFromDb.TenTaiKhoan;
                    Session["UserID"] = userFromDb.ID;

                    var userRoleMapping = db.TaiKhoan_by_roles
                                            .Include(tbr => tbr.Role)
                                            .FirstOrDefault(tbr => tbr.id_taikhoan == userFromDb.ID);

                    string currentUserRole = "DefaultUser"; // Giá trị mặc định nếu không tìm thấy vai trò
                    if (userRoleMapping != null && userRoleMapping.Role != null)
                    {
                        currentUserRole = userRoleMapping.Role.TenRole;
                    }
                    else
                    {
                        // Ghi log hoặc xử lý trường hợp người dùng không có vai trò được gán
                        // Ví dụ: có thể không cho đăng nhập nếu vai trò là bắt buộc
                        // ViewBag.Error = "Tài khoản của bạn chưa được gán vai trò. Vui lòng liên hệ quản trị viên.";
                        // return View("Login");
                    }
                    Session["UserRole"] = currentUserRole;

                    System.Diagnostics.Debug.WriteLine($"Existing Google User Login: User: {Session["AdminUser"]}, Role: {Session["UserRole"]}, UserID: {Session["UserID"]}");
                    return RedirectToLocal(returnUrl);
                }
                else
                {
                    // Tài khoản Google chưa có trong CSDL
                    // Theo yêu cầu "back lại chức năng cũ", sẽ không tự động đăng ký
                    ViewBag.Error = "Tài khoản Google này chưa được đăng ký trong hệ thống. Vui lòng đăng ký tài khoản trước.";
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