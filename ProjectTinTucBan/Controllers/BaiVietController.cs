using ProjectTinTucBan.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web.Mvc;
using System.Data.Entity; // Để dùng .Include()

namespace ProjectTinTucBan.Controllers
{
    public class BaiVietController : Controller
    {
        private WebTinTucTDMUEntities db = new WebTinTucTDMUEntities();

        // GET: BaiViet/Index
        public ActionResult Index()
        {
            var allBaiViets = db.BaiViets
                .OrderByDescending(b => b.NgayDang)
                .ToList();

            return View(allBaiViets);
        }

        // GET: Bài viết theo mục lục
        [Route("muc-luc/{id:int}")]
        public ActionResult BaiVietTheoMuc(int id)
        {
            var mucLuc = db.MucLucs.Find(id);
            if (mucLuc == null)
                return HttpNotFound("Không tìm thấy mục lục.");

            var baiViets = db.BaiViets
                .Where(b => b.ID_MucLuc == id)
                .OrderByDescending(b => b.NgayDang)
                .ToList();

            ViewBag.TenMucLuc = mucLuc.TenMucLuc;
            return View("BaiVietTheoMuc", baiViets);
        }

        // GET: Chi tiết bài viết
        public ActionResult XemNoiDung(int id)
        {
            // ✅ Dùng Include để lấy thêm thông tin Mục Lục
            var baiViet = db.BaiViets
                .Include(b => b.MucLuc)
                .FirstOrDefault(b => b.ID == id);

            if (baiViet == null)
                return HttpNotFound("Không tìm thấy bài viết.");

            // Tăng lượt xem
            baiViet.ViewCount = (baiViet.ViewCount ?? 0) + 1;
            db.SaveChanges();

            // ✅ Đưa tên mục lục vào ViewBag (để hiển thị ở giao diện)
            ViewBag.TenMucLuc = baiViet.MucLuc?.TenMucLuc ?? "Không rõ";

            return View("XemNoiDung", baiViet);
        }
    }
}
