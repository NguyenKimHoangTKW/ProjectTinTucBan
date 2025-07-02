using Microsoft.Owin;
using Microsoft.Owin.Security.Cookies;
using Microsoft.Owin.Security.Google;
using Owin;
using System; // Cần cho TimeSpan
using Microsoft.AspNet.Identity;
using Microsoft.AspNet.Identity.Owin;
using Microsoft.Owin.Security; // Cần cho CookieAuthenticationOptions
using ProjectTinTucBan.Models; // Thêm dòng này để dùng TaiKhoan

[assembly: OwinStartup(typeof(ProjectTinTucBan.App_Start.Startup))]

namespace ProjectTinTucBan.App_Start
{
    public partial class Startup
    {
        public void Configuration(IAppBuilder app)
        {
            ConfigureAuth(app);
        }

        public void ConfigureAuth(IAppBuilder app)
        {
            app.UseCookieAuthentication(new CookieAuthenticationOptions
            {
                AuthenticationType = DefaultAuthenticationTypes.ApplicationCookie,
                LoginPath = new PathString("/Admin/InterfaceAdmin/Login"),
                Provider = new CookieAuthenticationProvider()
            });
            app.UseExternalSignInCookie(DefaultAuthenticationTypes.ExternalCookie);

            var googleOptions = new GoogleOAuth2AuthenticationOptions()
            {
                ClientId = "388825875734-etl3km9lpshbvbb25im8jhh5ltho3htm.apps.googleusercontent.com",
                ClientSecret = "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",
                CallbackPath = new PathString("/signin-google")
            };
            googleOptions.Scope.Add("email");
            googleOptions.Scope.Add("profile");

            app.UseGoogleAuthentication(googleOptions);
        }
    }
}