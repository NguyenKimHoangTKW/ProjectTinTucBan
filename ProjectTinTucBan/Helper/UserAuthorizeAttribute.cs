using ProjectTinTucBan.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace ProjectTinTucBan.Helper
{
    public class UserAuthorizeAttribute : AuthorizeAttribute
    {
        private readonly int[] _allowedRoles;

        public UserAuthorizeAttribute(params int[] allowedRoles)
        {
            _allowedRoles = allowedRoles ?? new int[0];
        }

        protected override bool AuthorizeCore(HttpContextBase httpContext)
        {
            // Luôn cập nhật lại session user từ database
            SessionHelper.UpdateUserSession();

            var user = SessionHelper.GetUser();

            if (user == null || !user.ID_role.HasValue)
            {
                return false;
            }

            // Kiểm tra bị khóa tài khoản
            if (user.IsBanned == 1)
            {
                return false;
            }

            if (_allowedRoles.Length > 0 && !_allowedRoles.Contains(user.ID_role.Value))
            {
                return false;
            }

            return true;
        }


        protected override void HandleUnauthorizedRequest(AuthorizationContext filterContext)
        {
            var user = SessionHelper.GetUser();
            if (user != null)
            {
                if (user.IsBanned == 1)
                {
                    // Xóa session khi bị khóa
                    SessionHelper.ClearUser();
                    filterContext.Controller.TempData["AlertType"] = "warning";
                    filterContext.Controller.TempData["AlertMessage"] = "Tài khoản của bạn đã bị khóa!";
                    filterContext.Result = new RedirectResult("~/Home/Login");
                }
                else
                {
                    filterContext.Controller.TempData["AlertType"] = "warning";
                    filterContext.Controller.TempData["AlertMessage"] = "Bạn không có quyền vào trang này!";
                    filterContext.Result = new RedirectResult("~/Admin/dashboard");
                }
            }
            else
            {
                filterContext.Result = new RedirectResult("~/Home/Login");
            }
        }
    }
}