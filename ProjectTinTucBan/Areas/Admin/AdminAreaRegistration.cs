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
                "Admin_Muc_luc",
                "Admin/quan-ly-muc-luc",
                new { controller = "InterfaceAdmin", action = "Index_Roles_Admin" }
            );
            context.MapRoute(
                "Admin_role",
                "Admin/quan-ly-quyen",
                new { controller = "InterfaceAdmin", action = "Index_Roles_Admin" }
            );
            context.MapRoute(
                "Admin_BàiViet",
                "Admin/quan-ly-bai-viet",
                new { controller = "InterfaceAdmin", action = "BaiViet" }
            );
            context.MapRoute(
                "Admin_ThemBaiViet",
                "Admin/them-bai-viet",
                new { controller = "InterfaceAdmin", action = "ThemBaiViet" }
            );
            context.MapRoute(
                "Admin_SuaBaiViet",
                "Admin/sua-bai-viet/{id}",
                new { controller = "InterfaceAdmin", action = "SuaBaiViet", id = UrlParameter.Optional }
            );
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