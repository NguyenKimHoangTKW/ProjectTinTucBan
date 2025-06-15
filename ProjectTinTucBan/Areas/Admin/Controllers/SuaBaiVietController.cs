using ProjectTinTucBan.Models;
using System;
using System.Linq;
using System.Threading.Tasks;
using System.Web.Http;
using System.Data.Entity;

namespace ProjectTinTucBan.Areas.Admin.Controllers
{
    [RoutePrefix("api/v1/admin")]
    public class SuaBaiVietAPIController : ApiController
    {
        WebTinTucTDMUEntities db = new WebTinTucTDMUEntities();

        // GET: Lấy chi tiết bài viết theo ID
        [HttpGet]
        [Route("get-baiviet-by-id/{id}")]
        public async Task<IHttpActionResult> GetBaiVietById(int id)
        {
            var baiViet = await db.BaiViets.FindAsync(id);
            if (baiViet == null)
                return NotFound();

            return Ok(new
            {
                data = new
                {
                    baiViet.ID,
                    baiViet.TieuDe,
                    baiViet.NoiDung,
                    baiViet.LinkThumbnail,
                    baiViet.LinkPDF,
                    baiViet.NgayDang,
                    baiViet.NgayCapNhat,
                    baiViet.ViewCount
                },
                success = true
            });
        }

        // PUT: Cập nhật bài viết
        [HttpPut]
        [Route("update-baiviet/{id}")]
        public async Task<IHttpActionResult> UpdateBaiViet(int id, [FromBody] BaiViet updatedBaiViet)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var existing = await db.BaiViets.FindAsync(id);
            if (existing == null)
                return NotFound();

            // Cập nhật thông tin
            existing.TieuDe = updatedBaiViet.TieuDe;
            existing.NoiDung = updatedBaiViet.NoiDung;
            existing.LinkThumbnail = updatedBaiViet.LinkThumbnail;
            existing.LinkPDF = updatedBaiViet.LinkPDF;

            // Chuyển DateTime thành int yyyyMMdd
            existing.NgayCapNhat = int.Parse(DateTime.Now.ToString("yyyyMMdd"));

            await db.SaveChangesAsync();

            return Ok(new { message = "Cập nhật bài viết thành công", success = true });
        }
    }
}
