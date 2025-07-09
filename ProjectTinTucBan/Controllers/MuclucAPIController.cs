using ProjectTinTucBan.Models;
using System;
using System.Data.Entity;
using System.Linq;
using System.Web.Http;

namespace ProjectTinTucBan.ApiControllers
{
    [RoutePrefix("api/v1/home")]
    public class MuclucAPIController : ApiController
    {
        private WebTinTucTDMUEntities db = new WebTinTucTDMUEntities();

        [HttpGet]
        [Route("get-slider")]
        public IHttpActionResult GetSlider()
        {
            var sliders = db.Sliders
                .Where(s => s.isActive == true)
                .OrderBy(s => s.ThuTuShow)
                .Select(s => new
                {
                    s.ID,
                    s.LinkHinh
                }).ToList();

            return Ok(sliders);
        }

        [HttpGet]
        [Route("get-baiviet-by-id/{id:int}")]
        public IHttpActionResult GetBaiVietById(int id)
        {
            var baiViet = db.BaiViets
                .Include(b => b.MucLuc)
                .FirstOrDefault(b => b.ID == id);

            if (baiViet == null)
                return NotFound();

            return Ok(new
            {
                success = true,
                data = new
                {
                    baiViet.ID,
                    baiViet.TieuDe,
                    baiViet.NoiDung,
                    baiViet.NgayDang,
                    baiViet.LinkThumbnail,
                    TenMucLuc = baiViet.MucLuc?.TenMucLuc ?? "Không rõ"
                }
            });
        }

        [HttpGet]
        [Route("get-mucluc-with-baiviet")]
        public IHttpActionResult GetMucLucWithBaiViet()
        {
            var mucLucList = db.MucLucs
                .Where(m => m.IsActive == true)
                .OrderBy(m => m.ThuTuShow)
                .Include(m => m.BaiViets)
                .ToList();

            var result = mucLucList.Select(m => new
            {
                m.ID,
                m.TenMucLuc,
                m.Link,
                BaiViets = m.BaiViets
                .Where(b => b.ID_MucLuc == m.ID)
                .OrderByDescending(b => b.NgayDang)
                .Select(b => new
                {
                    b.ID,
                    b.TieuDe,
                    NgayDang = b.NgayDang ?? 0, // ✅ sửa tại đây
                    LinkThumbnail = string.IsNullOrWhiteSpace(b.LinkThumbnail)
                        ? "https://th.bing.com/th/id/OIP.FkEdh0U5AttOx7kx74Y6sQAAAA?w=460&h=460&rs=1&pid=ImgDetMain"
                        : b.LinkThumbnail.Trim(),
                    b.LinkPDF,
                    LuotXem = b.ViewCount ?? 0,
                    MoTa = string.IsNullOrWhiteSpace(b.NoiDung)
                        ? ""
                        : (b.NoiDung.Length > 150 ? b.NoiDung.Substring(0, 150) + "..." : b.NoiDung),
                    TenMucLuc = m.TenMucLuc
                }).ToList()

            }).ToList();

            return Ok(new { success = true, data = result });
        }

        protected override void Dispose(bool disposing)
        {
            if (disposing)
                db.Dispose();
            base.Dispose(disposing);
        }
    }
}
