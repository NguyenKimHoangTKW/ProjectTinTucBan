using System.Web.Http;
using ProjectTinTucBan.Models;
using ProjectTinTucBan.Helper;

namespace ProjectTinTucBan.Areas.Admin.Controllers
{
    [RoutePrefix("api/Admin/TaiKhoan")]
    public class EditTaiKhoanApiController : ApiController
    {
        WebTinTucTDMUEntities db = new WebTinTucTDMUEntities();

        // PUT: api/Admin/TaiKhoan/Update/{id}
        [HttpPut]
        [Route("Update/{id}")]
        public IHttpActionResult Update(int id, [FromBody] TaiKhoan model)
        {
            var currentUser = SessionHelper.GetUser(System.Web.HttpContext.Current);
            if (currentUser == null || currentUser.ID != id)
                return Content(System.Net.HttpStatusCode.Unauthorized, new { success = false, message = "Chưa đăng nhập hoặc không đúng tài khoản" });

            var taiKhoan = db.TaiKhoans.Find(id);
            if (taiKhoan == null)
                return NotFound();

            taiKhoan.Name = model.Name;
            taiKhoan.SDT = model.SDT;
            taiKhoan.Gmail = model.Gmail;
            db.SaveChanges();

            return Ok(new { success = true, message = "Đã thay đổi thành công!" });
        }
    }
}