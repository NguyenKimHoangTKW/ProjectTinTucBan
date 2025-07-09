using System;
using System.IO;
using System.Linq;
using System.Security.Cryptography;
using System.Text;

namespace ProjectTinTucBan.Helper
{
    public static class EncryptionHelper
    {
        // Khóa mã hóa cố định với các ký tự đặc biệt
        private static readonly string EncryptionKey = Convert.ToBase64String(
            Encoding.UTF8.GetBytes("TDMU$@#!_WebTinTuc*&^%_SecretKey~+-<>?").Take(32).ToArray());

        public static string Encrypt(string plainText)
        {
            // Kiểm tra đầu vào
            if (string.IsNullOrEmpty(plainText))
                return plainText;

            using (Aes aesAlg = Aes.Create())
            {
                aesAlg.Key = Convert.FromBase64String(EncryptionKey);
                aesAlg.IV = GenerateRandomIV(); // Tạo vector khởi tạo ngẫu nhiên cho mỗi lần mã hóa

                aesAlg.Padding = PaddingMode.PKCS7; // Thiết lập chế độ đệm PKCS7

                // Tạo đối tượng mã hóa với khóa và IV
                ICryptoTransform encryptor = aesAlg.CreateEncryptor(aesAlg.Key, aesAlg.IV);

                using (MemoryStream msEncrypt = new MemoryStream())
                {
                    using (CryptoStream csEncrypt = new CryptoStream(msEncrypt, encryptor, CryptoStreamMode.Write))
                    {
                        using (StreamWriter swEncrypt = new StreamWriter(csEncrypt))
                        {
                            // Ghi văn bản vào stream để mã hóa
                            swEncrypt.Write(plainText);
                        }
                    }
                    // Kết hợp IV và dữ liệu đã mã hóa rồi chuyển thành chuỗi Base64
                    return Convert.ToBase64String(aesAlg.IV.Concat(msEncrypt.ToArray()).ToArray());
                }
            }
        }

        public static string Decrypt(string cipherText)
        {
            // Kiểm tra đầu vào
            if (string.IsNullOrEmpty(cipherText))
                return cipherText;

            try
            {
                // Chuyển đổi chuỗi Base64 thành mảng byte
                byte[] cipherBytes = Convert.FromBase64String(cipherText);

                // Kiểm tra độ dài tối thiểu
                if (cipherBytes.Length <= 16)
                    return string.Empty;

                using (Aes aesAlg = Aes.Create())
                {
                    aesAlg.Key = Convert.FromBase64String(EncryptionKey);
                    aesAlg.IV = cipherBytes.Take(16).ToArray(); // Lấy 16 byte đầu tiên làm IV

                    aesAlg.Padding = PaddingMode.PKCS7; // Thiết lập chế độ đệm PKCS7

                    // Tạo đối tượng giải mã
                    ICryptoTransform decryptor = aesAlg.CreateDecryptor(aesAlg.Key, aesAlg.IV);

                    using (MemoryStream msDecrypt = new MemoryStream(cipherBytes, 16, cipherBytes.Length - 16))
                    {
                        using (CryptoStream csDecrypt = new CryptoStream(msDecrypt, decryptor, CryptoStreamMode.Read))
                        {
                            using (StreamReader srDecrypt = new StreamReader(csDecrypt))
                            {
                                // Đọc văn bản đã giải mã
                                return srDecrypt.ReadToEnd();
                            }
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                // Xử lý lỗi khi giải mã thất bại
                Console.WriteLine($"Lỗi giải mã: {ex.Message}");
                return string.Empty;
            }
        }

        private static byte[] GenerateRandomIV()
        {
            // Tạo và trả về vector khởi tạo (IV) ngẫu nhiên
            using (Aes aesAlg = Aes.Create())
            {
                aesAlg.GenerateIV();
                return aesAlg.IV;
            }
        }

        // Phương thức này giữ lại để tương thích với mã nguồn cũ
        private static string GenerateRandomKey(int keySizeInBits)
        {
            // Chuyển kích thước khóa từ bit sang byte
            int keySizeInBytes = keySizeInBits / 8;

            // Tạo mảng byte để lưu khóa ngẫu nhiên
            byte[] keyBytes = new byte[keySizeInBytes];

            // Sử dụng bộ tạo số ngẫu nhiên mật mã để điền vào mảng byte
            using (var rng = new RNGCryptoServiceProvider())
            {
                rng.GetBytes(keyBytes);
            }

            // Chuyển đổi mảng byte thành chuỗi Base64 để lưu trữ
            return Convert.ToBase64String(keyBytes);
        }

        // Thêm phương thức tiện ích để lấy mật khẩu đã mã hóa (hữu ích khi cần đặt lại mật khẩu)
        public static string GetEncryptedDefaultPassword()
        {
            return Encrypt("@123");
        }
    }
}