//using ProjectTinTucBan.Models;
//using System;
//using System.Collections.Generic;
//using System.Linq;
//using System.Net;
//using System.Net.Http;
//using System.Threading.Tasks;
//using System.Web.Http;
//using System.Data.Entity;

//namespace ProjectTinTucBan.Areas.Admin.Controllers
//{
//    [RoutePrefix("api/v1/admin")] // cố định route
//    public class BaiVietAPIController : ApiController
//    {
//        WebTinTucTDMUEntities db = new WebTinTucTDMUEntities(); // context DB

//        [HttpGet]
//        [Route("get-all-baiviet")] // --> api/v1/admin/get-all-baiviet
//        public async Task<IHttpActionResult> GetAllBaiViet()
//        {
//            var data = await db.BaiViets
//                 .Select(x => new
//                 {
//                     x.ID,
//                     x.TieuDe,
//                     x.NoiDung,
//                     x.LinkThumbnail,
//                     x.NgayDang,
//                     x.LinkPDF,
//                     x.NgayCapNhat,
//                     x.ViewCount,
//                 })
//                 .ToListAsync();

//            if (data.Count > 0)
//            {
//                return Ok(new { data = data, success = true });
//            }
//            else
//            {
//                return Ok(new { message = "Không có bài viết nào", success = false });
//            }
//        }

//    }
//}
using ProjectTinTucBan.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web;
using System.Web.Http;
using System.Data.Entity;
using System.IO;

namespace ProjectTinTucBan.Areas.Admin.Controllers
{
    [RoutePrefix("api/v1/admin")] // cố định route
    public class BaiVietAPIController : ApiController
    {
        WebTinTucTDMUEntities db = new WebTinTucTDMUEntities(); // context DB

        // Lấy tất cả bài viết
        [HttpGet]
        [Route("get-all-baiviet")]
        public async Task<IHttpActionResult> GetAllBaiViet()
        {
            var data = await db.BaiViets
                 .Select(x => new
                 {
                     x.ID,
                     x.TieuDe,
                     x.NoiDung,
                     x.LinkThumbnail,
                     x.NgayDang,
                     x.LinkPDF,
                     x.NgayCapNhat,
                     x.ViewCount,
                 })
                 .ToListAsync();

            if (data.Count > 0)
            {
                return Ok(new { data = data, success = true });
            }
            else
            {
                return Ok(new { message = "Không có bài viết nào", success = false });
            }
        }
    }
}
