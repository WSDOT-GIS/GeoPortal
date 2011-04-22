using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Wsdot.Traffic;
using System.Configuration;
using System.Web.Script.Serialization;
using System.Text.RegularExpressions;
using System.Runtime.Serialization;

namespace Wsdot.Web.Mapping.Sample
{
    /// <summary>
    /// Summary description for Cameras
    /// </summary>
    public class Cameras : IHttpHandler
    {
        ////internal static Dictionary<string, decimal> CreatePointKey(Camera camera)
        ////{
        ////    var output = new Dictionary<string, decimal>(2);
        ////    output.Add("x", camera.CameraLocation.Longitude);
        ////    output.Add("y", camera.CameraLocation.Longitude);
        ////    return output;
        ////}

        [DataContract]
        public class CameraGroup
        {
            [DataMember]
            public Point geometry { get; set; }
            
            [IgnoreDataMember]
            internal Camera[] cameras { get; set; }

            [DataMember]
            public Dictionary<string, object> attributes {
                get
                {
                    var dict = new Dictionary<string, object>();
                    dict.Add("cameras", from c in cameras select new {
                        title = c.Title,
                        imageUrl = c.ImageURL,
                        cameraOwner=c.CameraOwner,
                        description=c.Description,
                        imageHeight=c.ImageHeight,
                        imageWidth=c.ImageWidth,
                        ownerUrl=c.OwnerURL,
                        region=c.Region
                    });
                    return dict;
                }
            }
        }



        public void ProcessRequest(HttpContext context)
        {
            Camera[] cameras;
            using (var service = new HighwayCameras())
            {

                cameras = service.GetCameras(ConfigurationManager.AppSettings["wsdotTrafficApiAccessCode"]);
            }
            context.Response.ContentType = "application/json";

            var groupedCameras = from g in
                                     (from c in cameras
                                      where c.IsActiveSpecified && c.IsActive
                                      orderby c.SortOrder
                                      group c by c.CameraLocation.ToPoint())
                                 select new CameraGroup
                                 {
                                     geometry = g.Key,
                                     cameras = g.ToArray()
                                 };

            JavaScriptSerializer serializer = new JavaScriptSerializer();
            string output = serializer.Serialize(groupedCameras);

            context.Response.Write(output);

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