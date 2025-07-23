using ProjectTinTucBan.Models;
using ProjectTinTucBan.Helper;
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

        public class UserPermissionsModel
        {
            public int userId { get; set; }
            public List<int> functionIds { get; set; }
        }

        public UserAdminAPIController()
        {
            DateTime now = DateTime.UtcNow;
            unixTimestamp = (int)(now.Subtract(new DateTime(1970, 1, 1))).TotalSeconds;
        }

        // GET: api/v1/admin/Get-All-Users
        [HttpGet]
        [Route("Get-All-Users")]
        public async Task<IHttpActionResult> GetAllUsers()
        {
            var userSession = SessionHelper.GetUser();
            var users = await db.TaiKhoans
                .Select(x => new
                {
                    x.ID,
                    x.ID_role,
                    x.TenTaiKhoan,
                    x.Name,
                    x.Gmail,
                    x.SDT,
                    x.IsBanned,
                    x.NgayTao,
                    x.NgayCapNhat
                })
                .ToListAsync();

            if (users.Count > 0)
            {
                return Ok(new { data = users, success = true });
            }
            else
            {
                return Ok(new { message = "Không có thông tin tài khoản", data = new object[0], success = false });
            }
        }

        // GET: api/v1/admin/Get-User-By-Id/{id}
        [HttpGet]
        [Route("Get-User-By-Id/{id}")]
        public async Task<IHttpActionResult> GetUserById(int id)
        {
            var userSession = SessionHelper.GetUser();
            try
            {
                var user = await db.TaiKhoans.FindAsync(id);

                if (user == null)
                {
                    return Ok(new { message = "Không tìm thấy tài khoản", success = false });
                }

                var userData = new
                {
                    user.ID,
                    user.ID_role,
                    user.TenTaiKhoan,
                    user.Name,
                    user.Gmail,
                    user.SDT,
                    user.IsBanned,
                    user.NgayTao,
                    user.NgayCapNhat
                };

                return Ok(new { data = userData, success = true });
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        // GET: api/v1/admin/Get-User-Permissions/{userId}
        [HttpGet]
        [Route("Get-User-Permissions/{userId}")]
        public async Task<IHttpActionResult> GetUserPermissions(int userId)
        {
            var userSession = SessionHelper.GetUser();
            try
            {
                var user = await db.TaiKhoans.FindAsync(userId);
                if (user == null)
                {
                    return NotFound();
                }

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
            var userSession = SessionHelper.GetUser();
            try
            {
                if (model == null || model.userId <= 0)
                {
                    return Ok(new { message = "Dữ liệu không hợp lệ", success = false });
                }

                var user = await db.TaiKhoans.FindAsync(model.userId);
                if (user == null)
                {
                    return Ok(new { message = "Không tìm thấy người dùng", success = false });
                }

                var currentPermissions = await db.PhanQuyenUsers
                    .Where(p => p.ID_TaiKhoan == model.userId)
                    .ToListAsync();

                var permissionsToRemove = currentPermissions
                    .Where(p => p.ID_Function.HasValue && !model.functionIds.Contains(p.ID_Function.Value))
                    .ToList();

                foreach (var permission in permissionsToRemove)
                {
                    db.PhanQuyenUsers.Remove(permission);
                }

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

        // PUT: api/v1/admin/Update-User
        [HttpPut]
        [Route("Update-User")]
        public async Task<IHttpActionResult> UpdateUser(TaiKhoan Item)
        {
            var userSession = SessionHelper.GetUser();
            try
            {
                if (Item == null || Item.ID <= 0)
                {
                    return BadRequest("Dữ liệu không hợp lệ");
                }
                var existingUser = await db.TaiKhoans.FindAsync(Item.ID);
                
                if (existingUser == null)
                {
                    return NotFound();
                }

               
                // Không cho phép chuyển role nếu chỉ còn 1 admin (và đang chuyển chính admin đó)
                if (existingUser.ID_role == 1 && Item.ID_role != 1)
                {
                    int countRole1 = await db.TaiKhoans.CountAsync(u => u.ID_role == 1);
                    if ((countRole1 - 1) == 0)
                    {
                        return Content(HttpStatusCode.BadRequest, new { message = "Không thể cập nhật. Hệ thống phải có ít nhất một tài khoản quản trị viên.", success = false });
                    }
                }

                var duplicateUsername = await db.TaiKhoans
                    .FirstOrDefaultAsync(u => u.TenTaiKhoan == Item.TenTaiKhoan && u.ID != Item.ID);
                if (duplicateUsername != null)
                {
                    return Content(HttpStatusCode.BadRequest, new { message = "Tên tài khoản đã tồn tại trong hệ thống", success = false });
                }

                var duplicateEmail = await db.TaiKhoans
                    .FirstOrDefaultAsync(u => u.Gmail == Item.Gmail && u.ID != Item.ID);
                if (duplicateEmail != null)
                {
                    return Content(HttpStatusCode.BadRequest, new { message = "Gmail đã được sử dụng bởi tài khoản khác", success = false });
                }

                existingUser.TenTaiKhoan = Item.TenTaiKhoan;
                existingUser.Gmail = Item.Gmail;
                existingUser.SDT = Item.SDT;
                existingUser.Name = Item.Name;
                existingUser.ID_role = Item.ID_role;
                existingUser.IsBanned = Item.IsBanned;
                existingUser.CountPasswordFail = 0;
                existingUser.LockTime = null;
                existingUser.LockTimeout = null;
                unixTimestamp = (int)DateTimeOffset.UtcNow.ToUnixTimeSeconds();
                existingUser.NgayCapNhat = unixTimestamp;

                // Handle password update if provided
                if (!string.IsNullOrEmpty(Item.MatKhau))
                {
                    string encryptedPassword = EncryptionHelper.Encrypt(Item.MatKhau);
                    existingUser.MatKhau = encryptedPassword;
                }

                await db.SaveChangesAsync();

                return Ok(new { message = "Cập nhật thông tin tài khoản thành công", success = true });
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        // POST: api/v1/admin/Delete-User
        [HttpPost]
        [Route("Delete-User")]
        public async Task<IHttpActionResult> DeleteUser(TaiKhoan Item)
        {
            var userSession = SessionHelper.GetUser();
            try
            {
                if (Item == null || Item.ID <= 0)
                {
                    return Ok(new { message = "Dữ liệu không hợp lệ", success = false });
                }

                var existingUser = await db.TaiKhoans.FindAsync(Item.ID);
                if (existingUser == null)
                {
                    return Ok(new { message = "Không tìm thấy tài khoản", success = false });
                }

                // Chỉ admin mới được phép xóa
                if (userSession == null || userSession.ID_role != 1)
                {
                    return Content(HttpStatusCode.Forbidden, new { message = "Chỉ tài khoản quản trị viên mới được phép sửa tài khoản.", success = false });
                }

                // Nếu xóa tài khoản admin, kiểm tra số lượng admin
                if (existingUser.ID_role == 1)
                {
                    int countAdmin = await db.TaiKhoans.CountAsync(u => u.ID_role == 1);
                    if (countAdmin == 1)
                    {
                        return Ok(new { message = "Không thể xóa. Hệ thống phải có ít nhất một tài khoản quản trị viên.", success = false });
                    }
                }

                var user_baiviet = await db.BaiViets
                    .Where(p => p.ID_NguoiDang == Item.ID)
                    .ToListAsync();
                foreach (var post in user_baiviet)
                {
                    post.ID_NguoiDang = null;
                }

                var userPermissions = await db.PhanQuyenUsers
                    .Where(p => p.ID_TaiKhoan == Item.ID)
                    .ToListAsync();
                foreach (var permission in userPermissions)
                {
                    db.PhanQuyenUsers.Remove(permission);
                }

                db.TaiKhoans.Remove(existingUser);
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