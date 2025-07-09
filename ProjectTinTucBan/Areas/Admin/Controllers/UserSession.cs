using System;

namespace ProjectTinTucBan.Models
{
    [Serializable] // Important for session storage
    public class UserSession
    {
        public int ID { get; set; }
        public int? ID_role { get; set; }
        public string TenTaiKhoan { get; set; }
        public string Name { get; set; }
        public string Gmail { get; set; }
        public string SDT { get; set; }
        public int? IsBanned { get; set; }

        // Static method to create from TaiKhoan
        public static UserSession FromTaiKhoan(TaiKhoan user)
        {
            if (user == null) return null;

            return new UserSession
            {
                ID = user.ID,
                ID_role = user.ID_role,
                TenTaiKhoan = user.TenTaiKhoan,
                Name = user.Name,
                Gmail = user.Gmail,
                SDT = user.SDT,
                IsBanned = user.IsBanned
            };
        }
    }
}