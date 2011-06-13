using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Net;
using System.Configuration;
using System.Text;
using System.IO;
using System.Drawing;
using System.Drawing.Imaging;

namespace Wsdot.Grdo.Web.Mapping
{
    /// <summary>
    /// Gets an icon for a map service and applies a base map.
    /// </summary>
    public class MapIcon : IHttpHandler
    {

        public void ProcessRequest(HttpContext context)
        {
            ////context.Response.ContentType = "text/plain";
            ////context.Response.Write("Hello World");

            var qs = context.Request.QueryString;
            var qsDict = new Dictionary<string, string>();
            
            const string mapServiceUrlKey = "mapService";
            
            foreach (string item in qs.Keys)
            {
                if (string.Compare(item, mapServiceUrlKey) != 0) {
                    qsDict.Add(item, qs[item]);
                }
            }

            if (!qsDict.ContainsKey("bbox"))
            {
                qsDict["bbox"] = ConfigurationManager.AppSettings["mapIconDefaultExtent"];
            }
            qsDict["f"] = "image";

            StringBuilder qsBuilder = new StringBuilder();
            int paramCount = 0;
            foreach (var kvp in qsDict)
            {
                if (paramCount > 0)
                {
                    qsBuilder.Append("&");
                }
                qsBuilder.AppendFormat("{0}={1}", kvp.Key, kvp.Value);
                paramCount++;
            }

            UriBuilder uriBuilder = new UriBuilder(ConfigurationManager.AppSettings["mapIconBaseMap"] + "/export") { Query = qsBuilder.ToString() };



            ////int currentByte = basemapStream.ReadByte();
            ////while (currentByte > -1)
            ////{
            ////    context.Response.Write(currentByte);
            ////    currentByte = basemapStream.ReadByte();
            ////}


            var mapServiceUrl = qs[mapServiceUrlKey];
            if (string.IsNullOrWhiteSpace(mapServiceUrl))
            {
                // If no additional layers are to be placed on top of the base map, simply redirect to the basemap service.
                context.Response.Redirect(uriBuilder.ToString(), true);
            }
            else
            {
                var request = WebRequest.Create(uriBuilder.Uri);
                var response = request.GetResponse();

                var basemapStream = response.GetResponseStream();

                var basemap = new Bitmap(basemapStream);
                var outputBitmap = new Bitmap(basemap.Width, basemap.Height, PixelFormat.Format32bppArgb);

                var g = Graphics.FromImage(outputBitmap);
                g.DrawImageUnscaled(basemap, 0, 0);
                g.Save();


                // Get the bitmap for the non-basemap service.
                if (!qsDict.ContainsKey("format"))
                {
                    qsBuilder.Append("&format=png");
                }
                if (!qsDict.ContainsKey("transparent"))
                {
                    qsBuilder.Append("&transparent=true");
                }
                uriBuilder = new UriBuilder(mapServiceUrl + "/export/") { Query = qsBuilder.ToString() };

                request = WebRequest.Create(uriBuilder.Uri);
                response = request.GetResponse();

                var otherMap = new Bitmap(response.GetResponseStream());

                g.DrawImageUnscaled(otherMap, 0, 0);
                g.Save();
                

                context.Response.ContentType = "image/png";
                byte[] outputImageBytes;

                using (var memStream = new MemoryStream())
                {
                    outputBitmap.Save(memStream, ImageFormat.Png);
                    outputImageBytes = memStream.ToArray();
                }

                context.Response.BinaryWrite(outputImageBytes);

                
            }


            
            ////context.Response.wr

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