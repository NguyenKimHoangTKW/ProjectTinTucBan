using ProjectTinTucBan.Models;
using System;
using System.Net;
using System.Threading.Tasks;
using System.Web.Http;

namespace ProjectTinTucBan.Areas.Admin.Controllers
{
    [RoutePrefix("api/v1/admin")]
    public class XoaBaiVietAPIController : ApiController
    {
        private WebTinTucTDMUEntities db = new WebTinTucTDMUEntities();

        // DELETE: api/v1/admin/xoa-baiviet/5
        [HttpDelete]
        [Route("xoa-baiviet/{id:int}")]
        public async Task<IHttpActionResult> XoaBaiViet(int id)
        {
            try
            {
                var baiViet = await db.BaiViets.FindAsync(id);
                if (baiViet == null)
                {
                    return Content(HttpStatusCode.NotFound, new
                    {
                        success = false,
                        message = "Không tìm thấy bài viết."
                    });
                }

                db.BaiViets.Remove(baiViet);
                await db.SaveChangesAsync();

                return Ok(new
                {
                    success = true,
                    message = "Xóa bài viết thành công."
                });
            }
            catch (Exception ex)
            {
                return Content(HttpStatusCode.InternalServerError, new
                {
                    success = false,
                    message = "Lỗi trong quá trình xóa.",
                    error = ex.Message
                });
            }
        }
    }
}
