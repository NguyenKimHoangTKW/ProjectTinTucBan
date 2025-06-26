using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using System.Web;

namespace ProjectTinTucBan
{
    public class SessionEnabledDelegatingHandler : DelegatingHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            // Store HttpContext in request properties
            if (HttpContext.Current != null)
            {
                request.Properties["MS_HttpContext"] = HttpContext.Current;
            }

            return base.SendAsync(request, cancellationToken);
        }
    }
}