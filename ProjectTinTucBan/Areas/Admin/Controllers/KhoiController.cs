using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Linq;
using System.Net;
using System.Web.Http;
using ProjectTinTucBan.Models;

namespace ProjectTinTucBan.Controllers.Api
{
    [RoutePrefix("api/Khoi")]
    public class KhoiController : ApiController
    {
        private WebTinTucTDMUEntities db = new WebTinTucTDMUEntities();

        // GET: api/Khoi
        [HttpGet]
        [Route("")]
        public IHttpActionResult Get()
        {
            var khois = db.Khois.Select(k => new
            {
                id = k.ID,
                tenKhoi = k.TenKhoi,
                thuTuShow = k.ThuTuShow,
                ngayDang = k.NgayDang,
                ngayCapNhat = k.NgayCapNhat
            }).ToList();
            return Ok(khois);
        }

        // GET: api/Khoi/5
        [HttpGet]
        [Route("{id:int}")]
        public IHttpActionResult Get(int id)
        {
            var khoi = db.Khois.Where(k => k.ID == id)
                .Select(k => new
                {
                    id = k.ID,
                    tenKhoi = k.TenKhoi,
                    thuTuShow = k.ThuTuShow,
                    ngayDang = k.NgayDang,
                    ngayCapNhat = k.NgayCapNhat
                })
                .FirstOrDefault();
            if (khoi == null)
                return NotFound();
            return Ok(khoi);
        }

        // Hàm tạo Unix Timestamp tương thích với .NET Framework 4.7.2
        private int GetUnixTimestamp()
        {
            return (int)(DateTime.UtcNow - new DateTime(1970, 1, 1)).TotalSeconds;
        }

        // POST: api/Khoi
        [HttpPost]
        [Route("")]
        public IHttpActionResult Post([FromBody] Khoi khoi)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // Kiểm tra trùng thứ tự
            bool isDuplicate = db.Khois.Any(x => x.ThuTuShow == khoi.ThuTuShow);
            if (isDuplicate)
                return BadRequest("Thứ tự đã tồn tại, vui lòng chọn giá trị khác.");

            khoi.NgayDang = khoi.NgayCapNhat = (int)(DateTime.UtcNow - new DateTime(1970, 1, 1)).TotalSeconds;
            db.Khois.Add(khoi);
            db.SaveChanges();
            return Ok(new
            {
                id = khoi.ID,
                tenKhoi = khoi.TenKhoi,
                thuTuShow = khoi.ThuTuShow,
                ngayDang = khoi.NgayDang,
                ngayCapNhat = khoi.NgayCapNhat
            });
        }

        // PUT: api/Khoi/5
        [HttpPut]
        [Route("{id:int}")]
        public IHttpActionResult Put(int id, [FromBody] Khoi khoi)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var existing = db.Khois.Find(id);
            if (existing == null)
                return NotFound();

            // Kiểm tra trùng thứ tự (loại trừ chính bản ghi đang sửa)
            bool isDuplicate = db.Khois.Any(x => x.ThuTuShow == khoi.ThuTuShow && x.ID != id);
            if (isDuplicate)
                return BadRequest("Thứ tự đã tồn tại, vui lòng chọn giá trị khác.");

            existing.TenKhoi = khoi.TenKhoi;
            existing.ThuTuShow = khoi.ThuTuShow;
            existing.NgayCapNhat = (int)(DateTime.UtcNow - new DateTime(1970, 1, 1)).TotalSeconds;
            db.SaveChanges();
            return Ok(new
            {
                id = existing.ID,
                tenKhoi = existing.TenKhoi,
                thuTuShow = existing.ThuTuShow,
                ngayDang = existing.NgayDang,
                ngayCapNhat = existing.NgayCapNhat
            });
        }

        // DELETE: api/Khoi/5
        [HttpDelete]
        [Route("{id:int}")]
        public IHttpActionResult Delete(int id)
        {
            var khoi = db.Khois.Find(id);
            if (khoi == null)
                return NotFound();

            db.Khois.Remove(khoi);
            db.SaveChanges();
            return Ok();
        }

        // Error handling function
        private void HandleError(Exception ex)
        {
            var errorMessage = ex.Message ?? "Không thể lưu dữ liệu.";
       
        }
    }
}