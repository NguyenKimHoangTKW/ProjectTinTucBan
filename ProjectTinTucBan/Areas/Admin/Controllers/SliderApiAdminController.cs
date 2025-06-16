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
                // Update the folder path to Areas/Admin/Uploads/Slider
                var folderPath = HttpContext.Current.Server.MapPath("~/Areas/Admin/Uploads/Slider/");
                if (!Directory.Exists(folderPath))
                    Directory.CreateDirectory(folderPath);
                var filePath = Path.Combine(folderPath, newFileName);
                var buffer = await file.ReadAsByteArrayAsync();
                File.WriteAllBytes(filePath, buffer);
                // Update the link to match the new path
                var link = "/Areas/Admin/Uploads/Slider/" + newFileName;
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

        [HttpGet]
        [Route("get-slides-show")]
        public async Task<IHttpActionResult> GetSlidesShow()
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
                .Where(s => s.isActive == true)
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


        // Thay đổi thứ tự hiển thị của slide
        public class ChangeOrderRequest
        {
            public int id { get; set; }
            public string direction { get; set; }
        }

        [HttpPost]
        [Route("change-slide-order")]
        public async Task<IHttpActionResult> ChangeSlideOrder([FromBody] ChangeOrderRequest req)
        {
            if (req == null || req.id <= 0 || string.IsNullOrEmpty(req.direction))
                return BadRequest("Dữ liệu không hợp lệ.");

            var slide = await db.Sliders.FindAsync(req.id);
            if (slide == null)
                return NotFound();

            Slider swapSlide = null;
            if (req.direction == "up")
            {
                swapSlide = db.Sliders
                    .Where(s => s.ThuTuShow < slide.ThuTuShow)
                    .OrderByDescending(s => s.ThuTuShow)
                    .FirstOrDefault();
            }
            else if (req.direction == "down")
            {
                swapSlide = db.Sliders
                    .Where(s => s.ThuTuShow > slide.ThuTuShow)
                    .OrderBy(s => s.ThuTuShow)
                    .FirstOrDefault();
            }

            if (swapSlide == null)
                return Ok(new { success = false, message = "Không thể thay đổi thứ tự." });

            // Hoán đổi thứ tự
            int temp = slide.ThuTuShow ?? 0;
            slide.ThuTuShow = swapSlide.ThuTuShow;
            swapSlide.ThuTuShow = temp;

            await db.SaveChangesAsync();
            return Ok(new { success = true });
        }

        // Đặt trạng thái hoạt động của slide
        public class SetSlideActiveRequest
        {
            public int id { get; set; }
            public bool isActive { get; set; }
        }

        [HttpPost]
        [Route("set-slide-active")]
        public async Task<IHttpActionResult> SetSlideActive(SetSlideActiveRequest req)
        {
            if (req == null || req.id <= 0)
                return BadRequest("Dữ liệu không hợp lệ.");

            var slide = await db.Sliders.FindAsync(req.id);
            if (slide == null)
                return NotFound();

            slide.isActive = req.isActive;
            slide.NgayCapNhat = unixTimestamp;
            await db.SaveChangesAsync();

            return Ok(new { success = true, message = "Cập nhật trạng thái thành công." });
        }

        
    }
}
