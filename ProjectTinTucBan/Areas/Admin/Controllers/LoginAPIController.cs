using ProjectTinTucBan.Models;
using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Security.Principal;
using System.Threading.Tasks;
using System.Web;
using System.Web.Http;


namespace ProjectTinTucBan.Areas.Admin.Controllers
{
    [RoutePrefix("api/v1/admin")]
    public class LoginAPIController : ApiController
    {
        private WebTinTucTDMUEntities db = new WebTinTucTDMUEntities();
        private int unixTimestamp;

        public LoginAPIController()
        {
            DateTime now = DateTime.UtcNow;
            unixTimestamp = (int)(now.Subtract(new DateTime(1970, 1, 1))).TotalSeconds;
        }

        private HttpContext GetCurrentContext()
        {
            return HttpContext.Current ?? (Request.Properties.ContainsKey("MS_HttpContext") ? 
                      ((HttpContextWrapper)Request.Properties["MS_HttpContext"]).ApplicationInstance.Context : null);
        }

        // POST: api/v1/admin/login-with-google
        [HttpPost]
        [Route("login-with-google")]
        public async Task<IHttpActionResult> LoginWithGoogle(GoogleLoginModel model)
        {
            if (string.IsNullOrEmpty(model.email))
            {
                return BadRequest("Email không được để trống");
            }

            // Validate email domain
            if (!model.email.EndsWith("@student.tdmu.edu.vn") && !model.email.EndsWith("@tdmu.edu.vn"))
            {
                return Ok(new
                {
                    message = "Gmail không hợp lệ.",
                    success = false
                });
            }

            try
            {
                var existingAccount = await db.TaiKhoans.FirstOrDefaultAsync(x => x.Gmail == model.email);

                if (existingAccount == null)
                {
                    existingAccount = new TaiKhoan
                    {
                        TenTaiKhoan = model.name,
                        Gmail = model.email,
                        ID_role = 4,
                        NgayTao = unixTimestamp,
                        NgayCapNhat = unixTimestamp,
                        IsBanned = 0
                    };
                    db.TaiKhoans.Add(existingAccount);
                    await db.SaveChangesAsync();
                }
                else
                {
                    existingAccount.TenTaiKhoan = model.name;
                    await db.SaveChangesAsync();
                }

                /*try
                {
                    SessionHelper.SetUser(existingAccount);
                }
                catch (Exception ex)
                {
                    // Log the error but continue - session error shouldn't prevent login
                    System.Diagnostics.Debug.WriteLine("Session error: " + ex.Message);
                }*/

                return Ok(new
                {
                    idRole = existingAccount.ID_role,
                    message = "Đăng nhập thành công",
                    success = true
                });
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        // POST: api/v1/admin/login
        [HttpPost]
        [Route("login")]
        public async Task<IHttpActionResult> Login(LoginModel model)
        {
            try
            {
                // Tìm tài khoản dựa trên username hoặc email
                var user = await db.TaiKhoans.FirstOrDefaultAsync(u =>
                    u.TenTaiKhoan == model.Username || u.Gmail == model.Username);

                if (user != null && user.MatKhau == model.Password)
                {
                    // Check if email is from valid domain
                    if (user.Gmail != null && !user.Gmail.EndsWith("@student.tdmu.edu.vn") && !user.Gmail.EndsWith("@tdmu.edu.vn"))
                    {
                        return Ok(new
                        {
                            message = "Gmail không hợp lệ.",
                            success = false
                        });
                    }

                    // Tạo Account từ TaiKhoan
                    var accountForSession = new TaiKhoan
                    {
                        ID = user.ID,
                        TenTaiKhoan = user.TenTaiKhoan,
                        Gmail = user.Gmail,
                        ID_role = user.ID_role ?? 4
                    };

                    /*try
                    {
                        SessionHelper.SetUser(accountForSession);
                    }
                    catch (Exception ex)
                    {
                        // Log the error but continue - session error shouldn't prevent login
                        System.Diagnostics.Debug.WriteLine("Session error: " + ex.Message);
                    }*/

                    return Ok(new
                    {
                        idRole = user.ID_role,
                        message = "Đăng nhập thành công",
                        success = true
                    });
                }

                return Ok(new
                {
                    message = "Tên đăng nhập hoặc mật khẩu không đúng",
                    success = false
                });
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        // POST: api/v1/admin/clear_session
        [HttpPost]
        [Route("clear_session")]
        public IHttpActionResult Logout()
        {
            try
            {
                //SessionHelper.ClearUser();
                return Ok(new { success = true });
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }
    }

    public class GoogleLoginModel
    {
        public string email { get; set; }
        public string name { get; set; }
    }

    public class LoginModel
    {
        public string Username { get; set; }
        public string Password { get; set; }
    }
}