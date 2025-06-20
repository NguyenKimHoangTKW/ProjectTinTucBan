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
                "bai-viet",
                "admin/bai-viet",
                new { controller = "InterfaceAdmin", action = "BaiViet"}
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