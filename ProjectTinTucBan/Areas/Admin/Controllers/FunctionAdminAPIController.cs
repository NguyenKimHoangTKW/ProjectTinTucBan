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
    public class FunctionAdminAPIController : ApiController
    {
        WebTinTucTDMUEntities db = new WebTinTucTDMUEntities();
        private int unixTimestamp;
        public FunctionAdminAPIController()
        {
            DateTime now = DateTime.UtcNow;
            unixTimestamp = (int)(now.Subtract(new DateTime(1970, 1, 1))).TotalSeconds;
        }
        // GET: api/v1/admin/Get-All-Functions
        [HttpGet]
        [Route("Get-All-Functions")]
        public async Task<IHttpActionResult> GetAllFunctions()
        {
            var GetALLFunctions = await db.ChucNangQuyenUsers
                   .Select(x => new
                   {
                       x.ID,
                       x.TenChucNang,
                       x.MaChucNang,
                       x.MoTa,
                       x.NgayCapNhat,
                       x.NgayTao
                   })
                   .ToListAsync();
            // Luôn trả về cùng một cấu trúc JSON
            if (GetALLFunctions.Count > 0) // nếu có giá trị thì trả về data
            {
                return Ok(new { data = GetALLFunctions, success = true });
            }
            else // không có giá trị thì trả về đoạn thông báo kèm mảng rỗng
            {
                return Ok(new { message = "Không có thông tin chức năng", data = new object[0], success = false });
            }
        }
        // POST: api/v1/admin/Create-Function
        [HttpPost]
        [Route("Create-Function")]
        public async Task<IHttpActionResult> CreateFunction(ChucNangQuyenUser Item)
        {
            try
            {
                if (Item == null)
                {
                    // Trả về chuỗi thông báo lỗi đơn giản
                    return BadRequest("Dữ liệu không hợp lệ");
                }
                // Kiểm tra xem chức năng đã tồn tại chưa
                var existingFunction = await db.ChucNangQuyenUsers.FirstOrDefaultAsync(x => x.TenChucNang == Item.TenChucNang);
                if (existingFunction != null)
                {
                    return BadRequest("Chức năng đã tồn tại");
                }


                // Thêm chức năng mới
                unixTimestamp = (int)DateTimeOffset.UtcNow.ToUnixTimeSeconds();
                var newFunction = new ChucNangQuyenUser
                {
                    MaChucNang = Item.MaChucNang,
                    TenChucNang = Item.TenChucNang,
                    MoTa = Item.MoTa,
                    NgayTao = unixTimestamp,
                    NgayCapNhat = unixTimestamp
                };

                db.ChucNangQuyenUsers.Add(newFunction);
                await db.SaveChangesAsync();
                return Ok(new { message = "Thêm chức năng thành công", success = true });
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }
        // PUT: api/v1/admin/Update-Function/{id}
        [HttpPut]
        [Route("Update-Function/{id:int}")]
        public async Task<IHttpActionResult> UpdateFunction(int id, ChucNangQuyenUser Item)
        {
            try
            {
                if (Item == null)
                {
                    return BadRequest("Dữ liệu không hợp lệ");
                }
                // Tìm chức năng theo ID
                var existingFunction = await db.ChucNangQuyenUsers.FindAsync(id);
                if (existingFunction == null)
                {
                    return NotFound();
                }
                // Cập nhật thông tin chức năng
                existingFunction.MaChucNang = Item.MaChucNang;
                existingFunction.TenChucNang = Item.TenChucNang;
                existingFunction.MoTa = Item.MoTa;
                existingFunction.NgayCapNhat = unixTimestamp;
                await db.SaveChangesAsync();
                return Ok(new { message = "Cập nhật chức năng thành công", success = true });
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }
        // DELETE: api/v1/admin/Delete-Function/{id}
        [HttpDelete]
        [Route("Delete-Function/{id:int}")]
        public async Task<IHttpActionResult> DeleteFunction(int id)
        {
            try
            {
                // Tìm chức năng theo ID
                var existingFunction = await db.ChucNangQuyenUsers.FindAsync(id);
                if (existingFunction == null)
                {
                    return NotFound();
                }
                // Xóa chức năng
                db.ChucNangQuyenUsers.Remove(existingFunction);
                await db.SaveChangesAsync();
                return Ok(new { message = "Xóa chức năng thành công", success = true });
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }
    }
}
