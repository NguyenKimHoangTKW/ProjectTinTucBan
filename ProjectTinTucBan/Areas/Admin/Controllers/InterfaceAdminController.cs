using System;
using System.Linq;
using System.Web.Mvc;
using System.Security.Claims;
using System.Threading.Tasks;
using System.Web;
using Microsoft.AspNet.Identity;
using Microsoft.AspNet.Identity.Owin;
using Microsoft.Owin.Security;
using ProjectTinTucBan.Models;
using Microsoft.Owin.Security.Cookies;
// Quan trọng: Using models
using System.Data.Entity; // Thêm using này cho Include
using System.Collections.Generic; // << --- THÊM DÒNG NÀY ---

namespace ProjectTinTucBan.Areas.Admin.Controllers
{
    public class InterfaceAdminController : Controller
    {
        // Controller này có thể để trống hoặc xóa đi nếu tất cả chức năng đã được chuyển.
        // Nếu bạn vẫn muốn giữ lại controller này cho các mục đích khác (không liên quan đến các action đã chuyển),
        // thì chỉ cần xóa các action đã được chuyển đi.

        // Ví dụ, nếu không còn action nào:
        // public ActionResult Index()
        // {
        //     // Có thể redirect đến API/Index hoặc trả về một view thông báo
        //     return RedirectToAction("Index", "API");
        // }
    }
}
