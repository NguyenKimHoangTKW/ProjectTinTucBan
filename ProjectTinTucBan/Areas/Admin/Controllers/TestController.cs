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
        private int unixTimestamp;

        // Khai báo biến lấy giá trị ngày giờ kiểu int Unixtimestap
        public TestController()
        {
            DateTime now = DateTime.UtcNow;
            unixTimestamp = (int)(now.Subtract(new DateTime(1970, 1, 1))).TotalSeconds;
        }
        [HttpGet]
        [Route("test")] // tên của api ví dụ (api/v1/admin/test)
        public async Task<IHttpActionResult> test()
        {
            var get = db.BaiViets.ToListAsync(); // lấy ra toàn bộ record trong table BaiViets
            return Ok();
        }

        // Tạo ngày giờ kiểu int unixtimestap
        [HttpPost]
        [Route("test-tao")]
        public async Task<IHttpActionResult> tao_moi(BaiViet items)
        {
            var new_record = new BaiViet
            {
                NgayCapNhat = unixTimestamp, // gán ngày giờ kiểu unixtimestap vào
                NgayDang = unixTimestamp // gán ngày giờ kiểu unixtimestap vào
            };
            return Ok();
        }


        [HttpGet]
        [Route("get-all-mucluc")]
        public async Task<IHttpActionResult> GetAllMucLuc(MucLuc items)
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
    }
}
