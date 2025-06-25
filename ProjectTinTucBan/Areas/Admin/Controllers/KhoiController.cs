using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Linq;
using System.Net;
using System.Web.Http;
using ProjectTinTucBan.Models;

namespace ProjectTinTucBan.Controllers.Api
{
    public class KhoiController : ApiController
    {
        private WebTinTucTDMUEntities db = new WebTinTucTDMUEntities();

        // GET: api/Khoi
        public IEnumerable<Khoi> GetKhois()
        {
            return db.Khois.ToList();
        }

        // GET: api/Khoi/5
        public IHttpActionResult GetKhoi(int id)
        {
            var khoi = db.Khois.Find(id);
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
        public IHttpActionResult PostKhoi(Khoi khoi)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var now = GetUnixTimestamp();
            khoi.NgayDang = now;
            khoi.NgayCapNhat = now;

            db.Khois.Add(khoi);
            db.SaveChanges();
            return CreatedAtRoute("DefaultApi", new { id = khoi.ID }, khoi);
        }

        // PUT: api/Khoi/5
        public IHttpActionResult PutKhoi(int id, Khoi khoi)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);
            if (id != khoi.ID && khoi.ID != 0)
                return BadRequest();

            var existing = db.Khois.Find(id);
            if (existing == null)
                return NotFound();

            existing.TenKhoi = khoi.TenKhoi;
            existing.ThuTuShow = khoi.ThuTuShow;
            existing.NgayCapNhat = GetUnixTimestamp();

            db.Entry(existing).State = EntityState.Modified;
            db.SaveChanges();
            return StatusCode(HttpStatusCode.NoContent);
        }

        // DELETE: api/Khoi/5
        public IHttpActionResult DeleteKhoi(int id)
        {
            var khoi = db.Khois.Find(id);
            if (khoi == null)
                return NotFound();

            db.Khois.Remove(khoi);
            db.SaveChanges();
            return Ok(khoi);
        }
    }
}