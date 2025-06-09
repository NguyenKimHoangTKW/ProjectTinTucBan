using System.Web;
using System.Web.Optimization;

namespace ProjectTinTucBan
{
    public class BundleConfig
    {
        // For more information on bundling, visit https://go.microsoft.com/fwlink/?LinkId=301862
        public static void RegisterBundles(BundleCollection bundles)
        {
            bundles.Add(new ScriptBundle("~/bundles/jquery").Include(
                        "~/Scripts/jquery-{version}.js"));

            // Use the development version of Modernizr to develop with and learn from. Then, when you're
            // ready for production, use the build tool at https://modernizr.com to pick only the tests you need.
            bundles.Add(new ScriptBundle("~/bundles/modernizr").Include(
                        "~/Scripts/modernizr-*"));

            bundles.Add(new Bundle("~/bundles/bootstrap").Include(
                      "~/Scripts/bootstrap.js"));

            bundles.Add(new StyleBundle("~/Content/css").Include(
                      "~/Content/bootstrap.css",
                      "~/Content/site.css"));
            bundles.Add(new ScriptBundle("~/bundles/CTDT/js").Include(
                        "~/Areas/assets/js/vendors.min.js",
                        "~/Areas/assets/vendors/chartjs/Chart.min.js",
                        "~/Areas/assets/js/app.min.js",
                        "~/Areas/assets/vendors/select2/select2.min.js",
                        "~/Areas/assets/js/sweetalert2@11.js",
                        "~/Areas/assets/js/xlsx.full.min.js",
                        "~/Areas/assets/js/exceljs.min.js",
                        "~/Areas/assets/js/FileSaver.min.js",
                        "~/Areas/assets/vendors/datatables/jquery.dataTables.min.js",
                        "~/Areas/assets/vendors/datatables/dataTables.bootstrap.min.js",
                        "~/Areas/assets/js/dataTables.buttons.min.js",
                        "~/Areas/assets/js/jszip.min.js",
                        "~/Areas/assets/js/pdfmake.min.js",
                        "~/Areas/assets/js/vfs_fonts.js",
                        "~/Areas/assets/js/buttons.html5.min.js",
                        "~/Areas/assets/js/buttons.print.min.js"));
        }
    }
}
