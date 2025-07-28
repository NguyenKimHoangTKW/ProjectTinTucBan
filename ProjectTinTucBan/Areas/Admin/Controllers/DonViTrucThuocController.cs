using System.Linq;
using System.Web.Http;
using ProjectTinTucBan.Models;

namespace ProjectTinTucBan.Areas.Admin.Controllers
{
    [RoutePrefix("api/v1/admin/donvi-truc-thuoc")]
    public class DonViTrucThuocController : ApiController
    {
        private WebTinTucTDMUEntities db = new WebTinTucTDMUEntities();

        // GET: api/v1/admin/donvi-truc-thuoc/get-all
        [HttpGet]
        [Route("get-all")]
        public IHttpActionResult GetAll()
        {
            var list = db.DonViTrucThuocs
                .OrderBy(d => d.ThuTuShow)
                .ThenBy(d => d.ID)
                .Select(d => new
                {
                    id = d.ID,
                    idKhoi = d.ID_Khoi,
                    tenDonVi = d.TenDonVi,
                    thuTuShow = d.ThuTuShow,
                    link = d.Link,
                    ngayDang = d.NgayDang,
                    ngayCapNhat = d.NgayCapNhat,
                    trangThai = d.IsActive == 1
                }).ToList();
            return Ok(list);
        }

        // GET: api/v1/admin/donvi-truc-thuoc/by-khoi/{idKhoi}
        [HttpGet]
        [Route("by-khoi/{idKhoi}")]
        public IHttpActionResult GetByKhoi(int idKhoi)
        {
            var list = db.DonViTrucThuocs
                .Where(d => d.ID_Khoi == idKhoi)
                .OrderBy(d => d.ThuTuShow)
                .ThenBy(d => d.ID)
                .Select(d => new
                {
                    id = d.ID,
                    idKhoi = d.ID_Khoi,
                    tenDonVi = d.TenDonVi,
                    thuTuShow = d.ThuTuShow,
                    link = d.Link,
                    ngayDang = d.NgayDang,
                    ngayCapNhat = d.NgayCapNhat,
                    trangThai = d.IsActive == 1
                }).ToList();
            return Ok(list);
        }

        // GET: api/v1/admin/donvi-truc-thuoc/{id}
        [HttpGet]
        [Route("{id}")]
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
                ngayCapNhat = d.NgayCapNhat,
                trangThai = d.IsActive == 1
            });
        }

        // POST: api/v1/admin/donvi-truc-thuoc/create
        [HttpPost]
        [Route("create")]
        public IHttpActionResult Post([FromBody] DonViTrucThuoc donvi)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            donvi.NgayDang = donvi.NgayCapNhat = (int)(System.DateTime.UtcNow - new System.DateTime(1970, 1, 1)).TotalSeconds;
            db.DonViTrucThuocs.Add(donvi);
            db.SaveChanges();
            return Ok(new
            {
                id = donvi.ID,
                idKhoi = donvi.ID_Khoi,
                tenDonVi = donvi.TenDonVi,
                thuTuShow = donvi.ThuTuShow,
                link = donvi.Link,
                ngayDang = donvi.NgayDang,
                ngayCapNhat = donvi.NgayCapNhat,
                trangThai = donvi.IsActive == 1
            });
        }

        // PUT: api/v1/admin/donvi-truc-thuoc/{id}
        [HttpPut]
        [Route("{id}")]
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

            return Ok(new
            {
                id = existing.ID,
                idKhoi = existing.ID_Khoi,
                tenDonVi = existing.TenDonVi,
                thuTuShow = existing.ThuTuShow,
                link = existing.Link,
                ngayDang = existing.NgayDang,
                ngayCapNhat = existing.NgayCapNhat,
                trangThai = existing.IsActive == 1
            });
        }

        // DELETE: api/v1/admin/donvi-truc-thuoc/{id}
        [HttpDelete]
        [Route("{id}")]
        public IHttpActionResult Delete(int id)
        {
            var donvi = db.DonViTrucThuocs.Find(id);
            if (donvi == null)
                return NotFound();

            db.DonViTrucThuocs.Remove(donvi);
            db.SaveChanges();
            return Ok();
        }

        // PUT: api/v1/admin/donvi-truc-thuoc/toggle-trang-thai/{id}
        [HttpPut]
        [Route("toggle-trang-thai/{id:int}")]
        public IHttpActionResult ToggleTrangThai(int id, [FromBody] ToggleTrangThaiModel model)
        {
            var donvi = db.DonViTrucThuocs.Find(id);
            if (donvi == null)
                return NotFound();

            donvi.IsActive = model.IsActive ? 1 : 0;
            donvi.NgayCapNhat = (int)(System.DateTime.UtcNow - new System.DateTime(1970, 1, 1)).TotalSeconds;
            db.SaveChanges();
            return Ok();
        }
    }

    public class ToggleTrangThaiModel
    {
        public bool IsActive { get; set; }
    }
}