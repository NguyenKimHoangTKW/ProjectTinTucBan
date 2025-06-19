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
using System.Collections.Generic;

namespace ProjectTinTucBan.Areas.Admin.Controllers
{
    public class APIController : Controller
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
            ViewBag.UserRole = Session["UserRole"]?.ToString();
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
                if (userFromDb.IsBanned == 1)
                {
                    ViewBag.Error = "Tài khoản này đã bị khóa.";
                    return View();
                }

                Session["AdminUser"] = userFromDb.TenTaiKhoan;
                Session["UserID"] = userFromDb.ID;

                Session["UserRole"] = "DefaultUser";
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

            string hashedPassword = System.Web.Helpers.Crypto.HashPassword(password);

            TaiKhoan newUser = new TaiKhoan
            {
                TenTaiKhoan = username,
                MatKhau = hashedPassword,
                Gmail = email,
                SDT = sdt,
                    IsBanned = 0,
                NgayTao = (int)(DateTime.UtcNow.Subtract(new DateTime(1970, 1, 1))).TotalSeconds,
                NgayCapNhat = (int)(DateTime.UtcNow.Subtract(new DateTime(1970, 1, 1))).TotalSeconds
            };

            db.TaiKhoans.Add(newUser);
            try
            {
                db.SaveChanges();

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
            // Đảm bảo action này trỏ đúng controller nếu bạn đã di chuyển ExternalLoginCallback
            return new ChallengeResult(provider, Url.Action("ExternalLoginCallback", "API", new { ReturnUrl = returnUrl, Area = "Admin" }));
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
                    if (userFromDb.IsBanned == 1)
                    {
                        ViewBag.Error = "Tài khoản Google (" + email + ") của bạn đã bị khóa trong hệ thống.";
                        return View("Login");
                    }
                    Session["AdminUser"] = userFromDb.TenTaiKhoan;
                    Session["UserID"] = userFromDb.ID;
                    Session["UserRole"] = "DefaultUser";
                    System.Diagnostics.Debug.WriteLine($"Existing Google User Login: User: {Session["AdminUser"]}, Role: {Session["UserRole"]}, UserID: {Session["UserID"]}");
                    return RedirectToLocal(returnUrl);
                }
                else
                {
                    ViewBag.Error = "Tài khoản không trong nội bộ.";
                    return View("Login");
                }
            }
            else
            {
                ViewBag.Error = "Không thể lấy địa chỉ email từ tài khoản Google của bạn. Vui lòng kiểm tra cài đặt tài khoản Google.";
                return View("Login");
            }
        }

        public ActionResult AccountList()
        {
            var accounts = db.TaiKhoans.ToList();
            return View(accounts);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public ActionResult ToggleBanStatus(int id)
        {
            var account = db.TaiKhoans.Find(id);
            if (account != null)
            {
                // Fix: Use a conditional check for nullable int and assign appropriately
                account.IsBanned = account.IsBanned.Value == 1 ? 0 : 1;
                try
                {
                    db.SaveChanges();
                    TempData["SuccessMessage"] = "Cập nhật trạng thái tài khoản thành công!";
                }
                catch (Exception ex)
                {
                    TempData["ErrorMessage"] = "Có lỗi xảy ra khi cập nhật trạng thái: " + ex.Message;
                }
            }
            else
            {
                TempData["ErrorMessage"] = "Không tìm thấy tài khoản!";
            }
            return RedirectToAction("AccountList");
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
            // Nếu ExternalLoginCallback cũng nằm trong APIController, thì RedirectToLocal nên trỏ về Index của APIController
            if (Url.IsLocalUrl(returnUrl))
            {
                return Redirect(returnUrl);
            }
            return RedirectToAction("Index", "API", new { Area = "Admin" }); // Đã sửa thành API
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