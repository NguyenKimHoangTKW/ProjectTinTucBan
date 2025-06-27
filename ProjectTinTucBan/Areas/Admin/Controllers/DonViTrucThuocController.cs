using System.Linq;
using System.Web.Http;
using ProjectTinTucBan.Models;

namespace ProjectTinTucBan.Areas.Admin.Controllers
{
    [RoutePrefix("api/Admin/DonViTrucThuoc")]
    public class DonViTrucThuocController : ApiController
    {
        private WebTinTucTDMUEntities db = new WebTinTucTDMUEntities();

        [HttpGet]
        [Route("")]
        public IHttpActionResult Get()
        {
            var list = db.DonViTrucThuocs
                .Select(d => new
                {
                    id = d.ID,
                    idKhoi = d.ID_Khoi,
                    tenDonVi = d.TenDonVi,
                    thuTuShow = d.ThuTuShow,
                    link = d.Link,
                    ngayDang = d.NgayDang,
                    ngayCapNhat = d.NgayCapNhat
                }).ToList();
            return Ok(list);
        }

        [HttpGet]
        [Route("ByKhoi/{idKhoi:int}")]
        public IHttpActionResult GetByKhoi(int idKhoi)
        {
            var list = db.DonViTrucThuocs
                .Where(d => d.ID_Khoi == idKhoi)
                .Select(d => new
                {
                    id = d.ID,
                    idKhoi = d.ID_Khoi,
                    tenDonVi = d.TenDonVi,
                    thuTuShow = d.ThuTuShow,
                    link = d.Link,
                    ngayDang = d.NgayDang,
                    ngayCapNhat = d.NgayCapNhat
                }).ToList();
            return Ok(list);
        }

        [HttpGet]
        [Route("{id:int}")]
        public IHttpActionResult Get(int id)
        {
            var d = db.DonViTrucThuocs.Find(id);
            if (d == null) return NotFound();
            return Ok(new
            {
                id = d.ID,
                idKhoi = d.ID_Khoi,
                tenDonVi = d.TenDonVi,
                thuTuShow = d.ThuTuShow,
                link = d.Link,
                ngayDang = d.NgayDang,
                ngayCapNhat = d.NgayCapNhat
            });
        }

        [HttpPost]
        [Route("")]
        public IHttpActionResult Post([FromBody] DonViTrucThuoc donvi)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            donvi.NgayDang = donvi.NgayCapNhat = (int)(System.DateTime.UtcNow - new System.DateTime(1970, 1, 1)).TotalSeconds;
            db.DonViTrucThuocs.Add(donvi);
            db.SaveChanges();
            return Ok(donvi);
        }

        [HttpPut]
        [Route("{id:int}")]
        public IHttpActionResult Put(int id, [FromBody] DonViTrucThuoc donvi)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var existing = db.DonViTrucThuocs.Find(id);
            if (existing == null)
                return NotFound();

            existing.TenDonVi = donvi.TenDonVi;
            existing.ThuTuShow = donvi.ThuTuShow;
            existing.Link = donvi.Link;
            existing.ID_Khoi = donvi.ID_Khoi;
            existing.NgayCapNhat = (int)(System.DateTime.UtcNow - new System.DateTime(1970, 1, 1)).TotalSeconds;
            db.SaveChanges();
            return Ok(existing);
        }

        [HttpDelete]
        [Route("{id:int}")]
        public IHttpActionResult Delete(int id)
        {
            var donvi = db.DonViTrucThuocs.Find(id);
            if (donvi == null)
                return NotFound();

            db.DonViTrucThuocs.Remove(donvi);
            db.SaveChanges();
            return Ok();
        }
    }
}