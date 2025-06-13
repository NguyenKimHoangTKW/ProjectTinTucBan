using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using System.Data.Entity;
using System.Threading.Tasks;
using ProjectTinTucBan.Models;
using System.IO;
using System.Web;

namespace ProjectTinTucBan.Areas.Admin.Controllers
{
    [RoutePrefix("api/v1/admin")]
    public class SliderApiAdminController : ApiController
    {
        WebTinTucTDMUEntities db = new WebTinTucTDMUEntities();
        private int unixTimestamp;
        public SliderApiAdminController()
        {
            DateTime now = DateTime.UtcNow;
            unixTimestamp = (int)(now.Subtract(new DateTime(1970, 1, 1))).TotalSeconds;
        }

        // Upload hình ảnh cho slide
        [HttpPost]
        [Route("upload-slide-image")]
        public async Task<IHttpActionResult> UploadSlideImage()
        {
            if (!Request.Content.IsMimeMultipartContent())
                return BadRequest("Unsupported media type.");

            var provider = new MultipartMemoryStreamProvider();
            await Request.Content.ReadAsMultipartAsync(provider);

            foreach (var file in provider.Contents)
            {
                var filename = file.Headers.ContentDisposition.FileName.Trim('\"');
                var ext = Path.GetExtension(filename);
                var newFileName = Guid.NewGuid() + ext;
                var folderPath = HttpContext.Current.Server.MapPath("~/Uploads/Slider/");
                if (!Directory.Exists(folderPath))
                    Directory.CreateDirectory(folderPath);
                var filePath = Path.Combine(folderPath, newFileName);
                var buffer = await file.ReadAsByteArrayAsync();
                File.WriteAllBytes(filePath, buffer);
                var link = "/Uploads/Slider/" + newFileName;
                return Ok(new { success = true, link });
            }
            return BadRequest("No file uploaded.");
        }

        // Lấy danh sách slide
        [HttpGet]
        [Route("get-slides")]
        public async Task<IHttpActionResult> GetSlides()
        {
            var slides = await db.Sliders
                .OrderBy(s => s.ThuTuShow)
                .Select(s => new
                {
                    s.ID,
                    s.LinkHinh,
                    s.ThuTuShow,
                    s.isActive
                })
                .ToListAsync();

            return Ok(slides);
        }

        // Thêm slide mới
        [HttpPost]
        [Route("add-slide")]
        public async Task<IHttpActionResult> AddSlide([FromBody] Slider slide)
        {
            if (slide == null || string.IsNullOrWhiteSpace(slide.LinkHinh))
                return BadRequest("Dữ liệu không hợp lệ hoặc thiếu LinkHinh.");

            slide.NgayDang = unixTimestamp;
            slide.NgayCapNhat = unixTimestamp;
            db.Sliders.Add(slide);
            await db.SaveChangesAsync();
            return Ok(new { success = true, message = "Thêm slide thành công." });
        }

        // Sửa slide
        [HttpPost]
        [Route("edit-slide")]
        public async Task<IHttpActionResult> EditSlide([FromBody] Slider slide)
        {
            if (slide == null || slide.ID <= 0)
                return BadRequest("Dữ liệu không hợp lệ.");

            var existing = await db.Sliders.FindAsync(slide.ID);
            if (existing == null)
                return NotFound();

            if (!string.IsNullOrWhiteSpace(slide.LinkHinh))
                existing.LinkHinh = slide.LinkHinh;
            existing.ThuTuShow = slide.ThuTuShow;
            existing.isActive = slide.isActive;
            existing.NgayCapNhat = unixTimestamp;

            await db.SaveChangesAsync();
            return Ok(new { success = true, message = "Cập nhật slide thành công." });
        }

        // Xóa slide
        [HttpPost]
        [Route("delete-slide")]
        public async Task<IHttpActionResult> DeleteSlide([FromBody] int id)
        {
            var slide = await db.Sliders.FindAsync(id);
            if (slide == null)
                return Ok(new { success = false, message = "Không tìm thấy slide." });

            db.Sliders.Remove(slide);
            await db.SaveChangesAsync();
            return Ok(new { success = true, message = "Xóa slide thành công." });
        }
    }
}
