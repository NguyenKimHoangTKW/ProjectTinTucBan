using ProjectTinTucBan.Models;
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
        public ActionResult XemNoiDung(int id)
        {
            using (var db = new WebTinTucTDMUEntities())
            {
                var baiViet = db.BaiViets.Find(id);
                if (baiViet == null)
                {
                    return HttpNotFound();
                }

                return View("XemNoiDung", baiViet); // View nằm trong Views/InterfaceAdmin/
            }
        }

    }
}