using System.Linq;
using System.Web.Http;
using ProjectTinTucBan.Models;

namespace ProjectTinTucBan.Areas.Admin.Controllers
{
    public class DonViTrucThuocController : ApiController
    {
        private WebTinTucTDMUEntities db = new WebTinTucTDMUEntities();

        [HttpGet]
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

        // Thêm mới đơn vị
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

        // Sửa đơn vị
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
            existing.NgayCapNhat = (int)(System.DateTime.UtcNow - new System.DateTime(1970, 1, 1)).TotalSeconds;
            db.SaveChanges();
            return Ok(existing);
        }

        // Xóa đơn vị
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

        // Helper method to construct API URL
        public string ConstructApiUrl(int? idKhoi)
        {
            var url = "/api/Admin/DonViTrucThuoc/Get";
            if (idKhoi.HasValue)
            {
                url = $"/api/Admin/DonViTrucThuoc/GetByKhoi?idKhoi={idKhoi.Value}";
            }
            return url;
        }
    }
}