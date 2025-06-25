using ProjectTinTucBan.Models;
using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Data.Entity.Infrastructure;
using System.Linq;
using System.Threading.Tasks;
using System.Web.Http;

namespace ProjectTinTucBan.Areas.Admin.Controllers
{
    [RoutePrefix("api/v1/admin")]
    public class TestController : ApiController
    {
        WebTinTucTDMUEntities db = new WebTinTucTDMUEntities();
        private int unixTimestamp;

        public TestController()
        {
            DateTime now = DateTime.UtcNow;
            unixTimestamp = (int)(now.Subtract(new DateTime(1970, 1, 1))).TotalSeconds;
        }

        [HttpGet]
        [Route("test")]
        public async Task<IHttpActionResult> test()
        {
            var get = db.BaiViets.ToListAsync();
            var aaaa = await db.MucLucs
                .Select(x => new
                {
                    x.ThuTuShow
                })
                .ToListAsync(); // lấy ra toàn bộ record trong table BaiViets
            return Ok(new { data = aaaa });
        }

        [HttpPost]
        [Route("test-tao")]
        public async Task<IHttpActionResult> tao_moi(BaiViet items)
        {
            var new_record = new BaiViet
            {
                NgayCapNhat = unixTimestamp,
                NgayDang = unixTimestamp
            };
            return Ok();
        }

    }
}
