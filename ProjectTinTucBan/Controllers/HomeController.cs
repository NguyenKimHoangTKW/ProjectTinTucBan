using ProjectTinTucBan.Models;
using System.Data.Entity;
using System.Linq;
using System.Web.Mvc;

namespace ProjectTinTucBan.Controllers
{
    public class HomeController : Controller
    {
        private WebTinTucTDMUEntities db = new WebTinTucTDMUEntities();

        // Trang chủ
        public ActionResult Index()
        {
            return View(); // ~/Views/Home/Index.cshtml
        }
        public ActionResult TinTuc()
        {
            return View();
        }
        [Route("danh-sach-bai-viet")]
        public ActionResult DanhSachBaiViet(int mucId, string slug)
        {
            var muc = db.MucLucs.FirstOrDefault(m => m.ID == mucId);
            if (muc == null)
                return HttpNotFound();

            ViewBag.MucId = mucId;
            ViewBag.Slug = slug;
            ViewBag.TenMucLuc = muc.TenMucLuc; // ✅ Gán tên có dấu cho View hiển thị

            return View();
        }


        // Chi tiết bài viết
        [Route("noi-dung/{id:int}")]
        public ActionResult XemNoiDung(int id)
        {
            var baiViet = db.BaiViets
                            .Include(b => b.MucLuc)
                            .FirstOrDefault(b => b.ID == id);

            if (baiViet == null)
            {
                return HttpNotFound("Không tìm thấy bài viết.");
            }

            // ❌ Bỏ tăng view tại đây để JavaScript sau 30s mới tăng
            // baiViet.ViewCount = (baiViet.ViewCount ?? 0) + 1;
            // db.SaveChanges();

            return View("XemNoiDung", baiViet);
        }}
}
