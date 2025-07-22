using System.Linq;
using System.Web.Http;
using ProjectTinTucBan.Models;
using System;
using System.Web.Mvc;
using Newtonsoft.Json.Linq;
using System.Globalization;
using RouteAttribute = System.Web.Http.RouteAttribute;

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

        // GET: api/admin/footerapi
        [System.Web.Http.HttpGet]
        [Route("api/FooterApi/{id}")]
        public IHttpActionResult Get(int id)
        {
            var footer = db.Footers.FirstOrDefault(f => f.ID == id);
            if (footer == null)
                return NotFound();
            return Ok(footer);
        }

        [System.Web.Http.HttpGet]
        [Route("api/FooterApi/active")]
        public IHttpActionResult GetActiveFooter()
        {
            var activeFooter = db.Footers.FirstOrDefault(f => f.IsActive == 1);
            if (activeFooter == null)
                return NotFound();
            return Ok(activeFooter);
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

        // PUT: api/FooterApi
        [System.Web.Http.HttpPut]
        [Route("api/FooterApi/{id}")]
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

        // PUT: api/FooterApi/{id}/active - Thêm endpoint mới để xử lý toggle active
        [System.Web.Http.HttpPut]
        [Route("api/FooterApi/{id}/active")]
        public IHttpActionResult ToggleActive(int id, [FromBody] JObject data)
        {
            try
            {
                var footer = db.Footers.FirstOrDefault(f => f.ID == id);
                if (footer == null)
                    return NotFound();

                var isActiveValue = data["IsActive"];
                if (isActiveValue == null)
                    return BadRequest("IsActive field is required");

                int newActiveState = isActiveValue.Value<int>();

                // Nếu đang bật footer này (newActiveState = 1)
                if (newActiveState == 1)
                {
                    // Tắt tất cả footer khác trước
                    var allOtherFooters = db.Footers.Where(f => f.ID != id).ToList();
                    foreach (var otherFooter in allOtherFooters)
                    {
                        otherFooter.IsActive = 0;
                    }
                }

                // Cập nhật trạng thái footer hiện tại
                footer.IsActive = newActiveState;

                int unixTimestamp = (int)(DateTime.UtcNow.Subtract(new DateTime(1970, 1, 1))).TotalSeconds;
                footer.NgayCapNhat = unixTimestamp;

                db.SaveChanges();

                // Trả về thông báo chi tiết
                string message;
                if (newActiveState == 1)
                {
                    message = $"Đã kích hoạt Footer \"{footer.FullName}\" thành công. Các Footer khác đã được tắt.";
                }
                else
                {
                    message = $"Đã tắt Footer \"{footer.FullName}\" thành công.";
                }

                return Ok(new
                {
                    success = true,
                    message = message,
                    footerId = id,
                    isActive = newActiveState
                });
            }
            catch (Exception ex)
            {
                return InternalServerError(new Exception("Có lỗi xảy ra khi cập nhật trạng thái Footer: " + ex.Message));
            }
        }

        // DELETE: api/FooterApi
        [System.Web.Http.HttpDelete]
        [Route("api/FooterApi/{id}")]
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

        public ActionResult EditFooter(int? id)
        {
            // Lấy đúng footer theo id truyền vào, nếu không có thì lấy bản ghi đầu tiên
            var footer = id.HasValue
                ? db.Footers.FirstOrDefault(f => f.ID == id.Value)
                : db.Footers.FirstOrDefault();
            JObject model = new JObject();
            if (footer != null)
            {
                model["id"] = footer.ID;
                model["fullName"] = footer.FullName;
                model["englishName"] = footer.EnglishName;
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
            return View("~/Areas/Admin/Views/InterfaceAdmin/EditFooter.cshtml", model);
        }
    }
}