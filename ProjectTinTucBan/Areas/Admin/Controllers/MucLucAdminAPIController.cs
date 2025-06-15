using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using ProjectTinTucBan.Models;
using System.Threading.Tasks;
namespace ProjectTinTucBan.Areas.Admin.Controllers
{
    [RoutePrefix("api/v1/admin")]
    public class MucLucAdminAPIController : ApiController
    {
        private WebTinTucTDMUEntities db = new WebTinTucTDMUEntities();
        private int unixTimestamp;

        public MucLucAdminAPIController()
        {
            DateTime now = DateTime.UtcNow;
            unixTimestamp = (int)(now.Subtract(new DateTime(1970, 1, 1))).TotalSeconds;
        }
        // GET: api/v1/admin/Get-All-Muc-Luc
        [HttpGet]
        [Route("Get-All-Muc-Luc")]
        public async Task<IHttpActionResult> GetAllMucLuc()
        {
            var GetALLMucLuc = await db.MucLucs
                   .OrderBy(x => x.ThuTuShow)
                   .Select(x => new
                   {
                       x.ID,
                       x.TenMucLuc,
                       x.Link,
                       x.ThuTuShow,
                       x.NgayCapNhat,
                       x.NgayDang
  
                   })
                   .ToListAsync();


            // Luôn trả về cùng một cấu trúc JSON
            if (GetALLMucLuc.Count > 0) // nếu có giá trị thì trả về data
            {
                return Ok(new { data = GetALLMucLuc, success = true });
            }
            else // không có giá trị thì trả về đoạn thông báo kèm mảng rỗng
            {
                return Ok(new { message = "Không có thông tin mục lục", data = new object[0], success = false });
            }
        }
        // GET: api/v1/admin/Get-Muc-Luc-By-Id/{id}
        [HttpGet]
        [Route("Get-Muc-Luc-By-Id/{id}")]
        public async Task<IHttpActionResult> GetMucLucById(int id)
        {
            try
            {
                var GetMucLucById = await db.MucLucs
                     .Where(x => x.ID == id)
                     .Select(x => new
                     {
                         x.ID,
                         x.TenMucLuc,
                         x.Link,
                         x.ThuTuShow,
                         x.NgayCapNhat,
                         x.NgayDang
                     })
                     .FirstOrDefaultAsync();

                if (GetMucLucById != null) // nếu có giá trị thì trả về data
                {
                    return Ok(new { data = GetMucLucById, success = true });
                }
                else // không có giá trị thì trả về đoạn thông báo
                {
                    return Ok(new { message = "Không tìm thấy mục lục", success = false });
                }
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        [HttpPost]
        [Route("Create-Muc-Luc")]
        public async Task<IHttpActionResult> CreateMucLuc(MucLuc Item)
        {
            try
            {
                if (Item == null)
                {
                    // Trả về chuỗi thông báo lỗi đơn giản
                    return BadRequest("Dữ liệu không hợp lệ");
                }

                // Kiểm tra xem mục lục đã tồn tại chưa
                var existingMucLuc = await db.MucLucs.FirstOrDefaultAsync(x => x.TenMucLuc == Item.TenMucLuc);
                if (existingMucLuc != null)
                {
                    // Sử dụng Content để trả về JSON với mã trạng thái BadRequest
                    return Content(HttpStatusCode.BadRequest, new { message = "Thư mục đã tồn tại trong dữ liệu", success = false });
                }

                // Thêm mới mục lục
                unixTimestamp = (int)DateTimeOffset.UtcNow.ToUnixTimeSeconds();

                var newMucLuc = new MucLuc
                {
                    TenMucLuc = Item.TenMucLuc,
                    Link = Item.Link,
                    ThuTuShow = Item.ThuTuShow,
                    NgayDang = unixTimestamp,
                    NgayCapNhat = unixTimestamp
                };

                db.MucLucs.Add(newMucLuc);
                await db.SaveChangesAsync();
                return Ok(new { message = "Thêm mới mục lục thành công", success = true });
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        [HttpPost]
        [Route("Update-Muc-Luc")]
        public async Task<IHttpActionResult> UpdateMucLuc(MucLuc Item)
        {
            try
            {
                if (Item == null || Item.ID <= 0)
                {
                    return BadRequest("Dữ liệu không hợp lệ");
                }
                // Kiểm tra xem mục lục có tồn tại không
                var existingMucLuc = await db.MucLucs.FindAsync(Item.ID);
                if (existingMucLuc == null)
                {
                    return NotFound();
                }

                // Kiểm tra xem tên mục lục đã tồn tại trong cơ sở dữ liệu với ID khác
                var duplicateName = await db.MucLucs
                    .FirstOrDefaultAsync(x => x.TenMucLuc == Item.TenMucLuc && x.ID != Item.ID);
                if (duplicateName != null)
                {
                    return Content(HttpStatusCode.BadRequest, new { message = "Tên mục lục đã tồn tại trong dữ liệu", success = false });
                }

                // Cập nhật thông tin mục lục
                existingMucLuc.TenMucLuc = Item.TenMucLuc;
                existingMucLuc.Link = Item.Link;
                existingMucLuc.ThuTuShow = Item.ThuTuShow;
                unixTimestamp = (int)DateTimeOffset.UtcNow.ToUnixTimeSeconds();
                existingMucLuc.NgayCapNhat = unixTimestamp;
                await db.SaveChangesAsync();
                return Ok(new { message = "Cập nhật mục lục thành công", success = true });
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        [HttpPost]
        [Route("Delete-Muc-Luc")]
        public async Task<IHttpActionResult> DeleteMucLuc(MucLuc Item)
        {
            try
            {
                if (Item == null || Item.ID <= 0)
                {
                    return BadRequest("Dữ liệu không hợp lệ");
                }
                // Kiểm tra xem mục lục có tồn tại không
                var existingMucLuc = await db.MucLucs.FindAsync(Item.ID);
                if (existingMucLuc == null)
                {
                    return NotFound();
                }
                // Kiểm tra bài viết có liên kết với mục lục này không
                var baiVietCount = await db.BaiViets.CountAsync(bv => bv.ID_MucLuc == existingMucLuc.ID);
                if (baiVietCount > 0)
                {
                    return Content(HttpStatusCode.BadRequest, new { message = "Không thể xóa mục lục vì có bài viết liên kết", success = false });
                }
                // Xóa mục lục
                db.MucLucs.Remove(existingMucLuc);
                await db.SaveChangesAsync();
                return Ok(new { message = "Xóa mục lục thành công", success = true });
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }



        protected override void Dispose(bool disposing)
        {
            if (disposing)
            {
                db.Dispose();
            }
            base.Dispose(disposing);
        }
    }
}
