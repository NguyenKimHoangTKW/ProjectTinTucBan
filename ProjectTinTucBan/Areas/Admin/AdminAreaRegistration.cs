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
            context.MapRoute(
                "Admin_default2",
                "Admin/dashboard",
                new { controller = "InterfaceAdmin", action = "Index" }
            );
            context.MapRoute(
                "Admin_Slider",
                "Admin/quan-ly-slide",
                new {controller = "InterfaceAdmin", action = "Slider"}
            );
            context.MapRoute(
                "Admin_Menu",
                "Admin/quan-ly-menu",
                new { controller= "InterfaceAdmin", action = "Menu"}
            );
            context.MapRoute(
                "Admin_default",
                "Admin/{controller}/{action}/{id}",
                new { action = "Index", id = UrlParameter.Optional }
            );
        }
    }
}