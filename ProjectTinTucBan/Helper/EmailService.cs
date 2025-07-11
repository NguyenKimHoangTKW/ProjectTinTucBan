using System;
using System.Configuration;
using System.Net;
using System.Net.Configuration;
using System.Net.Mail;
using System.Threading.Tasks;

namespace ProjectTinTucBan.Helper
{
    public class EmailService
    {
        private readonly string _senderEmail;
        private readonly string _displayName;

        public EmailService()
        {
            // Lấy giá trị từ cấu hình SMTP
            var mailSettings = ConfigurationManager.GetSection("system.net/mailSettings/smtp") as SmtpSection;
            _senderEmail = mailSettings?.From ?? "Dumplinreplucat0003@gmail.com";
            _displayName = "Ban Khảo thí, kiểm định và Đảm bảo chất lượng";
        }

        public async Task SendVerificationEmailAsync(string email, string code)
        {
            try
            {
                using (MailMessage mailMessage = new MailMessage())
                {
                    mailMessage.From = new MailAddress(_senderEmail, _displayName);
                    mailMessage.Subject = "Mã xác thực đặt lại mật khẩu";
                    mailMessage.Body = $@"
                    <html>
                    <head>
                        <style>
                            body {{ font-family: Arial, sans-serif; }}
                            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                            .header {{ background-color: #0066cc; color: white; padding: 15px; text-align: center; }}
                            .content {{ padding: 20px; border: 1px solid #ddd; }}
                            .code {{ font-size: 24px; font-weight: bold; text-align: center; 
                                    padding: 10px; background-color: #f8f9fa; margin: 20px 0; }}
                            .footer {{ font-size: 12px; text-align: center; margin-top: 20px; color: #666; }}
                        </style>
                    </head>
                    <body>
                        <div class='container'>
                            <div class='header'>
                                <h2>Ban Khảo thí, kiểm định và Đảm bảo chất lượng</h2>
                            </div>
                            <div class='content'>
                                <p>Xin chào,</p>
                                <p>Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản của mình. Vui lòng sử dụng mã xác thực sau để hoàn tất quá trình:</p>
                                <div class='code'>{code}</div>
                                <p>Mã này sẽ hết hạn sau 5 phút.</p>
                                <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
                                <p>Trân trọng,<br>Website Tin Tức TDMU</p>
                            </div>
                            <div class='footer'>
                                <p>Đây là email tự động, vui lòng không trả lời.</p>
                                <p>&copy; {DateTime.Now.Year} Website Tin Tức TDMU</p>
                            </div>
                        </div>
                    </body>
                    </html>";
                    mailMessage.IsBodyHtml = true;
                    mailMessage.To.Add(new MailAddress(email));

                    using (SmtpClient smtpClient = new SmtpClient())
                    {
                        // SmtpClient sẽ tự động đọc cấu hình từ Web.config
                        await smtpClient.SendMailAsync(mailMessage);
                    }
                }
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"Error sending email: {ex.Message}");
                if (ex.InnerException != null)
                    System.Diagnostics.Debug.WriteLine($"Inner exception: {ex.InnerException.Message}");
                throw; // Re-throw để có thể xử lý ở lớp gọi
            }
        }
    }
}