using ProjectTinTucBan.Models;
using System;
using System.Linq;
using System.Runtime.Caching;
using System.Web;
using System.Web.Http;

namespace ProjectTinTucBan.ApiControllers
{
    [RoutePrefix("api/visitor")]
    public class VisitorApiController : ApiController
    {
        private WebTinTucTDMUEntities db = new WebTinTucTDMUEntities();

        // Cache để lưu visitor active (20s) tránh tăng nhanh
        private static MemoryCache cache = MemoryCache.Default;
        private static readonly object _lock = new object();

        [HttpPost]
        [Route("increase")]
        public IHttpActionResult Increase()
        {
            try
            {
                string clientIp = GetClientIp();
                if (string.IsNullOrEmpty(clientIp))
                {
                    clientIp = Guid.NewGuid().ToString();
                }

                string onlineKey = $"online_{clientIp}";
                string dailyKey = $"daily_{clientIp}_{DateTime.Now:yyyyMMdd}";

                lock (_lock)
                {
                    // Nếu visitor đã có trong cache 20s => không tăng lượt
                    if (cache.Contains(onlineKey))
                    {
                        int totalAll = db.VisitorLogs.Sum(v => (int?)v.TotalAmount) ?? 0;

                        return Ok(new
                        {
                            total = totalAll,
                            online = GetOnlineUserCount()
                        });
                    }

                    // Thêm visitor vào cache 20s tránh tăng nhanh
                    cache.Add(onlineKey, true, DateTimeOffset.Now.AddSeconds(20));

                    // Kiểm tra IP đã được tính lượt trong ngày chưa
                    if (cache.Contains(dailyKey))
                    {
                        int today = int.Parse(DateTime.Now.ToString("yyyyMMdd"));
                        var todayLog = db.VisitorLogs.FirstOrDefault(v => v.NgayTao == today);
                        if (todayLog != null)
                        {
                            todayLog.CurrentActive = GetOnlineUserCount();
                            db.Entry(todayLog).State = System.Data.Entity.EntityState.Modified;
                            db.SaveChanges();
                        }

                        int totalAll = db.VisitorLogs.Sum(v => (int?)v.TotalAmount) ?? 0;

                        return Ok(new
                        {
                            total = totalAll,
                            online = GetOnlineUserCount()
                        });
                    }

                    // Lần đầu IP này được tính lượt trong ngày
                    cache.Add(dailyKey, true, DateTimeOffset.Now.AddHours(24));

                    int todayDate = int.Parse(DateTime.Now.ToString("yyyyMMdd"));
                    var log = db.VisitorLogs.FirstOrDefault(v => v.NgayTao == todayDate);

                    if (log == null)
                    {
                        log = new VisitorLog
                        {
                            NgayTao = todayDate,
                            TotalAmount = 1,
                            CurrentActive = GetOnlineUserCount()
                        };
                        db.VisitorLogs.Add(log);
                    }
                    else
                    {
                        log.TotalAmount = (log.TotalAmount ?? 0) + 1;
                        log.CurrentActive = GetOnlineUserCount();
                        db.Entry(log).State = System.Data.Entity.EntityState.Modified;
                    }

                    db.SaveChanges();

                    int totalAllAfter = db.VisitorLogs.Sum(v => (int?)v.TotalAmount) ?? 0;

                    return Ok(new
                    {
                        total = totalAllAfter,
                        online = log.CurrentActive ?? 0
                    });
                }
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        [HttpPost]
        [Route("decrease")]
        public IHttpActionResult Decrease()
        {
            try
            {
                string clientIp = GetClientIp();
                if (string.IsNullOrEmpty(clientIp))
                {
                    clientIp = Guid.NewGuid().ToString();
                }

                string onlineKey = $"online_{clientIp}";

                lock (_lock)
                {
                    if (cache.Contains(onlineKey))
                    {
                        cache.Remove(onlineKey);

                        int todayDate = int.Parse(DateTime.Now.ToString("yyyyMMdd"));
                        var log = db.VisitorLogs.FirstOrDefault(v => v.NgayTao == todayDate);
                        if (log != null)
                        {
                            log.CurrentActive = Math.Max((log.CurrentActive ?? 1) - 1, 0);
                            db.Entry(log).State = System.Data.Entity.EntityState.Modified;
                            db.SaveChanges();
                        }
                    }

                    int totalAll = db.VisitorLogs.Sum(v => (int?)v.TotalAmount) ?? 0;
                    var todayLog = db.VisitorLogs.FirstOrDefault(v => v.NgayTao == int.Parse(DateTime.Now.ToString("yyyyMMdd")));

                    return Ok(new
                    {
                        total = totalAll,
                        online = todayLog?.CurrentActive ?? 0
                    });
                }
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        private int GetOnlineUserCount()
        {
            return cache.Where(kvp => kvp.Key.StartsWith("online_")).Count();
        }

        [HttpGet]
        [Route("stats")]
        public IHttpActionResult Stats()
        {
            var total = db.VisitorLogs.Sum(v => (int?)v.TotalAmount) ?? 0;

            int today = int.Parse(DateTime.Now.ToString("yyyyMMdd"));
            var todayLog = db.VisitorLogs.FirstOrDefault(v => v.NgayTao == today);
            int online = todayLog?.CurrentActive ?? 0;

            return Ok(new
            {
                total = total,
                online = online
            });
        }

        [HttpGet]
        [Route("debug/onlinekeys")]
        public IHttpActionResult GetOnlineKeys()
        {
            var keys = cache.Where(kvp => kvp.Key.StartsWith("online_")).Select(kvp => kvp.Key).ToList();
            return Ok(keys);
        }

        private string GetClientIp()
        {
            var request = HttpContext.Current.Request;
            string ip = request.ServerVariables["HTTP_X_FORWARDED_FOR"];

            if (!string.IsNullOrEmpty(ip))
            {
                string[] addresses = ip.Split(',');
                if (addresses.Length != 0)
                {
                    return addresses[0].Trim();
                }
            }

            return request.ServerVariables["REMOTE_ADDR"];
        }
    }
}
