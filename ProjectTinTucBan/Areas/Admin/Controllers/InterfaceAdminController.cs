using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace ProjectTinTucBan.Areas.Admin.Controllers
{
    public class InterfaceAdminController : Controller
    {
        // Gọi hàm thiết kế giao diện tại đây
        public ActionResult Index()
        {
            return View();
        }
        public ActionResult BaiViet()
        {
            return View();
        }
    }
}