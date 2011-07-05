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
            string json = context.Request.Cookies["graphics"].Value; //context.Request.Params["graphics"];

            if (json == null)
            {
                context.Response.Write("Cookie not found for this site: \"graphics\"");
                context.Response.StatusCode = 500;
                return;
            }
            else
            {
                json = context.Server.UrlDecode(json);
            }


            
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