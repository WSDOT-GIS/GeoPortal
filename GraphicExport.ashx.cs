﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Google.KML;
using System.Web.Script.Serialization;
using System.Collections;
using System.Text.RegularExpressions;

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

            if (Regex.IsMatch(format, "(?i)km[lz]")) //string.Compare(format, "kml", true) == 0)
            {
                var kmlDocument = new geDocument();
                var jsSerializer = new JavaScriptSerializer();

                // Loop through the layers.
                var layers = jsSerializer.Deserialize<Dictionary<string, object>>(json);

                foreach (var kvp in layers)
                {
                    var folder = new geFolder { Name = kvp.Key };
                    kmlDocument.Features.Add(folder);
                    var graphics = kvp.Value as ArrayList;
                    foreach (Dictionary<string, object> graphic in graphics)
                    {
                        var placemark = new gePlacemark();
                        folder.Features.Add(placemark);
                        var geometry = graphic["geometry"] as Dictionary<string, object>;
                        if (geometry.Keys.Contains("x"))
                        {
                            // x and y are decimals;
                            var x = Convert.ToDouble(geometry["x"]);
                            var y = Convert.ToDouble(geometry["y"]);
                            placemark.Geometry = new gePoint(new geCoordinates(new geAngle90(y), new geAngle180(x)));
                        }
                        else if (geometry.Keys.Contains("rings"))
                        {
                            // var rings = (IEnumerable<IEnumerable<IEnumerable<object>>>)geometry["rings"];
                            var rings = (ArrayList)geometry["rings"];

                            var linearRings = from ArrayList ring in rings
                                              select new geLinearRing((from ArrayList point in ring
                                                                       select new geCoordinates(
                                                                           new geAngle90(Convert.ToDouble(point[1])),
                                                                           new geAngle180(Convert.ToDouble(point[0]))
                                                                        )).ToList());
                            var polygon = new gePolygon(new geOuterBoundaryIs(linearRings.ElementAt(0)));
                            if (linearRings.Count() > 0)
                            {
                                polygon.InnerBoundaries.AddRange(from ring in linearRings.Skip(1)
                                                                 select new geInnerBoundaryIs(ring));
                                
                            }
                            placemark.Geometry = polygon;
                        }
                        ////else if (geometry.Keys.Contains("paths"))
                        ////{
                        ////    throw new NotImplementedException();

                        ////    var paths = (IEnumerable<IEnumerable<object>>)geometry["paths"];
                        ////}                        
                    }
                }

                var kml = new geKML(kmlDocument);

                byte[] bytes;

                if (string.Compare(format, "kmz", true) == 0)
                {
                    bytes = kml.ToKMZ();
                    context.Response.ContentType = "application/vnd.google-earth.kmz";
                }
                else
                {
                    bytes = kml.ToKML();
                    context.Response.ContentType = "application/vnd.google-earth.kml+xml";
                }
                context.Response.BinaryWrite(bytes);
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