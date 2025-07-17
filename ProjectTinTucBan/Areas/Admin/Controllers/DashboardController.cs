using ProjectTinTucBan.Models;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Web.Http;
using System.Data.Entity;
using System.Linq;
using System.Web.Routing;

namespace ProjectTinTucBan.Areas.Admin.Controllers
{
    [RoutePrefix("api/v1/admin")]
    public class DashboardController : ApiController
    {

        WebTinTucTDMUEntities db = new WebTinTucTDMUEntities();
        #region lấy thời gian theo Unix
        private int GetUnixTimestamp(DateTime dt)
        {
            return (int)(dt.ToUniversalTime().Subtract(new DateTime(1970, 1, 1))).TotalSeconds;
        }

        private DateTime GetStartOfDay(DateTime now) => new DateTime(now.Year, now.Month, now.Day, 0, 0, 0, DateTimeKind.Utc);
        private DateTime GetStartOfMonth(DateTime now) => new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        private DateTime GetEndOfMonth(DateTime now) => GetStartOfMonth(now).AddMonths(1);
        private DateTime GetStartOfYear(DateTime now) => new DateTime(now.Year, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        private DateTime GetEndOfYear(DateTime now) => new DateTime(now.Year + 1, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        #endregion


        #region lấy dữ liệu cho dashboard
        [Route("dashboard"), HttpGet]
        public async Task<IHttpActionResult> GetDashboardData()
        {
            try
            {
                #region lấy số liệu hiển thị trên dashboard
                DateTime now = DateTime.UtcNow;

                int unixNow = GetUnixTimestamp(now);
                int unixStartOfDay = GetUnixTimestamp(GetStartOfDay(now));
                int unixStartOfMonth = GetUnixTimestamp(GetStartOfMonth(now));
                int unixStartOfYear = GetUnixTimestamp(GetStartOfYear(now));

                int dayViews = db.BaiViets
                    .Where(bv => bv.ViewUpdate >= unixStartOfDay && bv.ViewUpdate < unixNow)
                    .Sum(bv => (int?)bv.ViewCount) ?? 0;

                int monthViews = db.BaiViets
                    .Where(bv => bv.ViewUpdate >= unixStartOfMonth && bv.ViewUpdate < unixNow)
                    .Sum(bv => (int?)bv.ViewCount) ?? 0;

                int yearViews = db.BaiViets
                    .Where(bv => bv.ViewUpdate >= unixStartOfYear && bv.ViewUpdate < unixNow)
                    .Sum(bv => (int?)bv.ViewCount) ?? 0;

                int totalArticles = db.BaiViets.Count();

                var result = new
                {
                    DayViews = dayViews,
                    MonthViews = monthViews,
                    YearViews = yearViews,
                    TotalArticles = totalArticles
                };
                #endregion
                return Ok(result);
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

                #region Lọc theo thời gian
                if (type == "day")
                {
                    DateTime startOfDay = GetStartOfDay(now);
                    for (int h = 0; h < 24; h++)
                    {
                        DateTime hourStart = startOfDay.AddHours(h);
                        DateTime hourEnd = hourStart.AddHours(1);
                        int unixStart = GetUnixTimestamp(hourStart);
                        int unixEnd = GetUnixTimestamp(hourEnd);

                        int viewCount = db.BaiViets
                            .Where(bv => bv.ViewUpdate >= unixStart && bv.ViewUpdate < unixEnd)
                            .Sum(bv => (int?)bv.ViewCount) ?? 0;

                        labels.Add(h.ToString("D2"));
                        data.Add(viewCount);
                    }
                }
                else if (type == "month")
                {
                    DateTime startOfMonth = GetStartOfMonth(now);
                    int daysInMonth = DateTime.DaysInMonth(now.Year, now.Month);
                    for (int d = 1; d <= daysInMonth; d++)
                    {
                        DateTime dayStart = new DateTime(now.Year, now.Month, d, 0, 0, 0, DateTimeKind.Utc);
                        DateTime dayEnd = dayStart.AddDays(1);
                        int unixStart = GetUnixTimestamp(dayStart);
                        int unixEnd = GetUnixTimestamp(dayEnd);

                        int viewCount = db.BaiViets
                            .Where(bv => bv.ViewUpdate >= unixStart && bv.ViewUpdate < unixEnd)
                            .Sum(bv => (int?)bv.ViewCount) ?? 0;

                        labels.Add(d.ToString());
                        data.Add(viewCount);
                    }
                }
                else if (type == "year")
                {
                    for (int m = 1; m <= 12; m++)
                    {
                        DateTime monthStart = new DateTime(now.Year, m, 1, 0, 0, 0, DateTimeKind.Utc);
                        DateTime monthEnd = monthStart.AddMonths(1);
                        int unixStart = GetUnixTimestamp(monthStart);
                        int unixEnd = GetUnixTimestamp(monthEnd);

                        int viewCount = db.BaiViets
                            .Where(bv => bv.ViewUpdate >= unixStart && bv.ViewUpdate < unixEnd)
                            .Sum(bv => (int?)bv.ViewCount) ?? 0;

                        labels.Add(m.ToString("D2")); // 01, 02,...
                        data.Add(viewCount);
                    }
                }
                else
                {
                    return Ok(new { labels = new List<string>(), data = new List<int>() });
                }
                #endregion

                return Ok(new { labels, data });
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }
        #endregion
        #region lấy dữ liệu cho nút bài viết
        [Route("top10-baiviet-thang"), HttpGet]
        public async Task<IHttpActionResult> GetTop10BaiVietTrongThang()
        {
            try
            {
                DateTime now = DateTime.UtcNow;
                DateTime startOfMonth = GetStartOfMonth(now);
                DateTime endOfMonth = GetEndOfMonth(now);
                int unixStart = GetUnixTimestamp(startOfMonth);
                int unixEnd = GetUnixTimestamp(endOfMonth);

                var top10BaiViet = await db.BaiViets
                    .Where(bv => bv.ViewUpdate >= unixStart && bv.ViewUpdate < unixEnd)
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
        #endregion
    }
}