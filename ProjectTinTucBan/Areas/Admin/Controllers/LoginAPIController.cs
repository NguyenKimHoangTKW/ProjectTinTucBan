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
        private readonly EmailService _emailService;

        // Thêm biến để lưu trữ mã xác thực và thời gian hết hạn
        private static Dictionary<string, string> verificationCodes = new Dictionary<string, string>();
        private static Dictionary<string, DateTime> verificationExpiry = new Dictionary<string, DateTime>();


        public LoginAPIController()
        {
            DateTime now = DateTime.UtcNow;
            unixTimestamp = (int)(now.Subtract(new DateTime(1970, 1, 1))).TotalSeconds;
            _emailService = new EmailService();
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

        // POST: api/v1/admin/ResetPassword
        [HttpPost]
        [Route("reset-password")]
        public async Task<IHttpActionResult> ResetPassword(ResetPasswordModel model)
        {
            if (string.IsNullOrEmpty(model.email) || string.IsNullOrEmpty(model.newPassword))
            {
                return BadRequest("Email và mật khẩu mới không được để trống");
            }

            try
            {
                // Kiểm tra xem có mã xác thực cho email này không
                if (!verificationCodes.ContainsKey(model.email))
                {
                    return Ok(new
                    {
                        message = "Phiên đặt lại mật khẩu không hợp lệ hoặc đã hết hạn",
                        success = false
                    });
                }

                // Tìm tài khoản theo email
                var account = await db.TaiKhoans.FirstOrDefaultAsync(x => x.Gmail == model.email);
                if (account == null)
                {
                    return Ok(new
                    {
                        message = "Không tìm thấy tài khoản với email này",
                        success = false
                    });
                }

                // Cập nhật mật khẩu mới
                string hashedPassword = EncryptionHelper.Encrypt(model.newPassword);
                account.MatKhau = hashedPassword;
                account.NgayCapNhat = unixTimestamp;

                // Lưu thay đổi
                await db.SaveChangesAsync();

                // Xóa mã xác thực sau khi đã sử dụng
                verificationCodes.Remove(model.email);
                verificationExpiry.Remove(model.email);

                return Ok(new
                {
                    message = "Đặt lại mật khẩu thành công",
                    success = true
                });
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        // POST: api/v1/admin/send-verification-code
        [HttpPost]
        [Route("send-verification-code")]
        public async Task<IHttpActionResult> SendVerificationCode(ResetPasswordEmailModel model)
        {
            if (string.IsNullOrEmpty(model.email))
            {
                return BadRequest("Email không được để trống");
            }

            try
            {
                // Kiểm tra xem email có tồn tại trong hệ thống không
                var existingAccount = await db.TaiKhoans.FirstOrDefaultAsync(x => x.Gmail == model.email);
                if (existingAccount == null)
                {
                    return Ok(new
                    {
                        message = "Email không tồn tại trong hệ thống",
                        success = false
                    });
                }

                // Tạo mã xác thực 6 chữ số
                Random random = new Random();
                string verificationCode = random.Next(100000, 999999).ToString();

                // Lưu mã xác thực và thời gian hết hạn (5 phút)
                verificationCodes[model.email] = verificationCode;
                verificationExpiry[model.email] = DateTime.UtcNow.AddMinutes(5);

                try
                {
                    // Sử dụng EmailService để gửi email
                    await _emailService.SendVerificationEmailAsync(model.email, verificationCode);
                    
                    // Trong môi trường production, không nên trả về mã xác thực
                    #if DEBUG
                    return Ok(new
                    {
                        message = "Mã xác thực đã được gửi đến email của bạn",
                        success = true,
                        code = verificationCode // Chỉ trả về trong môi trường debug
                    });
                    #else
                    return Ok(new
                    {
                        message = "Mã xác thực đã được gửi đến email của bạn",
                        success = true
                    });
                    #endif
                }
                catch (Exception emailEx)
                {
                    System.Diagnostics.Debug.WriteLine($"Email sending error: {emailEx.Message}");
                    
                    // Vẫn trả về mã trong môi trường phát triển để dễ test
                    #if DEBUG
                    return Ok(new
                    {
                        message = "Không thể gửi email, nhưng bạn có thể dùng mã này để test",
                        success = true,
                        code = verificationCode
                    });
                    #else
                    return Ok(new
                    {
                        message = "Không thể gửi mã xác thực qua email. Vui lòng thử lại sau.",
                        success = false
                    });
                    #endif
                }
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }
        // POST: api/v1/admin/verify-code
        [HttpPost]
        [Route("verify-code")]
        public IHttpActionResult VerifyCode(VerifyCodeModel model)
        {
            if (string.IsNullOrEmpty(model.email) || string.IsNullOrEmpty(model.code))
            {
                return BadRequest("Email và mã xác thực không được để trống");
            }

            try
            {
                // Kiểm tra xem có mã xác thực cho email này không
                if (!verificationCodes.ContainsKey(model.email))
                {
                    return Ok(new
                    {
                        message = "Mã xác thực không tồn tại hoặc đã hết hạn",
                        success = false
                    });
                }

                // Kiểm tra thời gian hết hạn
                if (DateTime.UtcNow > verificationExpiry[model.email])
                {
                    verificationCodes.Remove(model.email);
                    verificationExpiry.Remove(model.email);

                    return Ok(new
                    {
                        message = "Mã xác thực đã hết hạn",
                        success = false
                    });
                }

                // Kiểm tra mã xác thực
                if (verificationCodes[model.email] != model.code)
                {
                    return Ok(new
                    {
                        message = "Mã xác thực không chính xác",
                        success = false
                    });
                }

                // Mã xác thực chính xác
                return Ok(new
                {
                    message = "Xác thực thành công",
                    success = true
                });
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        // POST: api/v1/admin/resend-verification-code
        [HttpPost]
        [Route("resend-verification-code")]
        public async Task<IHttpActionResult> ResendVerificationCode(ResetPasswordEmailModel model)
        {
            if (string.IsNullOrEmpty(model.email))
            {
                return BadRequest("Email không được để trống");
            }

            try
            {
                // Kiểm tra xem email có tồn tại trong hệ thống không
                var existingAccount = await db.TaiKhoans.FirstOrDefaultAsync(x => x.Gmail == model.email);
                if (existingAccount == null)
                {
                    return Ok(new
                    {
                        message = "Email không tồn tại trong hệ thống",
                        success = false
                    });
                }

                // Tạo mã xác thực 6 chữ số mới
                Random random = new Random();
                string verificationCode = random.Next(100000, 999999).ToString();

                // Cập nhật mã xác thực và thời gian hết hạn (5 phút)
                verificationCodes[model.email] = verificationCode;
                verificationExpiry[model.email] = DateTime.UtcNow.AddMinutes(5);

                try
                {
                    // Sử dụng EmailService để gửi email
                    await _emailService.SendVerificationEmailAsync(model.email, verificationCode);
                    
                    #if DEBUG
                    return Ok(new
                    {
                        message = "Mã xác thực mới đã được gửi đến email của bạn",
                        success = true,
                        code = verificationCode // Chỉ trả về trong môi trường debug
                    });
                    #else
                    return Ok(new
                    {
                        message = "Mã xác thực mới đã được gửi đến email của bạn",
                        success = true
                    });
                    #endif
                }
                catch (Exception emailEx)
                {
                    System.Diagnostics.Debug.WriteLine($"Email resending error: {emailEx.Message}");
                    
                    #if DEBUG
                    return Ok(new
                    {
                        message = "Không thể gửi email, nhưng bạn có thể dùng mã này để test",
                        success = true,
                        code = verificationCode
                    });
                    #else
                    return Ok(new
                    {
                        message = "Không thể gửi lại mã xác thực qua email. Vui lòng thử lại sau.",
                        success = false
                    });
                    #endif
                }
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

    public class ResetPasswordEmailModel
    {
        public string email { get; set; }
    }

    public class VerifyCodeModel
    {
        public string email { get; set; }
        public string code { get; set; }
    }

    public class ResetPasswordModel
    {
        public string email { get; set; }
        public string newPassword { get; set; }
    }
}