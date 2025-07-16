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
                // Kiểm tra dữ liệu đầu vào có hợp lệ không
                if (Item == null)
                {
                    return Ok(new { message = "Dữ liệu không hợp lệ", success = false });
                }

                // Kiểm tra xem tên chức năng đã tồn tại chưa
                var existingFunction = await db.ChucNangQuyenUsers.FirstOrDefaultAsync(x => x.TenChucNang == Item.TenChucNang);
                if (existingFunction != null)
                {
                    return Ok(new { message = "Chức năng đã tồn tại", success = false });
                }

                // Kiểm tra xem mã chức năng đã tồn tại chưa
                var existingIdFunction = await db.ChucNangQuyenUsers.FirstOrDefaultAsync(x => x.MaChucNang == Item.MaChucNang);
                if (existingIdFunction != null)
                {
                    return Ok(new { message = "Mã chức năng đã tồn tại", success = false });
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

                // Trả về kết quả thành công 
                return Ok(new { message = "Thêm chức năng thành công", success = true });
            }
            catch (Exception ex)
            {
                // Xử lý ngoại lệ và trả về thông báo lỗi dễ hiểu
                return Ok(new
                {
                    message = "Lỗi hệ thống: " + ex.Message,
                    success = false
                });
            }
        }


        // Define a new model to include menu IDs
        public class UpdateFunctionRequest
        {
            public ChucNangQuyenUser Function { get; set; }
            public List<int> MenuIds { get; set; }
        }

        // PUT: api/v1/admin/Update-Function/{id}
        [HttpPut]
        [Route("Update-Function/{id:int}")]
        public async Task<IHttpActionResult> UpdateFunction(int id, [FromBody] UpdateFunctionRequest request)
        {
            try
            {
                if (request == null || request.Function == null)
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
                existingFunction.MaChucNang = request.Function.MaChucNang;
                existingFunction.TenChucNang = request.Function.TenChucNang;
                existingFunction.MoTa = request.Function.MoTa;
                existingFunction.NgayCapNhat = unixTimestamp;

                // Handle menu associations if provided
                if (request.MenuIds != null)
                {
                    // Delete existing function-menu associations
                    var existingMenus = db.Function_By_Menu.Where(f => f.ID_FUNCTION == id).ToList();
                    foreach (var menu in existingMenus)
                    {
                        db.Function_By_Menu.Remove(menu);
                    }

                    // Create new function-menu associations
                    foreach (var menuId in request.MenuIds)
                    {
                        db.Function_By_Menu.Add(new Function_By_Menu
                        {
                            ID_FUNCTION = id,
                            ID_MENU = menuId
                        });
                    }
                }

                // Save all changes
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
                    return Ok(new
                    {
                        message = "Không tìm thấy chức năng",
                        success = false
                    });
                }

                // check xoá bên bảng PhanQuyenUser
                var permissionsInUser = await db.PhanQuyenUsers
                    .Where(p => p.ID_Function == id)
                    .ToListAsync();

                foreach (var permission in permissionsInUser)
                {
                    db.PhanQuyenUsers.Remove(permission);
                }

                // Check xoá bên bảng Function_By_Menu (PhanQuyenMenu)
                var permissionsInMenu = await db.Function_By_Menu
                    .Where(f => f.ID_FUNCTION == id)
                    .ToListAsync();

                foreach (var permission in permissionsInMenu)
                {
                    db.Function_By_Menu.Remove(permission);
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

        [HttpGet]
        [Route("function-menus/{id:int}")]
        public async Task<IHttpActionResult> GetFunctionMenus(int id)
        {
            try
            {
                var functionMenus = await db.Function_By_Menu
                    .Where(f => f.ID_FUNCTION == id)
                    .Select(f => new {
                        MenuId = f.ID_MENU,
                        MenuName = f.Menu.Ten,
                        MenuLink = f.Menu.Link
                    })
                    .ToListAsync();

                return Ok(functionMenus);
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }
    }
}
