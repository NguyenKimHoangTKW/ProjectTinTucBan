using ProjectTinTucBan.Models;
using System;
using System.Net;
using System.Threading.Tasks;
using System.Web.Http;

namespace ProjectTinTucBan.Areas.Admin.Controllers
{
    [RoutePrefix("api/v1/admin")]
    public class ThemBaiVietAPIController : ApiController
    {
        WebTinTucTDMUEntities db = new WebTinTucTDMUEntities();

        // POST: api/v1/admin/them-baiviet
        [HttpPost]
        [Route("them-baiviet")]
        public async Task<IHttpActionResult> ThemBaiViet([FromBody] BaiViet model)
        {
            if (model == null || string.IsNullOrWhiteSpace(model.TieuDe))
            {
                return Content(HttpStatusCode.BadRequest, new { success = false, message = "Dữ liệu không hợp lệ." });
            }

            try
            {
                // Chuyển DateTime hiện tại thành số nguyên định dạng yyyyMMdd
                int todayInt = int.Parse(DateTime.Now.ToString("yyyyMMdd"));

                model.NgayDang = todayInt;
                model.NgayCapNhat = todayInt;
                model.ViewCount = 0;

                db.BaiViets.Add(model);
                await db.SaveChangesAsync();

                return Ok(new { success = true, message = "Thêm bài viết thành công.", data = model });
            }
            catch (Exception ex)
            {
                return Content(HttpStatusCode.InternalServerError, new
                {
                    success = false,
                    message = "Lỗi khi thêm bài viết.",
                    error = ex.Message
                });
            }
        }
    }
}
