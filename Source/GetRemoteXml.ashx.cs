using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Net;

namespace Wsdot.Web.Mapping.FunctionalClass
{
    /// <summary>
    /// Summary description for GetRemoteXml
    /// </summary>
    public class GetRemoteXml : IHttpHandler
    {

        public void ProcessRequest(HttpContext context)
        {
            var parameters = context.Request.QueryString;
            var url = parameters["url"];
            var xmlRequest = WebRequest.Create(url);

            context.Response.ContentType = "text/xml";


            using (var xmlResponse = xmlRequest.GetResponse())
            {
                var xmlStream = xmlResponse.GetResponseStream();
                var outStream = context.Response.OutputStream;

                int pos;
                pos = xmlStream.ReadByte();
                while (pos > 0)
                {
                    outStream.WriteByte((byte)pos);
                    pos = xmlStream.ReadByte();
                }
            }
        }

        public bool IsReusable
        {
            get
            {
                return false;
            }
        }
    }
}