using ProjectTinTucBan.Models;
using System;
using System.IO;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using System.Web;
using System.Web.Http;

namespace ProjectTinTucBan.Areas.Admin.Controllers
{
    [RoutePrefix("api/v1/admin")]
    public class HDSDAPIController : ApiController
    {
        WebTinTucTDMUEntities db = new WebTinTucTDMUEntities();

        // GET: api/v1/admin/hdsd/get-all
        [HttpGet]
        [Route("hdsd/get-all")]
        public IHttpActionResult GetAll()
        {
            var danhSach = db.TaiLieux
                .OrderByDescending(t => t.Upload_Date)
                .ToList()
                .Select(t => new
                {
                    stt = t.STT,
                    tenTaiLieu = t.Ten_Tailieu,
                    ngayTao = UnixToDateTime(t.Upload_Date),
                    url = t.Download_Link
                }).ToList();

            return Ok(new { success = true, data = danhSach });
        }

        // POST: api/v1/admin/hdsd/upload
        [HttpPost]
        [Route("hdsd/upload")]
        public async Task<IHttpActionResult> Upload()
        {
            var request = HttpContext.Current.Request;

            if (request.Files.Count == 0)
                return Ok(new { success = false, message = "Chưa chọn file PDF!" });

            var file = request.Files[0];
            var tenTaiLieu = request.Form["Ten_TaiLieu"]; // 👉 phải trùng với key của FormData client

            if (string.IsNullOrWhiteSpace(tenTaiLieu))
                return Ok(new { success = false, message = "Tên tài liệu không được để trống!" });

            if (file == null || file.ContentLength == 0 || Path.GetExtension(file.FileName).ToLower() != ".pdf")
                return Ok(new { success = false, message = "File không hợp lệ. Chỉ chấp nhận PDF." });

            var fileName = Guid.NewGuid() + Path.GetExtension(file.FileName);
            var savePath = HttpContext.Current.Server.MapPath("~/Uploads/HDSD/");
            var filePath = Path.Combine(savePath, fileName);

            if (!Directory.Exists(savePath))
                Directory.CreateDirectory(savePath);

            file.SaveAs(filePath);

            int timestamp = (int)DateTimeOffset.Now.ToUnixTimeSeconds();

            var taiLieu = new TaiLieu
            {
                Ten_Tailieu = tenTaiLieu,
                Upload_Date = timestamp,
                Download_Link = "/Uploads/HDSD/" + fileName
            };

            db.TaiLieux.Add(taiLieu);
            await db.SaveChangesAsync();

            return Ok(new { success = true, message = "Tải lên thành công!" });
        }

        [HttpDelete]
        [Route("hdsd/delete")]
        public IHttpActionResult XoaTaiLieu(int stt)
        {
            var taiLieu = db.TaiLieux.FirstOrDefault(t => t.STT == stt);
            if (taiLieu == null)
                return Json(new { success = false, message = "Không tìm thấy tài liệu." });

            // Xóa file vật lý
            var filePath = HttpContext.Current.Server.MapPath(taiLieu.Download_Link);
            if (File.Exists(filePath))
                File.Delete(filePath);

            db.TaiLieux.Remove(taiLieu);
            db.SaveChanges();

            return Json(new { success = true, message = "Đã xóa tài liệu." });
        }

        private string UnixToDateTime(int unixTime)
        {
            return DateTimeOffset.FromUnixTimeSeconds(unixTime)
                .ToLocalTime()
                .ToString("dd/MM/yyyy HH:mm");
        }
    }
}
