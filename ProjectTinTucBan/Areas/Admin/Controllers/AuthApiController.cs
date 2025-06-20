using System;
using System.Linq;
using System.Web;
using System.Web.Http;
using System.Net;
using System.Web.Mvc; // Giữ lại để dùng UrlHelper
using ProjectTinTucBan.Models;

namespace ProjectTinTucBan.Areas.Admin.Controllers
{
    // Model để nhận dữ liệu từ request
    public class LoginRequestModel
    {
        public string Username { get; set; }
        public string Password { get; set; }
    }

    [System.Web.Http.RoutePrefix("api/auth")] // Sửa lỗi 1: Chỉ định rõ RoutePrefix của Web API 
    public class AuthApiController : ApiController
    {
        private readonly WebTinTucTDMUEntities db = new WebTinTucTDMUEntities(); // Thêm readonly theo gợi ý của IDE

        [System.Web.Http.HttpPost] // Sửa lỗi 2: Chỉ định rõ HttpPost của Web API
        [System.Web.Http.Route("login")] // Sửa lỗi 3: Chỉ định rõ Route của Web API
        public IHttpActionResult Login(LoginRequestModel model)
        {
            if (model == null || string.IsNullOrEmpty(model.Username) || string.IsNullOrEmpty(model.Password))
            {
                return BadRequest("Tên đăng nhập và mật khẩu không được để trống.");
            }

            var userFromDb = db.TaiKhoans.FirstOrDefault(u => u.TenTaiKhoan == model.Username);

            if (userFromDb != null)
            {
                bool isPasswordCorrect = System.Web.Helpers.Crypto.VerifyHashedPassword(userFromDb.MatKhau, model.Password);

                if (isPasswordCorrect)
                {
                    // Sửa lỗi logic: Kiểm tra nếu IsBanned là true (tài khoản bị khóa)
                    if (userFromDb.IsBanned == 0) 
                    {
                        return Content(HttpStatusCode.Unauthorized, "Tài khoản này đã bị khóa.");
                    }

                    HttpContext.Current.Session["AdminUser"] = userFromDb.TenTaiKhoan;
                    HttpContext.Current.Session["UserID"] = userFromDb.ID;
                    HttpContext.Current.Session["UserRole"] = "DefaultUser";

                    var urlHelper = new UrlHelper(HttpContext.Current.Request.RequestContext);
                    var redirectUrl = urlHelper.Action("Index", "API", new { Area = "Admin" });
                    return Ok(new { success = true, message = "Đăng nhập thành công!", redirectUrl = redirectUrl });
                }
            }

            return Content(HttpStatusCode.Unauthorized, "Tên đăng nhập hoặc mật khẩu không đúng!");
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