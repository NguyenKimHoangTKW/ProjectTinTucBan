using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using ProjectTinTucBan.Models;
using System.Threading.Tasks;
using ProjectTinTucBan.Helper;
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
            var user = SessionHelper.GetUser();
            var GetALLMucLuc = await db.MucLucs
                   .OrderBy(x => x.ThuTuShow)
                   .Select(x => new
                   {
                       x.ID,
                       x.TenMucLuc,
                       x.Link,
                       x.ThuTuShow,
                       x.NgayCapNhat,
                       x.NgayDang,
                       x.IsActive

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
                // Sử dụng FindAsync thay vì truy vấn LINQ phức tạp
                var mucLuc = await db.MucLucs.FindAsync(id);

                if (mucLuc != null)
                {
                    // Tạo đối tượng kết quả thủ công để tránh vấn đề với mapping
                    var result = new
                    {
                        ID = mucLuc.ID,
                        TenMucLuc = mucLuc.TenMucLuc,
                        Link = mucLuc.Link,
                        ThuTuShow = mucLuc.ThuTuShow,
                        NgayCapNhat = mucLuc.NgayCapNhat,
                        NgayDang = mucLuc.NgayDang,
                        IsActive = (bool)mucLuc.IsActive
                    };

                    return Ok(new { data = result, success = true });
                }
                else
                {
                    return Ok(new { message = "Không tìm thấy mục lục", success = false });
                }
            }
            catch (Exception ex)
            {
                return Ok(new { message = "Lỗi khi truy vấn dữ liệu", data = new object[0], success = false });
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
                    return Ok(new { message = "Dữ liệu không hợp lệ", data = new object[0], success = false });
                }

                if (string.IsNullOrWhiteSpace(Item.TenMucLuc))
                {
                    return Ok(new { message = "Tên mục lục không được để trống", data = new object[0], success = false });
                }

                if (Item.ThuTuShow <= 0)
                {
                    return Ok(new { message = "Thứ tự hiển thị phải là số dương", data = new object[0], success = false });
                }

                // Kiểm tra xem mục lục đã tồn tại chưa
                var existingMucLuc = await db.MucLucs.FirstOrDefaultAsync(x => x.TenMucLuc == Item.TenMucLuc);
                if (existingMucLuc != null)
                {
                    return Ok(new { message = "Thư mục đã tồn tại", data = new object[0], success = false });
                }

                // Kiểm tra thứ tự show có bị trùng lặp và show TenMucLuc có bị trùng lặp cho người dùng biết
                var duplicateOrder = await db.MucLucs
                    .FirstOrDefaultAsync(x => x.ThuTuShow == Item.ThuTuShow && x.ID != Item.ID);
                if (duplicateOrder != null)
                {
                    return Ok(new
                    {
                        message = $"Thứ tự hiển thị {Item.ThuTuShow} đã được sử dụng cho mục lục '{duplicateOrder.TenMucLuc}'",
                        data = new object[0],
                        success = false
                    });
                }

                // Thêm mới mục lục
                unixTimestamp = (int)DateTimeOffset.UtcNow.ToUnixTimeSeconds();

                var newMucLuc = new MucLuc
                {
                    TenMucLuc = Item.TenMucLuc,
                    Link = Item.Link,
                    ThuTuShow = Item.ThuTuShow,
                    NgayDang = unixTimestamp,
                    NgayCapNhat = unixTimestamp,
                    IsActive = Item.IsActive
                };

                db.MucLucs.Add(newMucLuc);
                await db.SaveChangesAsync();
                return Ok(new { message = "Thêm mới mục lục thành công", data = newMucLuc, success = true });
            }
            catch (Exception ex)
            {
                return Ok(new { message = "Lỗi hệ thống: " + ex.Message, data = new object[0], success = false });
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
                    return Ok(new { message = "Dữ liệu không hợp lệ", data = new object[0], success = false });
                }
                // Kiểm tra xem mục lục có tồn tại không
                var existingMucLuc = await db.MucLucs.FindAsync(Item.ID);
                if (existingMucLuc == null)
                {
                    return Ok(new { message = "Không tìm thấy mục lục này", data = new object[0], success = false });
                }

                // Kiểm tra xem tên mục lục đã tồn tại trong cơ sở dữ liệu với ID khác
                var duplicateName = await db.MucLucs
                    .FirstOrDefaultAsync(x => x.TenMucLuc == Item.TenMucLuc && x.ID != Item.ID);
                if (duplicateName != null)
                {
                    return Ok(new { message = "tên mục lục đã tồn tại trong dữ liệu", data = new object[0], success = false });
                }

                // Kiểm tra thứ tự show có bị trùng lặp và show TenMucLuc có bị trùng lặp cho người dùng biết
                var duplicateOrder = await db.MucLucs
                    .FirstOrDefaultAsync(x => x.ThuTuShow == Item.ThuTuShow && x.ID != Item.ID);
                if (duplicateOrder != null)
                {
                    return Ok(new
                    {
                        message = $"Thứ tự hiển thị {Item.ThuTuShow} đã được sử dụng cho mục lục '{duplicateOrder.TenMucLuc}'",
                        data = new object[0],
                        success = false
                    });
                }

                // Cập nhật thông tin mục lục
                existingMucLuc.TenMucLuc = Item.TenMucLuc;
                existingMucLuc.Link = Item.Link;
                existingMucLuc.ThuTuShow = Item.ThuTuShow;
                existingMucLuc.IsActive = Item.IsActive; // Đã được gửi lên như một số (1 hoặc 0)
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

        // Sửa phương thức UpdateMucLucStatus
        [HttpPost]
        [Route("Update-Muc-Luc-Status")]
        public async Task<IHttpActionResult> UpdateMucLucStatus(MucLuc item)
        {
            try
            {
                if (item == null || item.ID <= 0)
                {
                    return Ok(new { message = "Dữ liệu không hợp lệ", data = new object[0], success = false });
                }

                // Kiểm tra xem mục lục có tồn tại không
                var existingMucLuc = await db.MucLucs.FindAsync(item.ID);
                if (existingMucLuc == null)
                {
                    return Ok(new { message = "Không tìm thấy mục lục", data = new object[0], success = false });
                }

                // Cập nhật trạng thái kích hoạt
                existingMucLuc.IsActive = item.IsActive;
                unixTimestamp = (int)DateTimeOffset.UtcNow.ToUnixTimeSeconds();
                existingMucLuc.NgayCapNhat = unixTimestamp;

                await db.SaveChangesAsync();

                // Message dựa vào giá trị IsActive (boolean)
                string message = item.IsActive ? "Đã kích hoạt mục lục" : "Đã tắt kích hoạt mục lục";

                return Ok(new
                {
                    message = message,
                    success = true
                });
            }
            catch (Exception ex)
            {
                // Ghi log lỗi
                System.Diagnostics.Debug.WriteLine("Lỗi cập nhật trạng thái: " + ex.Message);
                return Ok(new { message = "Lỗi hệ thống: " + ex.Message, data = new object[0], success = false });
            }
        }

        // Sửa phương thức DeleteMucLuc
        [HttpPost]
        [Route("Delete-Muc-Luc")]
        public async Task<IHttpActionResult> DeleteMucLuc(MucLuc Item)
        {
            try
            {
                if (Item == null || Item.ID <= 0)
                {
                    return Ok(new { message = "Dữ liệu không hợp lệ", data = new object[0], success = false });
                }

                // Kiểm tra xem mục lục có tồn tại không
                var existingMucLuc = await db.MucLucs.FindAsync(Item.ID);
                if (existingMucLuc == null)
                {
                    return Ok(new { message = "Không tìm thấy mục lục", data = new object[0], success = false });
                }

                // Kiểm tra bài viết có liên kết với mục lục này không
                var baiVietList = await db.BaiViets.Where(bv => bv.ID_MucLuc == existingMucLuc.ID).ToListAsync();
                if (baiVietList.Count > 0)
                {
                    // Gỡ liên kết tất cả bài viết với mục lục hiện tại
                    foreach (var baiViet in baiVietList)
                    {
                        baiViet.ID_MucLuc = null;
                    }

                    // Lưu thay đổi cho tất cả bài viết một lần duy nhất
                    await db.SaveChangesAsync();

                    // Log thông tin để phục vụ debug
                    System.Diagnostics.Debug.WriteLine($"Đã gỡ liên kết {baiVietList.Count} bài viết khỏi mục lục ID={existingMucLuc.ID}");
                }

                // Xóa mục lục
                db.MucLucs.Remove(existingMucLuc);
                await db.SaveChangesAsync();

                return Ok(new
                {
                    message = "Xóa mục lục thành công",
                    articlesUnlinked = baiVietList.Count,
                    success = true
                });
            }
            catch (Exception ex)
            {
                // Ghi log lỗi
                System.Diagnostics.Debug.WriteLine("Lỗi xóa mục lục: " + ex.Message);
                return Ok(new { message = "Lỗi hệ thống: " + ex.Message, data = new object[0], success = false });
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