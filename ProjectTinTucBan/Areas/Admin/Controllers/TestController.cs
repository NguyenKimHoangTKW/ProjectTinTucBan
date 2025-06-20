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

<<<<<<< HEAD

        [HttpGet]
        [Route("get-all-mucluc")]
        public async Task<IHttpActionResult> GetAllMucLuc()
        {
            // truy vấn lấy dữ liệu của table mục lục
            var data = await db.MucLucs
                .OrderBy(x => x.ThuTuShow)
                .Select(x => new
                {
                    x.ID,
                    x.TenMucLuc,
                    x.Link
                })
                 .ToListAsync();
            if (data.Count > 0) // nếu có giá trị thì trả về data
            {
                return Ok(new { data = data, success = true });
            }
            else // không có giá trị thì trả về đoạn thông báo
            {
                return Ok(new { message = "Không có thông tin mục lục", success = false });
            }
        }
=======
>>>>>>> master
    }
}
