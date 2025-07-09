using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using System.Web.Routing;

namespace ProjectTinTucBan
{
    public class RouteConfig
    {
        public static void RegisterRoutes(RouteCollection routes)
        {
            routes.MapMvcAttributeRoutes();
            routes.IgnoreRoute("{resource}.axd/{*pathInfo}");

            routes.MapRoute(
            name: "TinTuc",
            url: "tin-tuc",
            defaults: new { controller = "Home", action = "TinTuc" }
         );

            routes.MapRoute(
                 name: "DanhSachBaiVietTheoMuc",
                 url: "danh-sach-bai-viet/{id}",
                 defaults: new { controller = "Home", action = "DanhSachBaiViet", mucId = UrlParameter.Optional }
             );


            routes.MapRoute(
                name: "BaiViet",
                url: "bai-viet/{id}",
                defaults: new { controller = "BaiViet", action = "XemNoiDung", id = UrlParameter.Optional }
            );


            routes.MapRoute(
                name: "Default",
                url: "{controller}/{action}/{id}",
                defaults: new { controller = "Home", action = "Index", id = UrlParameter.Optional }
            );
        }
    }
}
