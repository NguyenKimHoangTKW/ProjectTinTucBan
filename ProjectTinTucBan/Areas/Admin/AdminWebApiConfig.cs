using System.Web.Http;

namespace ProjectTinTucBan.Areas.Admin
{
    public static class AdminWebApiConfig
    {
        public static void Register(HttpConfiguration config)
        {
            config.Routes.MapHttpRoute(
                name: "Admin_Api",
                routeTemplate: "api/{area}/{controller}/{action}/{id}",
                defaults: new { area = "Admin", id = RouteParameter.Optional }
            );

            // Route ngắn cho phép gọi /api/DonViTrucThuoc
            config.Routes.MapHttpRoute(
                name: "Admin_Api_Short",
                routeTemplate: "api/{controller}/{id}",
                defaults: new { area = "Admin", id = RouteParameter.Optional, action = "Get" }
            );
        }
    }
}