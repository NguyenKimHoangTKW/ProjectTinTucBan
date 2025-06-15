using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using ProjectTinTucBan.Models;
using System.Data.Entity;
using System.Net.Http;
using System.Threading.Tasks;
using Newtonsoft.Json;

namespace ProjectTinTucBan.Areas.Admin.Controllers
{

    public class InterfaceAdminController : Controller
    {
        private WebTinTucTDMUEntities db = new WebTinTucTDMUEntities();

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
        // Gọi hàm thiết kế giao diện quản lý quyền Admin
        public ActionResult Index_Roles_Admin()
        {
            return View();
        }

        public ActionResult Menu()
        {
            return View();
        }
        public ActionResult Slider()
        {
            return View();
        }
        public ActionResult BaiViet()
        {
            return View();
        }
        public ActionResult ThemBaiViet()
        {
            return View();
        }
        public ActionResult SuaBaiViet()
        {
            return View();
        }
        public ActionResult XoaBaiViet()
        {
            return View();
        }
    }
}  