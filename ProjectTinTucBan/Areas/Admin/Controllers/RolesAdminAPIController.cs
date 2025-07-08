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
    public class RolesAdminAPIController : ApiController
    {
        private WebTinTucTDMUEntities db = new WebTinTucTDMUEntities();
        private int unixTimestamp;

        public RolesAdminAPIController()
        {
            DateTime now = DateTime.UtcNow;
            unixTimestamp = (int)(now.Subtract(new DateTime(1970, 1, 1))).TotalSeconds;
        }

        // GET: api/v1/admin/Get-All-Roles
        [HttpGet]
        [Route("Get-All-Roles")]
        public async Task<IHttpActionResult> GetAllRoles()
        {
            try
            {
                var GetALLRoles = await db.Roles
                       .Select(x => new
                       {
                           x.ID,
                           x.TenRole,
                           x.MoTa,
                           x.NgayCapNhat,
                           x.NgayTao
                       })
                       .ToListAsync();

                // Luôn trả về cùng một cấu trúc JSON
                if (GetALLRoles.Count > 0) // nếu có giá trị thì trả về data
                {
                    return Ok(new { data = GetALLRoles, success = true });
                }
                else // không có giá trị thì trả về đoạn thông báo kèm mảng rỗng
                {
                    return Ok(new { message = "Không có thông tin quyển admin", data = new object[0], success = false });
                }
            }
            catch (Exception ex)
            {
                return Ok(new { message = "Lỗi: " + ex.Message, success = false });
            }
        }

        // POST: api/v1/admin/Create-Roles
        [HttpPost]
        [Route("Create-Roles")]
        public async Task<IHttpActionResult> CreateMucLuc(Role Item)
        {
            try
            {
                if (Item == null)
                {
                    return Ok(new { message = "Dữ liệu không hợp lệ", success = false });
                }

                // Kiểm tra xem mục lục đã tồn tại chưa
                var existingMucLuc = await db.Roles.FirstOrDefaultAsync(x => x.TenRole == Item.TenRole);
                if (existingMucLuc != null)
                {
                    return Ok(new { message = "Quyền đã tồn tại trong dữ liệu", success = false });
                }

                // Thêm mới mục lục
                unixTimestamp = (int)DateTimeOffset.UtcNow.ToUnixTimeSeconds();

                var newRole = new Role
                {
                    TenRole = Item.TenRole,
                    MoTa = Item.MoTa,
                    NgayTao = unixTimestamp,
                    NgayCapNhat = unixTimestamp
                };

                db.Roles.Add(newRole);
                await db.SaveChangesAsync();
                return Ok(new { message = "Thêm mới quyền mới thành công", success = true });
            }
            catch (Exception ex)
            {
                return Ok(new { message = "Lỗi: " + ex.Message, success = false });
            }
        }

        // GET: api/v1/admin/Get-Roles-By-Id/{id}
        [HttpGet]
        [Route("Get-Roles-By-Id/{id}")]
        public async Task<IHttpActionResult> GetRolesById(int id)
        {
            try
            {
                var GetRolesById = await db.Roles
                     .Where(x => x.ID == id)
                     .Select(x => new
                     {
                         x.ID,
                         x.TenRole,
                         x.MoTa,
                         x.NgayCapNhat,
                         x.NgayTao
                     })
                     .FirstOrDefaultAsync();

                if (GetRolesById != null) // nếu có giá trị thì trả về data
                {
                    return Ok(new { data = GetRolesById, success = true });
                }
                else // không có giá trị thì trả về đoạn thông báo
                {
                    return Ok(new { message = "Không tìm thấy roles", success = false });
                }
            }
            catch (Exception ex)
            {
                return Ok(new { message = "Lỗi: " + ex.Message, success = false });
            }
        }

        // Post: api/v1/admin/Update-Roles
        [HttpPost]
        [Route("Update-Roles")]
        public async Task<IHttpActionResult> UpdateRoles(Role Item)
        {
            try
            {
                if (Item == null || Item.ID <= 0)
                {
                    return Ok(new { message = "Dữ liệu không hợp lệ", success = false });
                }
                // Kiểm tra xem mục lục có tồn tại không
                var existingMucLuc = await db.Roles.FindAsync(Item.ID);
                if (existingMucLuc == null)
                {
                    return Ok(new { message = "Không tìm thấy quyền admin", success = false });
                }

                // Kiểm tra xem tên mục lục đã tồn tại trong cơ sở dữ liệu với ID khác
                var duplicateName = await db.Roles
                    .FirstOrDefaultAsync(x => x.TenRole == Item.TenRole && x.ID != Item.ID);
                if (duplicateName != null)
                {
                    return Ok(new { message = "Quyền admin đã tồn tại trong dữ liệu", success = false });
                }

                // Cập nhật thông tin mục lục
                existingMucLuc.TenRole = Item.TenRole;
                existingMucLuc.MoTa = Item.MoTa;
                unixTimestamp = (int)DateTimeOffset.UtcNow.ToUnixTimeSeconds();
                existingMucLuc.NgayCapNhat = unixTimestamp;
                await db.SaveChangesAsync();
                return Ok(new { message = "Cập nhật quyền admin thành công", success = true });
            }
            catch (Exception ex)
            {
                return Ok(new { message = "Lỗi: " + ex.Message, success = false });
            }
        }

        // DELETE: api/v1/admin/Delete-Roles
        [HttpPost]
        [Route("Delete-Roles")]
        public async Task<IHttpActionResult> DeleteRole(Role Item)
        {
            try
            {
                if (Item == null || Item.ID <= 0)
                {
                    return Ok(new { message = "Dữ liệu không hợp lệ", success = false });
                }
                // Kiểm tra xem role có tồn tại không
                var existingRole = await db.Roles.FindAsync(Item.ID);
                if (existingRole == null)
                {
                    return Ok(new { message = "Không tìm thấy quyền admin", success = false });
                }
                // Kiểm tra và ko cho xoá ID 1 VÀ ID 4
                var importantRoleIds = new[] { 1, 4 };
                if (importantRoleIds.Contains(Item.ID))
                {
                    return Ok(new { message = "Không thể xóa quyền hệ thống quan trọng này", success = false });
                }
                // check xem tài khoản có đang dùng ko
                var usersWithRole = await db.TaiKhoans
                                            .Where(x => x.ID_role == Item.ID)
                                            .ToListAsync();
                foreach (var user in usersWithRole)
                {
                    user.ID_role = null;
                }

                // Xóa Roles
                db.Roles.Remove(existingRole);
                await db.SaveChangesAsync();
                return Ok(new { message = "Xóa quyền admin thành công", success = true });
            }
            catch (Exception ex)
            {
                return Ok(new { message = "Lỗi: " + ex.Message, success = false });
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