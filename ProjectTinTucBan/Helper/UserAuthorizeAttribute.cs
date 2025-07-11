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
            // Get current user from session
            var user = SessionHelper.GetUser();

            // Check if user exists and has a role assigned
            if (user == null || !user.ID_role.HasValue)
            {
                return false;
            }

            // If specific roles are specified, check if user has one of them
            if (_allowedRoles.Length > 0 && !_allowedRoles.Contains(user.ID_role.Value))
            {
                return false;
            }

            // User is authorized
            return true;
        }

        protected override void HandleUnauthorizedRequest(AuthorizationContext filterContext)
        {
            // Check if the request is from an authenticated user (who doesn't have the right role)
            var user = SessionHelper.GetUser();
            if (user != null)
            {
                // User is logged in but doesn't have permission
                filterContext.Result = new RedirectResult("~/Admin/dashboard");
            }
            else
            {
                // User is not logged in, redirect to login page
                filterContext.Result = new RedirectResult("~/Home/Login");
            }
        }
    }
}
