using ProjectTinTucBan.Models;
using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web.Http;

namespace ProjectTinTucBan.Areas.Admin.Controllers
{
    [RoutePrefix("api/v1/admin")] // đường link cố định để truy cập vào api admin
    public class TestController : ApiController
    {
        WebTinTucTDMUEntities db = new WebTinTucTDMUEntities(); // mở cổng để gọi csdl với thuộc tính là db

        [HttpGet]
        [Route("test")] // tên của api ví dụ (api/v1/admin/test)
        public async Task<IHttpActionResult> test()
        {
            var aaaa = await db.MucLucs
                .Select(x => new
                {
                    x.ThuTuShow
                })
                .ToListAsync(); // lấy ra toàn bộ record trong table BaiViets
            return Ok(new { data = aaaa });
        }

    }
}
