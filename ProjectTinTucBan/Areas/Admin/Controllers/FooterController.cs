using System.Linq;
using System.Web.Http;
using ProjectTinTucBan.Models;
using System;
using System.Web.Mvc;
using Newtonsoft.Json.Linq;
using System.Globalization;

namespace ProjectTinTucBan.Areas.Admin.Controllers
{
    public class FooterApiController : ApiController
    {
        private WebTinTucTDMUEntities db = new WebTinTucTDMUEntities();

        // GET: api/admin/footerapi
        public IHttpActionResult GetAll()
        {
            var list = db.Footers.ToList();
            return Ok(list);
        }

        // GET: api/admin/footerapi/5
        public IHttpActionResult GetById(int id)
        {
            var footer = db.Footers.FirstOrDefault(f => f.ID == id);
            if (footer == null)
                return NotFound();
            return Ok(footer);
        }

        // POST: api/admin/footerapi
        [System.Web.Http.HttpPost]
        public IHttpActionResult Create([FromBody] Footer model)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            int unixTimestamp = (int)(DateTime.UtcNow.Subtract(new DateTime(1970, 1, 1))).TotalSeconds;
            model.NgayDang = unixTimestamp;
            model.NgayCapNhat = unixTimestamp;

            db.Footers.Add(model);
            db.SaveChanges();
            return Ok(model);
        }

        // PUT: api/admin/footerapi/5
        [System.Web.Http.HttpPut]
        public IHttpActionResult Update(int id, [FromBody] Footer model)
        {
            var footer = db.Footers.FirstOrDefault(f => f.ID == id);
            if (footer == null)
                return NotFound();

            footer.FullName = model.FullName;
            footer.EnglishName = model.EnglishName;
            footer.NgayThanhLap = model.NgayThanhLap;
            footer.DiaChi = model.DiaChi;
            footer.DienThoai = model.DienThoai;
            footer.Email = model.Email;
            footer.VideoUrl = model.VideoUrl;
            footer.FooterCopyright = model.FooterCopyright;
            footer.FooterNote = model.FooterNote;

            int unixTimestamp = (int)(DateTime.UtcNow.Subtract(new DateTime(1970, 1, 1))).TotalSeconds;
            footer.NgayCapNhat = unixTimestamp;

            db.SaveChanges();
            return Ok(footer);
        }

        // DELETE: api/admin/footerapi/5
        [System.Web.Http.HttpDelete]
        public IHttpActionResult Delete(int id)
        {
            var footer = db.Footers.FirstOrDefault(f => f.ID == id);
            if (footer == null)
                return NotFound();

            db.Footers.Remove(footer);
            db.SaveChanges();
            return Ok();
        }
    }

    public class FooterController : Controller
    {
        private WebTinTucTDMUEntities db = new WebTinTucTDMUEntities();

        public ActionResult EditFooter()
        {
            // Lấy dữ liệu Footer từ DB
            var footer = db.Footers.FirstOrDefault();
            JObject model = new JObject();
            if (footer != null)
            {
                model["id"] = footer.ID;
                model["fullName"] = footer.FullName;
                model["englishName"] = footer.EnglishName;
                // Chuyển Unix timestamp sang chuỗi ngày dd/MM/yyyy
                if (footer.NgayThanhLap.HasValue && footer.NgayThanhLap.Value > 0)
                {
                    var dt = new DateTime(1970, 1, 1).AddSeconds(footer.NgayThanhLap.Value);
                    model["established"] = dt.ToString("dd/MM/yyyy");
                }
                else
                {
                    model["established"] = "";
                }
                model["address"] = footer.DiaChi;
                model["phone"] = footer.DienThoai;
                model["email"] = footer.Email;
                model["videoUrl"] = footer.VideoUrl;
                model["footerCopyright"] = footer.FooterCopyright;
                model["footerNote"] = footer.FooterNote;
            }
            // Nếu không có dữ liệu, vẫn phải trả về model rỗng để tránh null
            return View(model);
        }
    }
}