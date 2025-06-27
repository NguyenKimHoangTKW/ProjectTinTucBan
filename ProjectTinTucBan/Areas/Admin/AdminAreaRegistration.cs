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
               "Admin_Khoi",
               "Admin/Khoi",
               new { controller = "InterfaceAdmin", action = "Index_Khoi" }
           );
            context.MapRoute(
              "Admin_DonViTrucThuoc",
              "Admin/DonViTrucThuoc",
              new { controller = "InterfaceAdmin", action = "Index_DonViTrucThuoc" }
          );
            context.MapRoute(
                "bai-viet",
                "admin/bai-viet",
                new { controller = "InterfaceAdmin", action = "BaiViet" }
            );
            context.MapRoute(
                "xem-noi-dung",
                "admin/xem-noi-dung/{id}",
                new { controller = "InterfaceAdmin", action = "XemNoiDung", id = UrlParameter.Optional }
            );
            context.MapRoute(
                "Admin_default",
                "Admin/{controller}/{action}/{id}",
                new { action = "Index", id = UrlParameter.Optional }
            );

        }
    }
}