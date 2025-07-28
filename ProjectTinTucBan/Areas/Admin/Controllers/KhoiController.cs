using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Linq;
using System.Net;
using System.Web.Http;
using ProjectTinTucBan.Models;

namespace ProjectTinTucBan.Controllers.Api
{
    [RoutePrefix("api/v1/admin/khoi")]
    public class KhoiController : ApiController
    {
        private WebTinTucTDMUEntities db = new WebTinTucTDMUEntities();

        // GET: api/v1/admin/khoi/get-all
        [HttpGet]
        [Route("get-all")]
        public IHttpActionResult Get()
        {
            var khois = db.Khois.Select(k => new
            {
                id = k.ID,
                tenKhoi = k.TenKhoi,
                thuTuShow = k.ThuTuShow,
                ngayDang = k.NgayDang,
                ngayCapNhat = k.NgayCapNhat,
                isActive = k.IsActive == 1
            }).ToList();
            return Ok(khois);
        }

        // GET: api/v1/admin/khoi/get/{id}
        [HttpGet]
        [Route("get/{id}")]
        public IHttpActionResult Get(int id)
        {
            var khoi = db.Khois.Where(k => k.ID == id)
                .Select(k => new
                {
                    id = k.ID,
                    tenKhoi = k.TenKhoi,
                    thuTuShow = k.ThuTuShow,
                    ngayDang = k.NgayDang,
                    ngayCapNhat = k.NgayCapNhat,
                    isActive = k.IsActive == 1
                })
                .FirstOrDefault();
            if (khoi == null)
                return NotFound();
            return Ok(khoi);
        }

        private int GetUnixTimestamp()
        {
            return (int)(DateTime.UtcNow - new DateTime(1970, 1, 1)).TotalSeconds;
        }

        // POST: api/v1/admin/khoi/create
        [HttpPost]
        [Route("create")]
        public IHttpActionResult Post([FromBody] Khoi khoi)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            khoi.NgayDang = khoi.NgayCapNhat = GetUnixTimestamp();
            db.Khois.Add(khoi);
            db.SaveChanges();
            return Ok(new
            {
                id = khoi.ID,
                tenKhoi = khoi.TenKhoi,
                thuTuShow = khoi.ThuTuShow,
                ngayDang = khoi.NgayDang,
                ngayCapNhat = khoi.NgayCapNhat,
                isActive = khoi.IsActive == 1
            });
        }

        // PUT: api/v1/admin/khoi/update/{id}
        [HttpPut]
        [Route("update/{id}")]
        public IHttpActionResult Put(int id, [FromBody] Khoi khoi)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var existing = db.Khois.Find(id);
            if (existing == null)
                return NotFound();

            existing.TenKhoi = khoi.TenKhoi;
            existing.ThuTuShow = khoi.ThuTuShow;
            existing.NgayCapNhat = GetUnixTimestamp();
            db.SaveChanges();
            return Ok(new
            {
                id = existing.ID,
                tenKhoi = existing.TenKhoi,
                thuTuShow = existing.ThuTuShow,
                ngayDang = existing.NgayDang,
                ngayCapNhat = existing.NgayCapNhat,
                isActive = existing.IsActive == 1
            });
        }

        // PUT: api/v1/admin/khoi/toggle-trang-thai/{id}
        [HttpPut]
        [Route("toggle-trang-thai/{id}")]
        public IHttpActionResult ToggleTrangThai(int id, [FromBody] ToggleTrangThaiModel model)
        {
            var khoi = db.Khois.Find(id);
            if (khoi == null)
                return NotFound();

            khoi.IsActive = model.IsActive ? 1 : 0;
            khoi.NgayCapNhat = GetUnixTimestamp();
            db.SaveChanges();
            return Ok();
        }

        public class ToggleTrangThaiModel
        {
            public bool IsActive { get; set; }
        }

        // DELETE: api/v1/admin/khoi/delete/{id}
        [HttpDelete]
        [Route("delete/{id}")]
        public IHttpActionResult Delete(int id)
        {
            var khoi = db.Khois.Find(id);
            if (khoi == null)
                return NotFound();

            db.Khois.Remove(khoi);
            db.SaveChanges();
            return Ok();
        }

        private void HandleError(Exception ex)
        {
            var errorMessage = ex.Message ?? "Không thể lưu dữ liệu.";
        }
    }
}