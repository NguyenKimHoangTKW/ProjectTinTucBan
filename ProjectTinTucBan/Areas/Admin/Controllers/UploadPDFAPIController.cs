using System;
using System.IO;
using System.Net;
using System.Threading.Tasks;
using System.Web;
using System.Web.Http;

namespace ProjectTinTucBan.Areas.Admin.Controllers
{
    [RoutePrefix("api/v1/admin")]
    public class PdfUploadController : ApiController
    {
        [HttpPost]
        [Route("upload-pdf")]
        public async Task<IHttpActionResult> UploadPdf()
        {
            try
            {
                var httpRequest = HttpContext.Current.Request;
                if (httpRequest.Files.Count == 0)
                    return Content(HttpStatusCode.BadRequest, new { message = "Không có file nào được gửi lên", success = false });

                var file = httpRequest.Files[0];
                if (file == null || file.ContentLength == 0)
                    return Content(HttpStatusCode.BadRequest, new { message = "File không hợp lệ", success = false });

                var relativeFolder = "/Uploads/PDFs/";
                var mappedPath = HttpContext.Current.Server.MapPath("~" + relativeFolder);

                if (!Directory.Exists(mappedPath))
                    Directory.CreateDirectory(mappedPath);

                var originalName = Path.GetFileNameWithoutExtension(file.FileName);
                var ext = Path.GetExtension(file.FileName);
                var timestamp = DateTime.Now.ToString("yyyyMMddHHmmss");
                var fileName = $"{originalName}_{timestamp}{ext}";

                var fullPath = Path.Combine(mappedPath, fileName);
                file.SaveAs(fullPath);

                var fileUrl = relativeFolder + fileName;

                return Ok(new { link = fileUrl, success = true });
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

    }
}
