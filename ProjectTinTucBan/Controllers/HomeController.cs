using ProjectTinTucBan.Helper;
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

        [HttpGet]
        [Route("api/v1/home/get-khoi-va-donvi")]
        public JsonResult GetKhoiVaDonVi()
        {
            var result = db.Khois
                .Where(k => k.IsActive == 1)
                .Select(k => new
                {
                    k.ID,
                    k.TenKhoi,
                    DonVis = db.DonViTrucThuocs
                        .Where(d => d.ID_Khoi == k.ID && d.IsActive == 1)
                        .OrderBy(d => d.ThuTuShow)
                        .Select(d => new
                        {
                            d.ID,
                            d.TenDonVi,
                            d.Link
                        }).ToList()
                })
                .OrderBy(k => k.TenKhoi)
                .ToList();

            return Json(new
            {
                success = true,
                data = result
            }, JsonRequestBehavior.AllowGet);
        }

        // Chi tiết bài viết
        [Route("noi-dung/{id}")]
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
        }

        // Gọi hàm thiết kế giao diện đăng nhập
        public ActionResult Login()
        {
            if (SessionHelper.IsUserLoggedIn())
            {
                return Redirect("~/Admin/InterfaceAdmin/Index");
            }

            return View();
        }
    }
}