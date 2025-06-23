using ProjectTinTucBan.Helper;
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
                // Lấy phần trước @ từ email để làm tên đăng nhập
                string username = model.email.Split('@')[0];

                var existingAccount = await db.TaiKhoans.FirstOrDefaultAsync(x => x.Gmail == model.email);
                string MatKhauMaHoa = EncryptionHelper.Encrypt("@123");
                if (existingAccount == null)
                {
                    existingAccount = new TaiKhoan
                    {
                        TenTaiKhoan = username, 
                        MatKhau = MatKhauMaHoa,
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
                    // Cập nhật tên đăng nhập nếu cần
                    if (existingAccount.TenTaiKhoan != username)
                    {
                        existingAccount.TenTaiKhoan = username;
                        await db.SaveChangesAsync();
                    }
                }

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
                // Tìm tài khoản dựa trên username
                var user = await db.TaiKhoans.FirstOrDefaultAsync(u => u.TenTaiKhoan == model.Username);

                // Kiểm tra user null trước khi giải mã
                if (user == null)
                {
                    return Ok(new
                    {
                        message = "Tên đăng nhập không tồn tại",
                        success = false
                    });
                }

                try
                {
                    string MatKhauGiaiMa = EncryptionHelper.Decrypt(user.MatKhau);

                    if (MatKhauGiaiMa == model.Password)
                    {
                        // Kiểm tra domain email nếu có
                        if (user.Gmail != null && !user.Gmail.EndsWith("@student.tdmu.edu.vn") && !user.Gmail.EndsWith("@tdmu.edu.vn"))
                        {
                            return Ok(new
                            {
                                message = "Gmail không hợp lệ.",
                                success = false
                            });
                        }

                        // Tạo Account cho session từ TaiKhoan
                        var accountForSession = new TaiKhoan
                        {
                            ID = user.ID,
                            TenTaiKhoan = user.TenTaiKhoan,
                            Gmail = user.Gmail,
                            ID_role = user.ID_role ?? 4
                        };

                        return Ok(new
                        {
                            idRole = user.ID_role,
                            message = "Đăng nhập thành công",
                            success = true
                        });
                    }
                    else
                    {
                        return Ok(new
                        {
                            message = "Mật khẩu không đúng",
                            success = false
                        });
                    }
                }
                catch (Exception decryptEx)
                {
                    // Log lỗi giải mã
                    System.Diagnostics.Debug.WriteLine("Decrypt error: " + decryptEx.Message);

                    return Ok(new
                    {
                        message = "Đã xảy ra lỗi khi xác thực mật khẩu",
                        success = false
                    });
                }
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