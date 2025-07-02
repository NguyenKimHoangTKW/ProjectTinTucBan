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
    [RoutePrefix("api/v1/admin")]
    public class UserAdminAPIController : ApiController
    {
        private WebTinTucTDMUEntities db = new WebTinTucTDMUEntities();
        private int unixTimestamp;
        public UserAdminAPIController()
        {
            DateTime now = DateTime.UtcNow;
            unixTimestamp = (int)(now.Subtract(new DateTime(1970, 1, 1))).TotalSeconds;
        }

        // GET: api/v1/admin/Get-All-Users
        [HttpGet]
        [Route("Get-All-Users")]
        public async Task<IHttpActionResult> GetAllMucLuc()
        {
            var GetALLUsers = await db.TaiKhoans
                   .Select(x => new
                   {
                       x.ID,
                       x.ID_role,
                       x.TenTaiKhoan,
                       x.MatKhau,
                       x.Gmail,
                       x.SDT,
                       x.IsBanned,
                       x.NgayTao,
                       x.NgayCapNhat
                   })
                   .ToListAsync();


            // Luôn trả về cùng một cấu trúc JSON
            if (GetALLUsers.Count > 0) // nếu có giá trị thì trả về data
            {
                return Ok(new { data = GetALLUsers, success = true });
            }
            else // không có giá trị thì trả về đoạn thông báo kèm mảng rỗng
            {
                return Ok(new { message = "Không có thông tin tài kho", data = new object[0], success = false });
            }
        }

        // GET: api/v1/admin/Get-User-Permissions/{userId}
        [HttpGet]
        [Route("Get-User-Permissions/{userId:int}")]
        public async Task<IHttpActionResult> GetUserPermissions(int userId)
        {
            try
            {
                // Check if user exists
                var user = await db.TaiKhoans.FindAsync(userId);
                if (user == null)
                {
                    return NotFound();
                }

                // Get user permissions
                var userPermissions = await db.PhanQuyenUsers
                    .Where(p => p.ID_TaiKhoan == userId)
                    .Select(p => new
                    {
                        p.ID,
                        p.ID_Function,
                        p.ID_TaiKhoan
                    })
                    .ToListAsync();

                if (userPermissions.Count > 0)
                {
                    return Ok(new { data = userPermissions, success = true });
                }
                else
                {
                    return Ok(new { message = "Người dùng chưa được phân quyền", data = new List<object>(), success = false });
                }
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        // POST: api/v1/admin/Update-User-Permissions
        [HttpPost]
        [Route("Update-User-Permissions")]
        public async Task<IHttpActionResult> UpdateUserPermissions([FromBody] UserPermissionsModel model)
        {
            try
            {
                if (model == null || model.userId <= 0)
                {
                    return Ok(new { message = "Dữ liệu không hợp lệ", success = false });
                }

                // Check if user exists
                var user = await db.TaiKhoans.FindAsync(model.userId);
                if (user == null)
                {
                    return Ok(new { message = "Không tìm thấy người dùng", success = false });
                }

                // Get current user permissions
                var currentPermissions = await db.PhanQuyenUsers
                    .Where(p => p.ID_TaiKhoan == model.userId)
                    .ToListAsync();

                // Remove permissions that are not in the new list
                var permissionsToRemove = currentPermissions
                    .Where(p => p.ID_Function.HasValue && !model.functionIds.Contains(p.ID_Function.Value))
                    .ToList();

                foreach (var permission in permissionsToRemove)
                {
                    db.PhanQuyenUsers.Remove(permission);
                }

                // Add new permissions that don't already exist
                var existingFunctionIds = currentPermissions
                    .Where(p => p.ID_Function.HasValue)
                    .Select(p => p.ID_Function.Value)
                    .ToList();

                var functionsToAdd = model.functionIds
                    .Where(id => !existingFunctionIds.Contains(id))
                    .ToList();

                foreach (var functionId in functionsToAdd)
                {
                    db.PhanQuyenUsers.Add(new PhanQuyenUser
                    {
                        ID_TaiKhoan = model.userId,
                        ID_Function = functionId
                    });
                }

                await db.SaveChangesAsync();

                return Ok(new { message = "Phân quyền người dùng đã được cập nhật thành công", success = true });
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }
        // Add this class at the bottom of the file or in a separate Models folder
        public class UserPermissionsModel
        {
            public int userId { get; set; }
            public List<int> functionIds { get; set; }
        }

        // PUT: api/v1/admin/Update-User
        [HttpPut]
        [Route("Update-User")]
        public async Task<IHttpActionResult> UpdateUser(TaiKhoan Item)
        {
            try
            {
                if (Item == null || Item.ID <= 0) // Change Item.Id to Item.ID
                {
                    return BadRequest("Dữ liệu không hợp lệ");
                }

                // Find user in database
                var existingUser = await db.TaiKhoans.FindAsync(Item.ID); // Change Item.Id to Item.ID
                if (existingUser == null)
                {
                    return NotFound();
                }

                // Check for unique username with different ID
                var duplicateUsername = await db.TaiKhoans
                    .FirstOrDefaultAsync(u => u.TenTaiKhoan == Item.TenTaiKhoan && u.ID != Item.ID); // Change Item.Id to Item.ID
                if (duplicateUsername != null)
                {
                    return Content(HttpStatusCode.BadRequest, new { message = "Tên tài khoản đã tồn tại trong hệ thống", success = false });
                }

                // Check for unique email with different ID
                var duplicateEmail = await db.TaiKhoans
                    .FirstOrDefaultAsync(u => u.Gmail == Item.Gmail && u.ID != Item.ID); // Change Item.Id to Item.ID
                if (duplicateEmail != null)
                {
                    return Content(HttpStatusCode.BadRequest, new { message = "Gmail đã được sử dụng bởi tài khoản khác", success = false });
                }

                // Update user information
                existingUser.TenTaiKhoan = Item.TenTaiKhoan;
                existingUser.Gmail = Item.Gmail;
                existingUser.SDT = Item.SDT;
                existingUser.ID_role = Item.ID_role;
                existingUser.IsBanned = Item.IsBanned;
                existingUser.CountPasswordFail = 0;
                existingUser.LockTime = null;
                existingUser.LockTimeout = null;
                unixTimestamp = (int)DateTimeOffset.UtcNow.ToUnixTimeSeconds();
                existingUser.NgayCapNhat = unixTimestamp;

                await db.SaveChangesAsync();

                return Ok(new { message = "Cập nhật thông tin tài khoản thành công", success = true });
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        // Del: api/v1/admin/Delete-User
        [HttpPost]
        [Route("Delete-User")]
        public async Task<IHttpActionResult> DeleteRole(TaiKhoan Item) 
        {
            try
            {
                if (Item == null || Item.ID <= 0)
                {
                    return Ok(new { message = "Dữ liệu không hợp lệ", success = false });

                }
                // Kiểm tra xem role có tồn tại không
                var existingRole = await db.TaiKhoans.FindAsync(Item.ID);
                if (existingRole == null)
                {
                    return Ok(new { message = "Không tìm thấy tài khoản", success = false });

                }
                // Get BaiViet của tài khoản và update lại
                var user_baiviet = await db.BaiViets
                    .Where(p => p.ID_NguoiDang == Item.ID)
                    .ToListAsync();
                foreach (var post in user_baiviet)
                {
                    post.ID_NguoiDang = null; 
                }
                // Get PhanQuyenUsers for the taikhoan
                var userPermissions = await db.PhanQuyenUsers
                    .Where(p => p.ID_TaiKhoan == Item.ID)
                    .ToListAsync();
                // Xoá tất cả chức năng liên quan đến tài khoản này
                foreach (var permission in userPermissions)
                {
                    db.PhanQuyenUsers.Remove(permission);
                }
                // Xóa TaiKhoan
                db.TaiKhoans.Remove(existingRole);
                await db.SaveChangesAsync();
                return Ok(new { message = "Xóa tài khoản thành công", success = true }); 
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }


    }
}
