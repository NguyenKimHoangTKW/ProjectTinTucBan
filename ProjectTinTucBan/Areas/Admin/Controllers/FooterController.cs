using System.IO;
using System.Web.Mvc;
using Newtonsoft.Json.Linq;

namespace ProjectTinTucBan.Areas.Admin.Controllers
{
    public class FooterController : Controller
{
    // GET: Admin/Footer/Edit
    public ActionResult Edit()
    {
        var path = Server.MapPath("~/Content/data.json");
        if (!System.IO.File.Exists(path))
        {
            return HttpNotFound("Không tìm thấy file data.json");
        }

        var json = System.IO.File.ReadAllText(path);
        var data = JObject.Parse(json);
        // Specify the custom view path
        return View("~/Areas/Admin/Views/InterfaceAdmin/EditFooter.cshtml", data);
    }

    // POST: Admin/Footer/Edit
    [HttpPost]
    [ValidateAntiForgeryToken]
    public ActionResult Edit(FormCollection form)
    {
        var path = Server.MapPath("~/Content/data.json");
        if (!System.IO.File.Exists(path))
        {
            return HttpNotFound("Không tìm thấy file data.json");
        }

        var data = new JObject
        {
            ["fullName"] = form["fullName"],
            ["englishName"] = form["englishName"],
            ["established"] = form["established"],
            ["address"] = form["address"],
            ["phone"] = form["phone"],
            ["email"] = form["email"],
            ["videoUrl"] = form["videoUrl"],
            ["footerCopyright"] = form["footerCopyright"],
            ["footerNote"] = form["footerNote"]
        };

        System.IO.File.WriteAllText(path, data.ToString());
        TempData["Success"] = "Cập nhật footer thành công!";
        // Redirect to the custom view
        return RedirectToAction("Edit");
    }
}
}