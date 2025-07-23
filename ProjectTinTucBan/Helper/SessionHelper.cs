using System;
using System.Web;
using System.Web.Http;
using ProjectTinTucBan.Models;

namespace ProjectTinTucBan.Helper
{
    public static class SessionHelper
    {
        private const string UserInfoSessionKey = "UserInfoSessionKey";
        private const string UserRoleSessionKey = "UserRoleSessionKey";

        public static void SetUser(ProjectTinTucBan.Models.TaiKhoan user, HttpContext httpContext = null)
        {
            try
            {
                HttpContext context = httpContext ?? HttpContext.Current;

                if (context == null || context.Session == null)
                {
                    System.Diagnostics.Debug.WriteLine("SetUser failed: HttpContext or Session is null");
                    return;
                }

                if (user == null)
                {
                    System.Diagnostics.Debug.WriteLine("SetUser failed: User is null");
                    return;
                }

                context.Session[UserInfoSessionKey] = user;
                context.Session[UserRoleSessionKey] = user.ID_role;
                System.Diagnostics.Debug.WriteLine($"User session set successfully for: {user.TenTaiKhoan}");
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"Error in SetUser: {ex.Message}");
            }
        }

        public static ProjectTinTucBan.Models.TaiKhoan GetUser(HttpContext httpContext = null)
        {
            try
            {
                HttpContext context = httpContext ?? HttpContext.Current;
                if (context != null && context.Session != null)
                {
                    return context.Session[UserInfoSessionKey] as ProjectTinTucBan.Models.TaiKhoan;
                }
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"Error in GetUser: {ex.Message}");
            }
            return null;
        }

        public static int? GetUserRole(HttpContext httpContext = null)
        {
            try
            {
                HttpContext context = httpContext ?? HttpContext.Current;
                if (context != null && context.Session != null)
                {
                    var role = context.Session[UserRoleSessionKey];
                    return role == null ? null : (int?)role;
                }
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"Error in GetUserRole: {ex.Message}");
            }
            return null;
        }

        public static void ClearUser(HttpContext httpContext = null)
        {
            try
            {
                HttpContext context = httpContext ?? HttpContext.Current;
                if (context != null && context.Session != null)
                {
                    context.Session.Remove(UserInfoSessionKey);
                    context.Session.Remove(UserRoleSessionKey);
                    System.Diagnostics.Debug.WriteLine("User session cleared successfully");
                }
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"Error in ClearUser: {ex.Message}");
            }
        }

        public static bool IsUserLoggedIn(HttpContext httpContext = null)
        {
            try
            {
                HttpContext context = httpContext ?? HttpContext.Current;
                if (context != null && context.Session != null)
                {
                    return context.Session[UserInfoSessionKey] != null;
                }
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"Error in IsUserLoggedIn: {ex.Message}");
            }
            return false;
        }

        public static void UpdateUserSession()
        {
            var sessionUser = GetUser();
            if (sessionUser != null)
            {
                using (var db = new WebTinTucTDMUEntities())
                {
                    var dbUser = db.TaiKhoans.Find(sessionUser.ID);
                    if (dbUser != null)
                    {
                        // Cập nhật lại thông tin user trong session
                        HttpContext.Current.Session["User"] = dbUser;
                    }
                }
            }
        }
    }
}