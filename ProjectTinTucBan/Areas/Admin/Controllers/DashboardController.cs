using ProjectTinTucBan.Models;
using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web.Http;
using System.Web.Routing;

namespace ProjectTinTucBan.Areas.Admin.Controllers
{
    [RoutePrefix("api/v1/admin")]
    public class DashboardController : ApiController
    {
        
        WebTinTucTDMUEntities db = new WebTinTucTDMUEntities();
        private int unixTimestamp;
        public DashboardController()
        {
            DateTime now = DateTime.UtcNow;
            unixTimestamp = (int)(now.Subtract(new DateTime(1970, 1, 1))).TotalSeconds;
        }

        [Route("dashboard"), HttpGet]
        public async Task<IHttpActionResult> GetDashboardData()
        {
            try
            {
                // Lấy thời điểm hiện tại (UTC)
                DateTime now = DateTime.UtcNow;
                int unixTimestamp = (int)(now.Subtract(new DateTime(1970, 1, 1))).TotalSeconds;

                // Đầu ngày hiện tại (UTC)
                DateTime startOfDay = new DateTime(now.Year, now.Month, now.Day, 0, 0, 0, DateTimeKind.Utc);
                int unixStartOfDay = (int)(startOfDay.Subtract(new DateTime(1970, 1, 1))).TotalSeconds;

                // Đầu tháng hiện tại (UTC)
                DateTime startOfMonth = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
                int unixStartOfMonth = (int)(startOfMonth.Subtract(new DateTime(1970, 1, 1))).TotalSeconds;

                // Đầu năm hiện tại (UTC)
                DateTime startOfYear = new DateTime(now.Year, 1, 1, 0, 0, 0, DateTimeKind.Utc);
                int unixStartOfYear = (int)(startOfYear.Subtract(new DateTime(1970, 1, 1))).TotalSeconds;

                // Lượt xem theo ngày
                var dayViews = db.BaiViets
                    .Where(bv => bv.NgayDang >= unixStartOfDay && bv.NgayDang <= unixTimestamp)
                    .Sum(bv => (int?)bv.ViewCount) ?? 0;

                // Lượt xem theo tháng
                var monthViews = db.BaiViets
                    .Where(bv => bv.NgayDang >= unixStartOfMonth && bv.NgayDang <= unixTimestamp)
                    .Sum(bv => (int?)bv.ViewCount) ?? 0;

                // Lượt xem theo năm
                var yearViews = db.BaiViets
                    .Where(bv => bv.NgayDang >= unixStartOfYear && bv.NgayDang <= unixTimestamp)
                    .Sum(bv => (int?)bv.ViewCount) ?? 0;

                var totalArticles = await db.BaiViets.CountAsync();

                var dashboardData = new
                {
                    DayViews = dayViews,
                    MonthViews = monthViews,
                    YearViews = yearViews,
                    TotalArticles = totalArticles
                };
                return Ok(dashboardData);
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        [Route("dashboard/chart"), HttpGet]
        public IHttpActionResult GetChartData(string type)
        {
            try
            {
                DateTime now = DateTime.UtcNow;
                var labels = new List<string>();
                var data = new List<int>();

                if (type == "day")
                {
                    // Theo giờ trong ngày hiện tại
                    DateTime startOfDay = new DateTime(now.Year, now.Month, now.Day, 0, 0, 0, DateTimeKind.Utc);
                    for (int h = 0; h < 24; h++)
                    {
                        DateTime hourStart = startOfDay.AddHours(h);
                        DateTime hourEnd = hourStart.AddHours(1);
                        int unixStart = (int)(hourStart.Subtract(new DateTime(1970, 1, 1))).TotalSeconds;
                        int unixEnd = (int)(hourEnd.Subtract(new DateTime(1970, 1, 1))).TotalSeconds;

                        int viewCount = db.BaiViets
                            .Where(bv => bv.NgayDang >= unixStart && bv.NgayDang < unixEnd)
                            .Sum(bv => (int?)bv.ViewCount) ?? 0;

                        labels.Add(h.ToString());
                        data.Add(viewCount);
                    }
                }
                else if (type == "month")
                {
                    // Theo ngày trong tháng hiện tại
                    DateTime startOfMonth = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
                    int daysInMonth = DateTime.DaysInMonth(now.Year, now.Month);
                    for (int d = 1; d <= daysInMonth; d++)
                    {
                        DateTime dayStart = new DateTime(now.Year, now.Month, d, 0, 0, 0, DateTimeKind.Utc);
                        DateTime dayEnd = dayStart.AddDays(1);
                        int unixStart = (int)(dayStart.Subtract(new DateTime(1970, 1, 1))).TotalSeconds;
                        int unixEnd = (int)(dayEnd.Subtract(new DateTime(1970, 1, 1))).TotalSeconds;

                        int viewCount = db.BaiViets
                            .Where(bv => bv.NgayDang >= unixStart && bv.NgayDang < unixEnd)
                            .Sum(bv => (int?)bv.ViewCount) ?? 0;

                        labels.Add(d.ToString());
                        data.Add(viewCount);
                    }
                }
                else if (type == "year")
                {
                    // Theo tháng trong năm hiện tại
                    for (int m = 1; m <= 12; m++)
                    {
                        DateTime monthStart = new DateTime(now.Year, m, 1, 0, 0, 0, DateTimeKind.Utc);
                        DateTime monthEnd = (m < 12)
                            ? new DateTime(now.Year, m + 1, 1, 0, 0, 0, DateTimeKind.Utc)
                            : new DateTime(now.Year + 1, 1, 1, 0, 0, 0, DateTimeKind.Utc);

                        int unixStart = (int)(monthStart.Subtract(new DateTime(1970, 1, 1))).TotalSeconds;
                        int unixEnd = (int)(monthEnd.Subtract(new DateTime(1970, 1, 1))).TotalSeconds;

                        int viewCount = db.BaiViets
                            .Where(bv => bv.NgayDang >= unixStart && bv.NgayDang < unixEnd)
                            .Sum(bv => (int?)bv.ViewCount) ?? 0;

                        labels.Add(m.ToString());
                        data.Add(viewCount);
                    }
                }
                else
                {
                    // Trả về rỗng nếu type không hợp lệ
                    return Ok(new { labels = new List<string>(), data = new List<int>() });
                }

                return Ok(new { labels, data });
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        [Route("top10-baiviet-thang"), HttpGet]
        public async Task<IHttpActionResult> GetTop10BaiVietTrongThang()
        {
            try
            {
                // Lấy thời điểm hiện tại (UTC)
                DateTime now = DateTime.UtcNow;
                int unixNow = (int)(now.Subtract(new DateTime(1970, 1, 1))).TotalSeconds;

                // Đầu tháng hiện tại (UTC)
                DateTime startOfMonth = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
                int unixStartOfMonth = (int)(startOfMonth.Subtract(new DateTime(1970, 1, 1))).TotalSeconds;

                // Truy vấn lấy 10 bài viết có lượt xem cao nhất trong tháng
                var top10BaiViet = await db.BaiViets
                    .Where(bv => bv.NgayDang >= unixStartOfMonth && bv.NgayDang <= unixNow)
                    .OrderByDescending(bv => bv.ViewCount)
                    .Take(10)
                    .Select(bv => new
                    {
                        bv.ID,
                        bv.TieuDe,
                        
                        bv.ID_MucLuc,
                        bv.NgayDang,
                        bv.NgayCapNhat,
                        bv.LinkThumbnail,
                        
                        bv.ViewCount
                    })
                    .ToListAsync();

                return Ok(top10BaiViet);
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }
    }
}