using ProjectTinTucBan.Models;
using System;
using System.IO;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using System.Web;
using System.Web.Http;
using System.Data.Entity;

namespace ProjectTinTucBan.Areas.Admin.Controllers
{
    [RoutePrefix("api/v1/admin")]
    public class BaiVietAPIController : ApiController
    {
        WebTinTucTDMUEntities db = new WebTinTucTDMUEntities();
        [HttpPost]
        [Route("increase-views/{id:int}")]

        public IHttpActionResult IncreaseViews(int id)
        {
            var bv = db.BaiViets.Find(id);
            if (bv == null) return NotFound();

            bv.ViewCount = (bv.ViewCount ?? 0) + 1;
            db.SaveChanges();

            return Ok(new { success = true, viewCount = bv.ViewCount });
        }
        // GET: Lấy tất cả bài viết
        [HttpGet]
        [Route("get-all-baiviet")]
        public async Task<IHttpActionResult> GetAllBaiViet()
        {
            var data = await db.BaiViets
                .OrderByDescending(x => x.ID)
                .Select(x => new
                {
                    x.ID,
                    x.TieuDe,
                    x.NoiDung,
                    x.LinkThumbnail,
                    x.LinkPDF,
                    x.NgayDang,
                    x.NgayCapNhat,
                    x.ViewCount
                })
                .ToListAsync();

            return Ok(new { data, success = true });
        }

        // GET: Lấy bài viết theo ID
        [HttpGet]
        [Route("get-baiviet-by-id/{id}")]
        public async Task<IHttpActionResult> GetBaiVietById(int id)
        {
            var baiViet = await db.BaiViets
                .Include(b => b.MucLuc)
                .FirstOrDefaultAsync(b => b.ID == id);

            if (baiViet == null)
                return NotFound();

            var baiVietsCungMuc = await db.BaiViets
                .Where(b => b.ID_MucLuc == baiViet.ID_MucLuc && b.ID != id)
                .OrderByDescending(b => b.NgayDang)
                .Select(b => new
                {
                    b.ID,
                    b.TieuDe
                })
                .ToListAsync();

            return Ok(new
            {
                success = true,
                data = new
                {
                    baiViet.ID,
                    baiViet.TieuDe,
                    baiViet.NoiDung,
                    baiViet.LinkThumbnail,
                    baiViet.LinkPDF,
                    baiViet.NgayDang,
                    baiViet.NgayCapNhat,
                    baiViet.ViewCount,
                    TenMucLuc = baiViet.MucLuc?.TenMucLuc ?? "Không rõ",
                    BaiVietsCungMuc = baiVietsCungMuc
                }
            });
        }


        // POST: Thêm bài viết
        [HttpPost]
        [Route("them-baiviet")]
        public async Task<IHttpActionResult> ThemBaiViet([FromBody] BaiViet model)
        {
            if (model == null || string.IsNullOrWhiteSpace(model.TieuDe))
                return Content(HttpStatusCode.BadRequest, new { success = false, message = "Dữ liệu không hợp lệ." });

            try
            {
                int currentDate = int.Parse(DateTime.Now.ToString("yyyyMMdd"));

                model.NgayDang = currentDate;
                model.NgayCapNhat = currentDate;
                model.ViewCount = 0;

                db.BaiViets.Add(model);
                await db.SaveChangesAsync();

                return Ok(new { success = true, message = "Thêm bài viết thành công.", data = model });
            }
            catch (Exception ex)
            {
                return Content(HttpStatusCode.InternalServerError, new
                {
                    success = false,
                    message = "Lỗi khi thêm bài viết.",
                    error = ex.Message
                });
            }
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

            existing.TieuDe = updatedBaiViet.TieuDe;
            existing.NoiDung = updatedBaiViet.NoiDung;
            existing.LinkThumbnail = updatedBaiViet.LinkThumbnail;
            existing.LinkPDF = updatedBaiViet.LinkPDF;
            existing.NgayCapNhat = int.Parse(DateTime.Now.ToString("yyyyMMdd"));

            await db.SaveChangesAsync();

            return Ok(new { success = true, message = "Cập nhật bài viết thành công." });
        }

        // DELETE: Xóa bài viết
        [HttpDelete]
        [Route("xoa-baiviet/{id:int}")]
        public async Task<IHttpActionResult> XoaBaiViet(int id)
        {
            try
            {
                var baiViet = await db.BaiViets.FindAsync(id);
                if (baiViet == null)
                    return Content(HttpStatusCode.NotFound, new { success = false, message = "Không tìm thấy bài viết." });

                db.BaiViets.Remove(baiViet);
                await db.SaveChangesAsync();

                return Ok(new { success = true, message = "Xóa bài viết thành công." });
            }
            catch (Exception ex)
            {
                return Content(HttpStatusCode.InternalServerError, new
                {
                    success = false,
                    message = "Lỗi trong quá trình xóa.",
                    error = ex.Message
                });
            }
        }

        // PUT: Cập nhật chỉ nội dung bài viết
        [HttpPut]
        [Route("update-noidung/{id}")]
        public async Task<IHttpActionResult> UpdateNoiDung(int id, [FromBody] dynamic body)
        {
            if (body == null || body.noiDung == null)
                return BadRequest("Nội dung không được để trống.");

            var baiViet = await db.BaiViets.FindAsync(id);
            if (baiViet == null)
                return NotFound();

            try
            {
                baiViet.NoiDung = (string)body.noiDung;
                baiViet.NgayCapNhat = int.Parse(DateTime.Now.ToString("yyyyMMdd"));

                await db.SaveChangesAsync();

                return Ok(new { success = true, message = "Cập nhật nội dung thành công." });
            }
            catch (Exception ex)
            {
                return Content(HttpStatusCode.InternalServerError, new
                {
                    success = false,
                    message = "Lỗi khi cập nhật nội dung.",
                    error = ex.Message
                });
            }
        }

        // GET: Lấy danh sách ảnh từ thư viện
        [HttpGet]
        [Route("thu-vien-anh")]
        public IHttpActionResult GetThuVienAnh()
        {
            try
            {
                string folderPath = HttpContext.Current.Server.MapPath("~/Uploads/Thumbnails/");
                string baseUrl = $"{Request.RequestUri.Scheme}://{Request.RequestUri.Authority}/Uploads/Thumbnails";

                if (!Directory.Exists(folderPath))
                    return Ok(new { success = true, data = new string[0] });

                // Lấy file và gom nhóm theo tên gốc (bỏ timestamp)
                var grouped = Directory.GetFiles(folderPath)
                    .Where(file => new[] { ".jpg", ".jpeg", ".png", ".gif", ".bmp" }
                        .Contains(Path.GetExtension(file).ToLower()))
                    .GroupBy(file =>
                    {
                        // Bỏ timestamp phía sau (nếu có dạng _yyyyMMddHHmmss)
                        var fileName = Path.GetFileNameWithoutExtension(file);
                        var baseName = fileName;
                        int idx = fileName.LastIndexOf('_');
                        if (idx != -1 && fileName.Length - idx >= 15) // có thể là timestamp
                            baseName = fileName.Substring(0, idx);
                        return baseName.ToLower(); // group key
                    })
                    .Select(g => g.OrderByDescending(f => f).First()) // chọn ảnh mới nhất mỗi nhóm
                    .Select(file => $"{baseUrl}/{Path.GetFileName(file)}")
                    .ToList();

                return Ok(new { success = true, data = grouped });
            }
            catch (Exception ex)
            {
                return Content(HttpStatusCode.InternalServerError, new
                {
                    success = false,
                    message = "Không thể tải thư viện ảnh.",
                    error = ex.Message
                });
            }
        }
    }
}
