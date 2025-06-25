using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace ProjectTinTucBan.Helper
{
    public static class SessionHelper
    {
        private const string UserInfoSessionKey = "UserInfoSessionKey";
        private const string UserRoleSessionKey = "UserRoleSessionKey";

        public static void SetUser(ProjectTinTucBan.Models.TaiKhoan user)
        {
            HttpContext.Current.Session[UserInfoSessionKey] = user;
            HttpContext.Current.Session[UserRoleSessionKey] = user.ID_role;
        }

        public static ProjectTinTucBan.Models.TaiKhoan GetUser()
        {
            return HttpContext.Current.Session[UserInfoSessionKey] as ProjectTinTucBan.Models.TaiKhoan;
        }

        public static string GetUserRole()
        {
            return HttpContext.Current.Session[UserRoleSessionKey] as string;
        }

        public static void ClearUser()
        {
            HttpContext.Current.Session.Remove(UserInfoSessionKey);
            HttpContext.Current.Session.Remove(UserRoleSessionKey);
        }

        public static bool IsUserLoggedIn()
        {
            return HttpContext.Current.Session[UserInfoSessionKey] != null;
        }
    }
}