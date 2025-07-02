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
            if (HttpContext.Current != null)
                return HttpContext.Current;

            var httpContextBase = Request.Properties["MS_HttpContext"] as HttpContextBase;
            if (httpContextBase != null)
                return httpContextBase.ApplicationInstance.Context;

            return null;
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
                    // Tạo tài khoản mới nếu chưa tồn tại
                    existingAccount = new TaiKhoan
                    {
                        TenTaiKhoan = username,
                        MatKhau = MatKhauMaHoa,
                        Name = model.name,
                        Gmail = model.email,
                        ID_role = 4,
                        NgayTao = unixTimestamp,
                        NgayCapNhat = unixTimestamp,
                        IsBanned = 0,
                        CountPasswordFail = 0,
                        LockTime = null,
                        LockTimeout = null
                    };
                    db.TaiKhoans.Add(existingAccount);
                    await db.SaveChangesAsync();
                }
                else
                {
                    // Kiểm tra nếu tài khoản đã bị khóa vĩnh viễn
                    if (existingAccount.IsBanned == 1)
                    {
                        return Ok(new
                        {
                            message = "Tài khoản của bạn đã bị khóa vĩnh viễn",
                            success = false,
                            isLocked = true,
                            isPermanent = true
                        });
                    }

                    // Kiểm tra thời gian khóa tạm thời
                    if (existingAccount.LockTime.HasValue && existingAccount.LockTimeout.HasValue)
                    {
                        // Tính thời gian khóa còn lại
                        DateTime lockEndTime = DateTimeOffset.FromUnixTimeSeconds(existingAccount.LockTime.Value)
                            .AddSeconds(existingAccount.LockTimeout.Value).UtcDateTime;

                        if (DateTime.UtcNow < lockEndTime)
                        {
                            TimeSpan remainingTime = lockEndTime - DateTime.UtcNow;
                            return Ok(new
                            {
                                message = $"Tài khoản tạm thời bị khóa. Vui lòng thử lại sau {(int)remainingTime.TotalSeconds} giây.",
                                success = false,
                                isLocked = true,
                                remainingSeconds = (int)remainingTime.TotalSeconds
                            });
                        }
                        else
                        {
                            // Thời gian khóa đã hết, đặt lại các trường liên quan
                            existingAccount.LockTime = null;
                            existingAccount.LockTimeout = null;
                        }
                    }

                    // Cập nhật tên đăng nhập nếu cần
                    if (existingAccount.TenTaiKhoan != username)
                    {
                        existingAccount.TenTaiKhoan = username;
                        existingAccount.CountPasswordFail = 0;
                        existingAccount.LockTime = null;
                        existingAccount.NgayCapNhat = unixTimestamp;
                        existingAccount.LockTimeout = null;

                        await db.SaveChangesAsync();
                    }
                }

                // Đặt lại số lần nhập sai mật khẩu (nếu có)
                existingAccount.CountPasswordFail = 0;
                await db.SaveChangesAsync();

                // Lưu vào session
                SessionHelper.SetUser(existingAccount, GetCurrentContext());

                return Ok(new
                {
                    idRole = existingAccount.ID_role,
                    userId = existingAccount.ID,
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
                // Constants for account lockout
                const int MaxFailedAttemptsBeforeLockout = 3;
                const int MaxFailedAttemptsToPermanentLock = 5;
                const int LockoutDurationInSeconds = 15;
                const int LockoutDurationInSecondsExtended = 30;

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

                // Kiểm tra nếu tài khoản đã bị khóa vĩnh viễn
                if (user.IsBanned == 1)
                {
                    return Ok(new
                    {
                        message = "Tài khoản của bạn đã bị khóa vĩnh viễn",
                        success = false
                    });
                }

                // Kiểm tra thời gian khóa tạm thời
                if (user.LockTime.HasValue && user.LockTimeout.HasValue)
                {
                    // Tính thời gian khóa còn lại
                    DateTime lockEndTime = DateTimeOffset.FromUnixTimeSeconds(user.LockTime.Value).AddSeconds(user.LockTimeout.Value).UtcDateTime;

                    if (DateTime.UtcNow < lockEndTime)
                    {
                        TimeSpan remainingTime = lockEndTime - DateTime.UtcNow;
                        return Ok(new
                        {
                            message = $"Tài khoản tạm thời bị khóa. Vui lòng thử lại sau {(int)remainingTime.TotalSeconds} giây.",
                            success = false,
                            isLocked = true,
                            remainingSeconds = (int)remainingTime.TotalSeconds
                        });
                    }
                    else
                    {
                        // Thời gian khóa đã hết, đặt lại các trường liên quan
                        user.LockTime = null;
                        user.LockTimeout = null;
                    }
                }

                try
                {
                    string MatKhauGiaiMa = EncryptionHelper.Decrypt(user.MatKhau);

                    if (MatKhauGiaiMa == model.Password)
                    {
                        // Đăng nhập thành công, đặt lại số lần nhập sai mật khẩu
                        user.CountPasswordFail = 0;
                        user.LockTime = null;
                        user.LockTimeout = null;
                        await db.SaveChangesAsync();

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


                        SessionHelper.SetUser(user, GetCurrentContext());

                        return Ok(new
                        {
                            idRole = user.ID_role,
                            userId = user.ID,
                            message = "Đăng nhập thành công",
                            success = true

                        });


                    }
                    else
                    {
                        // Tăng số lần nhập sai mật khẩu
                        user.CountPasswordFail = (user.CountPasswordFail ?? 0) + 1;

                        // Kiểm tra các điều kiện khóa tài khoản
                        if (user.CountPasswordFail >= MaxFailedAttemptsToPermanentLock)
                        {
                            // Khóa vĩnh viễn tài khoản
                            user.IsBanned = 1;
                            user.LockTime = null;
                            user.LockTimeout = null;
                            await db.SaveChangesAsync();

                            return Ok(new
                            {
                                message = "Tài khoản đã bị khóa vì nhập sai mật khẩu quá nhiều lần. Vui lòng liên hệ quản trị viên để được hỗ trợ.",
                                success = false,
                                isLocked = true,
                                isPermanent = true
                            });
                        }
                        else if (user.CountPasswordFail >= MaxFailedAttemptsBeforeLockout)
                        {
                            // Khóa tạm thời với thời gian dài hơn
                            user.LockTime = unixTimestamp;
                            user.LockTimeout = LockoutDurationInSecondsExtended;
                            await db.SaveChangesAsync();

                            return Ok(new
                            {
                                message = $"Tài khoản tạm thời bị khóa trong {LockoutDurationInSecondsExtended} giây vì nhập sai mật khẩu nhiều lần.",
                                success = false,
                                isLocked = true,
                                remainingSeconds = LockoutDurationInSecondsExtended
                            });
                        }
                        else if (user.CountPasswordFail == MaxFailedAttemptsBeforeLockout)
                        {
                            // Khóa tạm thời
                            user.LockTime = unixTimestamp;
                            user.LockTimeout = LockoutDurationInSeconds;
                            await db.SaveChangesAsync();

                            return Ok(new
                            {
                                message = $"Tài khoản tạm thời bị khóa trong {LockoutDurationInSeconds} giây vì nhập sai mật khẩu nhiều lần.",
                                success = false,
                                isLocked = true,
                                remainingSeconds = LockoutDurationInSeconds
                            });
                        }
                        else
                        {
                            // Lưu số lần nhập sai vào database
                            await db.SaveChangesAsync();

                            int remainingAttempts = MaxFailedAttemptsBeforeLockout - user.CountPasswordFail.Value;
                            return Ok(new
                            {
                                message = $"Mật khẩu không đúng. Bạn còn {remainingAttempts} lần thử trước khi tài khoản bị khóa tạm thời.",
                                success = false,
                                remainingAttempts = remainingAttempts
                            });
                        }
                    }
                }
                catch (Exception decryptEx)
                {

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
                SessionHelper.ClearUser();
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

        // Add this endpoint to return user session data
        [HttpGet]
        [Route("current-user")]
        public IHttpActionResult GetCurrentUser()
        {
            try
            {
                var currentUser = SessionHelper.GetUser();
                if (currentUser == null)
                {
                    return Ok(new
                    {
                        isLoggedIn = false,
                        message = "Người dùng chưa đăng nhập",
                        success = false
                    });
                }

                return Ok(new
                {
                    isLoggedIn = true,
                    user = new
                    {
                        id = currentUser.ID,
                        username = currentUser.TenTaiKhoan,
                        name = currentUser.Name,
                        email = currentUser.Gmail,
                        role = currentUser.ID_role
                    },
                    success = true
                });
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"Session error: {ex.Message}");
                return InternalServerError(ex);
            }
        }


        // POST: api/v1/admin/check-account-lock
        [HttpPost]
        [Route("check-account-lock")]
        public async Task<IHttpActionResult> CheckAccountLock(CheckLockModel model)
        {
            if (string.IsNullOrEmpty(model.username))
            {
                return BadRequest("Username cannot be empty");
            }

            try
            {
                // Find the account by username
                var user = await db.TaiKhoans.FirstOrDefaultAsync(u => u.TenTaiKhoan == model.username || u.Gmail == model.username);

                if (user == null)
                {
                    return Ok(new
                    {
                        isLocked = false,
                        message = "User not found",
                        success = false
                    });
                }

                // Check if account is permanently locked
                if (user.IsBanned == 1)
                {
                    return Ok(new
                    {
                        isLocked = true,
                        isPermanent = true,
                        message = "Account is permanently locked",
                        success = true
                    });
                }

                // Check if account is temporarily locked
                if (user.LockTime.HasValue && user.LockTimeout.HasValue)
                {
                    // Calculate remaining lock time
                    DateTime lockEndTime = DateTimeOffset.FromUnixTimeSeconds(user.LockTime.Value)
                        .AddSeconds(user.LockTimeout.Value).UtcDateTime;

                    if (DateTime.UtcNow < lockEndTime)
                    {
                        // Account is still locked
                        TimeSpan remainingTime = lockEndTime - DateTime.UtcNow;

                        return Ok(new
                        {
                            isLocked = true,
                            isPermanent = false,
                            unlockTime = user.LockTime.Value + user.LockTimeout.Value, // Unix timestamp when lock expires
                            countPasswordFail = user.CountPasswordFail ?? 0,
                            remainingSeconds = (int)remainingTime.TotalSeconds,
                            message = "Account is temporarily locked",
                            success = true
                        });
                    }
                }

                // Account is not locked
                return Ok(new
                {
                    isLocked = false,
                    message = "Account is not locked",
                    success = true
                });
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

    }

    public class CheckLockModel
    {
        public string username { get; set; }
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