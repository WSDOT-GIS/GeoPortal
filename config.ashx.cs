using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Configuration;

namespace Wsdot.Grdo.Web.Mapping
{
    /// <summary>
    /// Redirects to the JavaScript file specified in web.config's "config" setting.
    /// </summary>
    public class config : IHttpHandler
    {

        public void ProcessRequest(HttpContext context)
        {
            string configFileUrl = ConfigurationManager.AppSettings["config"];
            context.Response.Redirect(configFileUrl, true);
        }

        public bool IsReusable
        {
            get
            {
                return true;
            }
        }
    }
}