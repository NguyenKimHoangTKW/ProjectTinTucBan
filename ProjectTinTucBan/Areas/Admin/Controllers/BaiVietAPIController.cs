using Microsoft.Ajax.Utilities;
using ProjectTinTucBan.Helper;
using ProjectTinTucBan.Models;
using System;
using System.ComponentModel.DataAnnotations.Schema;
using System.Data.Entity;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading.Tasks;
using System.Web;
using System.Web.Http;

namespace ProjectTinTucBan.Areas.Admin.Controllers
{

    [RoutePrefix("api/v1/admin")]
    public class BaiVietAPIController : ApiController
    {
        WebTinTucTDMUEntities db = new WebTinTucTDMUEntities();
        private int GetUnixTimestamp()
        {
            return (int)(DateTime.UtcNow.Subtract(new DateTime(1970, 1, 1))).TotalSeconds;
        }

        [HttpPost]
        [Route("increase-views/{id}")]
        public IHttpActionResult IncreaseViews(int id)
        {
            if (id <= 0)
                return BadRequest("ID không hợp lệ.");

            var bv = db.BaiViets.Find(id);
            if (bv == null)
                return NotFound();

            bv.ViewCount = (bv.ViewCount ?? 0) + 1;
            bv.ViewUpdate = GetUnixTimestamp();

            try
            {
                db.SaveChanges();
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }

            return Ok(new { success = true, viewCount = bv.ViewCount });
        }
        // GET: Lấy tất cả bài viết
        [HttpGet]
        [Route("get-all-baiviet")]
        public async Task<IHttpActionResult> GetAllBaiViet()
        {
            var data = await db.BaiViets
                .OrderByDescending(x => x.ID)
                .Select(x => new
                {
                    x.ID,
                    x.TieuDe,
                    x.NoiDung,
                    x.LinkThumbnail,
                    x.LinkPDF,
                    x.NgayDang,
                    x.NgayCapNhat,
                    x.ViewCount,
                    MucLuc = x.MucLuc != null ? new
                    {
                        x.MucLuc.ID,
                        x.MucLuc.TenMucLuc
                    } : null,
                    ID_MucLuc = x.ID_MucLuc,
                    NguoiDang = x.TaiKhoan != null ? new
                    {
                        x.TaiKhoan.ID,
                        x.TaiKhoan.TenTaiKhoan
                    } : null
                })
                .ToListAsync();

            return Ok(new { data, success = true });
        }

        // GET: Lấy bài viết theo ID
        [HttpGet]
        [Route("get-baiviet-by-id/{id}")]
        public async Task<IHttpActionResult> GetBaiVietById(int id)
        {
            var baiViet = await db.BaiViets.FindAsync(id);
            if (baiViet == null)
                return NotFound();

            // Load mục lục và người đăng nếu có
            if (baiViet.ID_MucLuc.HasValue)
                await db.Entry(baiViet).Reference(x => x.MucLuc).LoadAsync();

            if (baiViet.ID_NguoiDang.HasValue)
                await db.Entry(baiViet).Reference(x => x.TaiKhoan).LoadAsync();

            // ✅ Lấy danh sách bài viết cùng mục lục (khác bài hiện tại)
            var baiVietsCungMuc = await db.BaiViets
                .Where(b => b.ID_MucLuc == baiViet.ID_MucLuc && b.ID != baiViet.ID)
                .OrderByDescending(b => b.NgayDang)
                .Take(10)
                .Select(b => new
                {
                    b.ID,
                    b.TieuDe,
                    b.LinkThumbnail,
                    b.NgayDang
                })
                .ToListAsync();

            return Ok(new
            {
                success = true,
                data = new
                {
                    baiViet.ID,
                    baiViet.TieuDe,
                    baiViet.NoiDung,
                    baiViet.LinkThumbnail,
                    baiViet.LinkPDF,
                    baiViet.NgayDang,
                    baiViet.NgayCapNhat,
                    baiViet.ViewCount,
                    baiViet.ID_MucLuc,
                    MucLuc = baiViet.MucLuc != null ? new
                    {
                        baiViet.MucLuc.ID,
                        baiViet.MucLuc.TenMucLuc
                    } : null,
                    NguoiDang = baiViet.TaiKhoan != null ? new
                    {
                        baiViet.TaiKhoan.ID,
                        baiViet.TaiKhoan.TenTaiKhoan
                    } : null,
                    BaiVietsCungMuc = baiVietsCungMuc
                }
            });
        }


        // POST: Thêm bài viết
        [HttpPost]
        [Route("them-baiviet")]
        public async Task<IHttpActionResult> ThemBaiViet([FromBody] BaiViet model)
        {
            if (model == null || string.IsNullOrWhiteSpace(model.TieuDe))
                return Json(new { success = false, message = "Dữ liệu không hợp lệ." });

            try
            {
                int currentTimestamp = GetUnixTimestamp();
                var tk = Helper.SessionHelper.GetUser();
                if (tk == null)
                    return Json(new { success = false, message = "Bạn cần đăng nhập để thực hiện thao tác này." });
                // Gán thêm ngày đăng + view + tài khoản
                model.NgayDang = currentTimestamp;
                model.NgayCapNhat = currentTimestamp;
                model.ViewCount = 0;
                model.ID_NguoiDang = tk.ID; // Lấy ID người đăng từ session

                if (model.ID_NguoiDang <= 0)
                    return Json(new { success = false, message = "Thiếu ID người đăng bài." });

                db.BaiViets.Add(model);
                await db.SaveChangesAsync();

                // Trả về thông tin tài khoản đang đăng nhập (không trả về mật khẩu)
                var userInfo = new
                {
                    tk.ID,
                    tk.TenTaiKhoan,
                    tk.Name,
                    tk.Gmail,
                    tk.SDT,
                    tk.ID_role
                };

                return Ok(new { success = true, message = "Thêm bài viết thành công.", data = model, user = userInfo });
            }
            catch (Exception ex)
            {
                return Json(new
                {
                    success = false,
                    message = "Lỗi khi thêm bài viết.",
                    error = ex.Message
                });
            }
        }


        // PUT: Cập nhật bài viết
        [HttpPut]
        [Route("update-baiviet/{id}")]
        public async Task<IHttpActionResult> UpdateBaiViet(int id, [FromBody] BaiViet updatedBaiViet)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var existing = await db.BaiViets.FindAsync(id);
            if (existing == null)
                return NotFound();

            existing.TieuDe = updatedBaiViet.TieuDe;
            existing.NoiDung = updatedBaiViet.NoiDung;
            existing.LinkThumbnail = updatedBaiViet.LinkThumbnail;
            existing.LinkPDF = updatedBaiViet.LinkPDF;
            existing.ID_MucLuc = updatedBaiViet.ID_MucLuc;
            existing.NgayCapNhat = GetUnixTimestamp();
            await db.SaveChangesAsync();

            return Ok(new { success = true, message = "Cập nhật bài viết thành công." });
        }

        // DELETE: Xóa bài viết
        [HttpDelete]
        [Route("xoa-baiviet/{id}")]
        public async Task<IHttpActionResult> XoaBaiViet(int id)
        {
            try
            {
                var baiViet = await db.BaiViets.FindAsync(id);
                if (baiViet == null)
                    return Json(new { success = false, message = "Không tìm thấy bài viết." });

                // Lấy người dùng hiện tại từ session
                var currentUser = Helper.SessionHelper.GetUser();
                if (currentUser == null)
                    return Json(new { success = false, message = "Bạn cần đăng nhập." });

                // Cho phép xóa nếu: là admin (id_role == 1) hoặc là tác giả
                if (currentUser.ID_role != 1 && baiViet.ID_NguoiDang != currentUser.ID)
                {
                    return Json(new
                    {
                        success = false,
                        message = "Bạn không có quyền xóa bài viết này."
                    });
                }

                db.BaiViets.Remove(baiViet);
                await db.SaveChangesAsync();

                return Ok(new { success = true, message = "Xóa bài viết thành công." });
            }
            catch (Exception ex)
            {
                return Json(new
                {
                    success = false,
                    message = "Lỗi trong quá trình xóa.",
                    error = ex.Message
                });
            }
        }

        // PUT: Cập nhật nội dung bài viết
        [HttpPut]
        [Route("update-noidung/{id}")]
        public async Task<IHttpActionResult> UpdateNoiDung(int id, [FromBody] dynamic body)
        {
            if (body == null || body.noiDung == null)
            {
                return Json(new
                {
                    success = false,
                    message = "Nội dung không được để trống."
                });
            }

            var baiViet = await db.BaiViets.FindAsync(id);
            if (baiViet == null)
            {
                return Json(new
                {
                    success = false,
                    message = "Không tìm thấy bài viết."
                });
            }

            var currentUser = SessionHelper.GetUser();
            if (currentUser == null)
            {
                return Json(new
                {
                    success = false,
                    message = "Bạn cần đăng nhập để thực hiện thao tác này."
                });
            }

            // ✅ Phân quyền: chỉ admin (ID_role == 1) hoặc là người đăng mới được sửa
            if (currentUser.ID_role != 1 && baiViet.ID_NguoiDang != currentUser.ID)
            {
                return Json(new
                {
                    success = false,
                    message = "Bạn không có quyền sửa bài viết này."
                });
            }

            try
            {
                baiViet.NoiDung = (string)body.noiDung;
                baiViet.NgayCapNhat = GetUnixTimestamp();

                await db.SaveChangesAsync();

                return Ok(new
                {
                    success = true,
                    message = "Cập nhật nội dung thành công."
                });
            }
            catch (Exception ex)
            {
                // Có thể log thêm ex.StackTrace nếu cần
                return Json(new
                {
                    success = false,
                    message = "Lỗi khi cập nhật nội dung.",
                    error = ex.Message
                });
            }
        }


        // GET: Lấy danh sách ảnh từ thư viện
        [HttpGet]
        [Route("thu-vien-anh")]
        public IHttpActionResult GetThuVienAnh()
        {
            try
            {
                string folderPath = HttpContext.Current.Server.MapPath("~/Uploads/Thumbnails/");
                string baseUrl = $"{Request.RequestUri.Scheme}://{Request.RequestUri.Authority}/Uploads/Thumbnails";

                if (!Directory.Exists(folderPath))
                    return Ok(new { success = true, data = new string[0] });

                // Lấy file và gom nhóm theo tên gốc (bỏ timestamp)
                var grouped = Directory.GetFiles(folderPath)
                    .Where(file => new[] { ".jpg", ".jpeg", ".png", ".gif", ".bmp" }
                        .Contains(Path.GetExtension(file).ToLower()))
                    .GroupBy(file =>
                    {
                        // Bỏ timestamp phía sau (nếu có dạng _yyyyMMddHHmmss)
                        var fileName = Path.GetFileNameWithoutExtension(file);
                        var baseName = fileName;
                        int idx = fileName.LastIndexOf('_');
                        if (idx != -1 && fileName.Length - idx >= 15) // có thể là timestamp
                            baseName = fileName.Substring(0, idx);
                        return baseName.ToLower(); // group key
                    })
                    .Select(g => g.OrderByDescending(f => f).First()) // chọn ảnh mới nhất mỗi nhóm
                    .Select(file => $"{baseUrl}/{Path.GetFileName(file)}")
                    .ToList();

                return Ok(new { success = true, data = grouped });
            }
            catch (Exception ex)
            {
                return Json(new
                {
                    success = false,
                    message = "Không thể tải thư viện ảnh.",
                    error = ex.Message
                });
            }
        }

        // GET: Lấy danh sách mục lục
        [HttpGet]
        [Route("get-all-mucluc")]
        public async Task<IHttpActionResult> GetAllMucLuc()
        {
            var data = await db.MucLucs
                .Where(m => m.IsActive)
                .OrderBy(x => x.ThuTuShow)
                .Select(x => new
                {
                    x.ID,
                    x.TenMucLuc,
                    x.Link,
                    x.ThuTuShow
                })
                .ToListAsync();

            return Ok(new { data, success = true });
        }
        // GET: Lấy bài viết theo mục lục
        [HttpGet]
        [Route("get-baiviet-by-mucluc/{mucLucId}")]
        public async Task<IHttpActionResult> GetBaiVietByMucLuc(int mucLucId)
        {
            var data = await db.BaiViets
                .Where(x => x.ID_MucLuc == mucLucId)
                .OrderByDescending(x => x.ID)
                .Select(x => new
                {
                    x.ID,
                    x.TieuDe,
                    x.NoiDung,
                    x.LinkThumbnail,
                    x.LinkPDF,
                    x.NgayDang,
                    x.NgayCapNhat,
                    x.ViewCount,
                    ID_MucLuc = x.ID_MucLuc
                })
                .ToListAsync();

            return Ok(new { data, success = true });
        }
        [HttpGet]
        [Route("download-pdf")]
        public IHttpActionResult DownloadPdf(string fileName, string originalName)
        {
            if (string.IsNullOrWhiteSpace(fileName))
            {
                return Json(new { success = false, message = "Thiếu tên tệp tin." });
            }

            var path = HttpContext.Current.Server.MapPath($"~/Uploads/PDFs/{fileName}");
            if (!File.Exists(path))
            {
                return Json(new { success = false, message = "Không tìm thấy tệp PDF." });
            }

            var bytes = File.ReadAllBytes(path);
            var stream = new MemoryStream(bytes);

            var response = new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StreamContent(stream)
            };
            response.Content.Headers.ContentType = new MediaTypeHeaderValue("application/pdf");

            string displayName = originalName ?? fileName;
            string headerValue = $"attachment; filename*=UTF-8''{Uri.EscapeDataString(displayName)}";
            response.Content.Headers.ContentDisposition = ContentDispositionHeaderValue.Parse(headerValue);

            return ResponseMessage(response); // ✅ Chuẩn API
        }
    }
}