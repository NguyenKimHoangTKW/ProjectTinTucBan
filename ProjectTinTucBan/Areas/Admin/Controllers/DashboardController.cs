using ProjectTinTucBan.Helper;
using ProjectTinTucBan.Models;
using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Linq;
using System.Threading.Tasks;
using System.Web.Http;
using System.Web.Routing;

namespace ProjectTinTucBan.Areas.Admin.Controllers
{
    [RoutePrefix("api/v1/admin")]
    public class DashboardController : ApiController
    {

        WebTinTucTDMUEntities db = new WebTinTucTDMUEntities();
        #region lấy thời gian theo Unix
        private static readonly TimeZoneInfo GmtPlus7 = TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time");

        private int GetUnixTimestamp(DateTime dt)
        {
            // Đảm bảo dt.Kind == Unspecified trước khi chuyển
            if (dt.Kind != DateTimeKind.Unspecified)
            {
                dt = DateTime.SpecifyKind(dt, DateTimeKind.Unspecified);
            }

            DateTime gmt7Time = TimeZoneInfo.ConvertTimeToUtc(dt, GmtPlus7);
            return (int)(gmt7Time.Subtract(new DateTime(1970, 1, 1))).TotalSeconds;
        }

        // Lấy đầu ngày theo GMT+7
        private DateTime GetStartOfDay(DateTime now)
        {
            DateTime local = TimeZoneInfo.ConvertTimeFromUtc(now.ToUniversalTime(), GmtPlus7);
            DateTime startOfDayLocal = new DateTime(local.Year, local.Month, local.Day, 0, 0, 0);
            return TimeZoneInfo.ConvertTimeToUtc(startOfDayLocal, GmtPlus7);
        }

        // Lấy đầu tháng theo GMT+7
        private DateTime GetStartOfMonth(DateTime now)
        {
            DateTime local = TimeZoneInfo.ConvertTimeFromUtc(now.ToUniversalTime(), GmtPlus7);
            DateTime startOfMonthLocal = new DateTime(local.Year, local.Month, 1, 0, 0, 0);
            return TimeZoneInfo.ConvertTimeToUtc(startOfMonthLocal, GmtPlus7);
        }

        // Lấy cuối tháng theo GMT+7
        private DateTime GetEndOfMonth(DateTime now)
        {
            return GetStartOfMonth(now).AddMonths(1);
        }

        // Lấy đầu năm theo GMT+7
        private DateTime GetStartOfYear(DateTime now)
        {
            DateTime local = TimeZoneInfo.ConvertTimeFromUtc(now.ToUniversalTime(), GmtPlus7);
            DateTime startOfYearLocal = new DateTime(local.Year, 1, 1, 0, 0, 0);
            return TimeZoneInfo.ConvertTimeToUtc(startOfYearLocal, GmtPlus7);
        }

        // Lấy cuối năm theo GMT+7
        private DateTime GetEndOfYear(DateTime now)
        {
            return GetStartOfYear(now).AddYears(1);
        }

        /**/
        #endregion


        #region lấy dữ liệu cho dashboard
        [Route("dashboard"), HttpGet]
        public async Task<IHttpActionResult> GetDashboardData()
        {
            var user = SessionHelper.GetUser();
            try
            {
                #region Lấy số liệu từ bảng VisitorLogs
                DateTime now = DateTime.UtcNow;

                int unixNow = GetUnixTimestamp(now);
                int unixStartOfDay = GetUnixTimestamp(GetStartOfDay(now));
                int unixStartOfMonth = GetUnixTimestamp(GetStartOfMonth(now));
                int unixStartOfYear = GetUnixTimestamp(GetStartOfYear(now));

                // Tổng lượt xem trong ngày
                int dayViews = await db.VisitorLogs
                    .Where(v => v.NgayTao >= unixStartOfDay && v.NgayTao < unixNow)
                    .SumAsync(v => (int?)v.TotalAmount) ?? 0;

                // Tổng lượt xem trong tháng
                int monthViews = await db.VisitorLogs
                    .Where(v => v.NgayTao >= unixStartOfMonth && v.NgayTao < unixNow)
                    .SumAsync(v => (int?)v.TotalAmount) ?? 0;

                // Tổng lượt xem trong năm
                int yearViews = await db.VisitorLogs
                    .Where(v => v.NgayTao >= unixStartOfYear && v.NgayTao < unixNow)
                    .SumAsync(v => (int?)v.TotalAmount) ?? 0;

                // Tổng số bản ghi Bài viết
                int TotalArticles = db.BaiViets.Count();

                var result = new
                {
                    DayViews = dayViews,
                    MonthViews = monthViews,
                    YearViews = yearViews,
                    TotalArticles = TotalArticles
                };
                #endregion

                return Ok(result);
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
            var user = SessionHelper.GetUser();
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
        #region lấy dữ liệu cho biểu đồ theo bộ lọc

        [Route("dashboard-filter/chart"), HttpGet]
        public IHttpActionResult GetChartDataWithFilter(string type = "range", int? year = null, int? month = null, int? from = null, int? to = null)
        {
            var user = SessionHelper.GetUser();
            try
            {
                var labels = new List<string>();
                var data = new List<int>();
                string typeUsed = "";

                // Xác định múi giờ chuẩn (GMT+7)
                var timeZone = TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time");

                if (from.HasValue && to.HasValue)
                {
                    // Chuyển timestamp sang local time, rồi lấy Date
                    var fromDateLocal = TimeZoneInfo.ConvertTimeFromUtc(
                        DateTimeOffset.FromUnixTimeSeconds(from.Value).UtcDateTime, timeZone
                    ).Date;

                    var toDateLocal = TimeZoneInfo.ConvertTimeFromUtc(
                        DateTimeOffset.FromUnixTimeSeconds(to.Value).UtcDateTime, timeZone
                    ).Date;

                    var totalDays = (toDateLocal - fromDateLocal).TotalDays;

                    if (totalDays <= 1)
                    {
                        typeUsed = "hourly";
                        for (int h = 0; h < 24; h++)
                        {
                            var hourStartLocal = fromDateLocal.AddHours(h);
                            var hourStartUtc = TimeZoneInfo.ConvertTimeToUtc(hourStartLocal, timeZone);
                            var hourEndUtc = hourStartUtc.AddHours(1);

                            int unixStart = (int)((DateTimeOffset)hourStartUtc).ToUnixTimeSeconds();
                            int unixEnd = (int)((DateTimeOffset)hourEndUtc).ToUnixTimeSeconds();

                            int viewCount = db.VisitorLogs
                                .Where(v => v.NgayTao >= unixStart && v.NgayTao < unixEnd)
                                .Sum(v => (int?)v.TotalAmount) ?? 0;

                            labels.Add(h.ToString("D2"));
                            data.Add(viewCount);
                        }
                    }
                    else if (totalDays <= 31)
                    {
                        typeUsed = "daily";
                        for (var d = fromDateLocal; d <= toDateLocal; d = d.AddDays(1))
                        {
                            var dayStartUtc = TimeZoneInfo.ConvertTimeToUtc(d, timeZone);
                            var dayEndUtc = dayStartUtc.AddDays(1);

                            int unixStart = (int)((DateTimeOffset)dayStartUtc).ToUnixTimeSeconds();
                            int unixEnd = (int)((DateTimeOffset)dayEndUtc).ToUnixTimeSeconds();

                            int viewCount = db.VisitorLogs
                                .Where(v => v.NgayTao >= unixStart && v.NgayTao < unixEnd)
                                .Sum(v => (int?)v.TotalAmount) ?? 0;

                            labels.Add(d.Day.ToString());
                            data.Add(viewCount);
                        }
                    }
                    else
                    {
                        typeUsed = "monthly";
                        var current = new DateTime(fromDateLocal.Year, fromDateLocal.Month, 1);
                        var end = new DateTime(toDateLocal.Year, toDateLocal.Month, 1);

                        while (current <= end)
                        {
                            var monthStartUtc = TimeZoneInfo.ConvertTimeToUtc(current, timeZone);
                            var monthEndUtc = monthStartUtc.AddMonths(1);

                            int unixStart = (int)((DateTimeOffset)monthStartUtc).ToUnixTimeSeconds();
                            int unixEnd = (int)((DateTimeOffset)monthEndUtc).ToUnixTimeSeconds();

                            int viewCount = db.VisitorLogs
                                .Where(v => v.NgayTao >= unixStart && v.NgayTao < unixEnd)
                                .Sum(v => (int?)v.TotalAmount) ?? 0;

                            labels.Add(current.Month.ToString("D2"));
                            data.Add(viewCount);

                            current = current.AddMonths(1);
                        }
                    }
                }
                else if (year.HasValue && month.HasValue)
                {
                    typeUsed = "daily-in-month";
                    int daysInMonth = DateTime.DaysInMonth(year.Value, month.Value);
                    for (int d = 1; d <= daysInMonth; d++)
                    {
                        var localDate = new DateTime(year.Value, month.Value, d, 0, 0, 0);
                        var dayStartUtc = TimeZoneInfo.ConvertTimeToUtc(localDate, timeZone);
                        var dayEndUtc = dayStartUtc.AddDays(1);

                        int unixStart = (int)((DateTimeOffset)dayStartUtc).ToUnixTimeSeconds();
                        int unixEnd = (int)((DateTimeOffset)dayEndUtc).ToUnixTimeSeconds();

                        int viewCount = db.VisitorLogs
                            .Where(v => v.NgayTao >= unixStart && v.NgayTao < unixEnd)
                            .Sum(v => (int?)v.TotalAmount) ?? 0;

                        labels.Add(d.ToString());
                        data.Add(viewCount);
                    }
                }
                else if (year.HasValue)
                {
                    typeUsed = "monthly-in-year";
                    for (int m = 1; m <= 12; m++)
                    {
                        var localDate = new DateTime(year.Value, m, 1, 0, 0, 0);
                        var monthStartUtc = TimeZoneInfo.ConvertTimeToUtc(localDate, timeZone);
                        var monthEndUtc = monthStartUtc.AddMonths(1);

                        int unixStart = (int)((DateTimeOffset)monthStartUtc).ToUnixTimeSeconds();
                        int unixEnd = (int)((DateTimeOffset)monthEndUtc).ToUnixTimeSeconds();

                        int viewCount = db.VisitorLogs
                            .Where(v => v.NgayTao >= unixStart && v.NgayTao < unixEnd)
                            .Sum(v => (int?)v.TotalAmount) ?? 0;

                        labels.Add(m.ToString("D2"));
                        data.Add(viewCount);
                    }
                }
                else
                {
                    return Ok(new { labels = new List<string>(), data = new List<int>(), typeUsed = "none" });
                }

                return Ok(new { labels, data, typeUsed });
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        #endregion
    }
}