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
        // Gọi hàm thiết kế giao diện Quản lý mục lục
        public ActionResult Index_MucLuc_Admin()
        {
            return View();
        }
        // Gọi hàm thiết kế giao diện thêm mục lục
        public ActionResult Index_AddMucLuc_Admin()
        {
            return View();
        }
        // Gọi hàm thiết kế giao diện sửa mục lục
        public ActionResult Index_EditMucLuc_Admin()
        {
            return View();
        }
    }
}  