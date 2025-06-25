using Newtonsoft.Json;
using ProjectTinTucBan.Models;
using System;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web.Mvc;

namespace ProjectTinTucBan.Controllers
{
    public class HomeController : Controller
    {
        public ActionResult Index()
        {
            return View(); // cần View ~/Views/Home/Index.cshtml tồn tại
        }
        WebTinTucTDMUEntities db = new WebTinTucTDMUEntities();
        public async Task<ActionResult> XemNoiDung(int id)
        {
            using (var client = new HttpClient())
            {
                client.BaseAddress = new System.Uri("https://localhost:44305"); // hoặc domain thực tế

                var response = await client.GetAsync($"/api/v1/admin/get-baiviet-by-id/{id}");
                if (response.IsSuccessStatusCode)
                {
                    var json = await response.Content.ReadAsStringAsync();
                    dynamic result = JsonConvert.DeserializeObject(json);
                    if (result.success == true)
                    {
                        BaiViet baiViet = new BaiViet
                        {
                            ID = result.data.ID,
                            TieuDe = result.data.TieuDe,
                            NoiDung = result.data.NoiDung,
                            LinkPDF = result.data.LinkPDF,
                            LinkThumbnail = result.data.LinkThumbnail,
                            NgayDang = result.data.NgayDang
                        };
                        return View("XemNoiDung", baiViet);
                    }
                }
            }

            return HttpNotFound("Không tìm thấy bài viết.");
        }

    }
}
