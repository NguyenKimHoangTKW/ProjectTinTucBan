using System.Web.Mvc;

namespace ProjectTinTucBan.Areas.Admin
{
    public class AdminAreaRegistration : AreaRegistration 
    {
        public override string AreaName 
        {
            get 
            {
                return "Admin";
            }
        }

        public override void RegisterArea(AreaRegistrationContext context) 
        {
            // Custom routes for InterfaceAdmin controller
            context.MapRoute(
                "Index",
                "Admin/dashboard",
                new { controller = "InterfaceAdmin", action = "Index" }
            );

            context.MapRoute(
                "Index_MucLuc_Admin",
                "Admin/quan-ly-muc-luc",
                new { controller = "InterfaceAdmin", action = "Index_MucLuc_Admin" }
            );
            
            context.MapRoute(
                "Index_Roles_Admin",
                "Admin/quan-ly-quyen-admin",
                new { controller = "InterfaceAdmin", action = "Index_Roles_Admin" }
            );

            // Default route for other controllers/actions
            context.MapRoute(
                "Admin_default",
                "Admin/{controller}/{action}/{id}",
                new { action = "Index", id = UrlParameter.Optional }
            );
        }
    }
}