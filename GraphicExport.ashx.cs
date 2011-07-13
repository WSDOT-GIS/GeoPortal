using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Wsdot.Grdo.Web.Mapping
{
    /// <summary>
    /// Converts ArcGIS Server JSON representations of graphics to other formats.
    /// </summary>
    public class GraphicExport : IHttpHandler
    {

        public void ProcessRequest(HttpContext context)
        {
            // Get the JSON string representing the saved graphics from the cookies.
            var graphicsCookie = context.Request.Cookies["graphics"];
            string json;
            if (graphicsCookie != null)
            {
                json = context.Request.Cookies["graphics"].Value;
                // The cookie needs to be decoded to become valid JSON.
                json = context.Server.UrlDecode(json);

            }
            else
            {
                json = context.Request.Params["graphics"];
            }

            if (json == null)
            {
                // Write an error message if the cookie was not found.
                context.Response.Write("Cookie or parameter not found: \"graphics\"");
                context.Response.StatusCode = 500;
                return;
            }


            
            // Get the format parameter, and set an initial value if one is not provided.
            string format = context.Request.Params["f"];
            if (format == null) {
                format = string.Empty;
            }

            if (string.Compare(format, "kml", true) == 0)
            {
                throw new NotImplementedException();
            }
            else
            {
                context.Response.ContentType = "text/plain";
                context.Response.Write(json);
            }
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