using ProjectTinTucBan.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Web;
using System.Web.Mvc;

public class TinTucController : Controller
{
    WebTinTucTDMUEntities db = new WebTinTucTDMUEntities();

    // GET: /tin-tuc/chi-tiet/5
    public async Task<ActionResult> ChiTiet(int id)
    {
        var baiViet = await db.BaiViets.FindAsync(id);
        if (baiViet == null)
            return HttpNotFound();

        return View(baiViet);
    }
}
