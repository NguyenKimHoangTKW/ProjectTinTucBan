using ProjectTinTucBan.Models;
using System;
using System.Linq;
using System.Runtime.Caching;
using System.Web;
using System.Web.Http;

namespace ProjectTinTucBan.ApiControllers
{
    [RoutePrefix("api/v1/visitor")]
    public class VisitorApiController : ApiController
    {
        private WebTinTucTDMUEntities db = new WebTinTucTDMUEntities();

        // Cache để lưu visitor active (20s) tránh tăng nhanh
        private static MemoryCache cache = MemoryCache.Default;
        private static readonly object _lock = new object();

        [HttpPost]
        [Route("increase-online")]
        public IHttpActionResult IncreaseOnline()
        {
            try
            {
                string clientIp = GetClientIp();
                if (string.IsNullOrEmpty(clientIp))
                {
                    clientIp = Guid.NewGuid().ToString();
                }

                string onlineKey = $"online_{clientIp}";
                int todayUnix = GetUnixTimestampStartOfDay();

                lock (_lock)
                {
                    if (!cache.Contains(onlineKey))
                    {
                        // Thêm IP vào cache online (20s) để đếm online
                        cache.Add(onlineKey, true, DateTimeOffset.Now.AddSeconds(20));
                    }

                    var todayLog = db.VisitorLogs.FirstOrDefault(v => v.NgayTao == todayUnix);
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
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        [HttpPost]
        [Route("increase-total")]
        public IHttpActionResult IncreaseTotal()
        {
            try
            {
                string clientIp = GetClientIp();
                if (string.IsNullOrEmpty(clientIp))
                {
                    clientIp = Guid.NewGuid().ToString();
                }

                int todayUnix = GetUnixTimestampStartOfDay();
                string dailyKey = $"daily_{clientIp}_{todayUnix}";
                string startKey = $"start_{clientIp}";

                lock (_lock)
                {
                    // Nếu IP đã được tính trong ngày thì bỏ qua
                    if (cache.Contains(dailyKey))
                    {
                        int totalAll = db.VisitorLogs.Sum(v => (int?)v.TotalAmount) ?? 0;
                        return Ok(new
                        {
                            total = totalAll
                        });
                    }

                    // Nếu chưa có thời điểm bắt đầu, thêm vào
                    if (!cache.Contains(startKey))
                    {
                        cache.Add(startKey, DateTimeOffset.Now, DateTimeOffset.Now.AddMinutes(10));
                        int totalAll = db.VisitorLogs.Sum(v => (int?)v.TotalAmount) ?? 0;
                        return Ok(new
                        {
                            total = totalAll
                        });
                    }

                    // Kiểm tra thời gian truy cập đủ 15s chưa
                    var startObj = cache.Get(startKey);
                    if (!(startObj is DateTimeOffset start) || DateTimeOffset.Now.Subtract(start).TotalSeconds < 15)
                    {
                        int totalAll = db.VisitorLogs.Sum(v => (int?)v.TotalAmount) ?? 0;
                        return Ok(new
                        {
                            total = totalAll
                        });
                    }

                    // Đủ điều kiện tính tổng truy cập
                    cache.Add(dailyKey, true, DateTimeOffset.Now.AddHours(24));

                    var log = db.VisitorLogs.FirstOrDefault(v => v.NgayTao == todayUnix);

                    if (log == null)
                    {
                        log = new VisitorLog
                        {
                            NgayTao = todayUnix,
                            TotalAmount = 1
                        };
                        db.VisitorLogs.Add(log);
                    }
                    else
                    {
                        log.TotalAmount = (log.TotalAmount ?? 0) + 1;
                        db.Entry(log).State = System.Data.Entity.EntityState.Modified;
                    }

                    db.SaveChanges();

                    int totalAllAfter = db.VisitorLogs.Sum(v => (int?)v.TotalAmount) ?? 0;
                    return Ok(new
                    {
                        total = totalAllAfter
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
                    clientIp = Guid.NewGuid().ToString(); // fallback nếu không có IP
                }

                string onlineKey = $"online_{clientIp}";
                int todayUnix = GetUnixTimestampStartOfDay();

                lock (_lock)
                {
                    // Nếu IP đang tồn tại trong cache thì xóa đi (người dùng rời khỏi)
                    bool removed = false;
                    if (cache.Contains(onlineKey))
                    {
                        cache.Remove(onlineKey);
                        removed = true;
                    }

                    // Cập nhật CurrentActive dù có key hay không (để đảm bảo đồng bộ)
                    var todayLog = db.VisitorLogs.FirstOrDefault(v => v.NgayTao == todayUnix);
                    if (todayLog != null)
                    {
                        // Nếu vừa xóa IP khỏi cache thì giảm, nếu không thì giữ nguyên
                        if (removed)
                        {
                            todayLog.CurrentActive = Math.Max((todayLog.CurrentActive ?? 1) - 1, 0);
                        }
                        else
                        {
                            // Đồng bộ lại với số lượng thực tế trong cache nếu cần
                            todayLog.CurrentActive = GetOnlineUserCount();
                        }

                        db.Entry(todayLog).State = System.Data.Entity.EntityState.Modified;
                        db.SaveChanges();
                    }

                    int totalAll = db.VisitorLogs.Sum(v => (int?)v.TotalAmount) ?? 0;

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

            int todayUnix = GetUnixTimestampStartOfDay();
            var todayLog = db.VisitorLogs.FirstOrDefault(v => v.NgayTao == todayUnix);
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

        // ✅ Hàm tính Unix timestamp cho đầu ngày (UTC+7)
        private int GetUnixTimestampStartOfDay()
        {
            var timeZone = TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time");
            var nowInUtc7 = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, timeZone).Date;
            var startOfDayUtc = TimeZoneInfo.ConvertTimeToUtc(nowInUtc7, timeZone);
            return (int)(startOfDayUtc.Subtract(new DateTime(1970, 1, 1))).TotalSeconds;
        }
    }
}
