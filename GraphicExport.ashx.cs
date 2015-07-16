using System.Collections.Generic;
using System.Text.RegularExpressions;
using System.Web;
using System.Web.Script.Serialization;
using Wsdot.Gis.Conversion;

namespace Wsdot.Grdo.Web.Mapping
{
	/// <summary>
	/// Converts ArcGIS Server JSON representations of graphics to other formats.
	/// </summary>
	public class GraphicExport : IHttpHandler
	{
		private static readonly Regex _geometryInNameRe = new Regex("(?in)Geometry$");
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

			if (Regex.IsMatch(format, "(?i)km[lz]"))
			{
				// Generate a KML document.
				var jsSerializer = new JavaScriptSerializer();

				// Loop through the layers.
				var layers = jsSerializer.Deserialize<Dictionary<string, object>>(json);

				var kml = ConversionUtilities.LayersDictionaryToKml(layers);

				// Export the geKML into either KML or KMZ, depending on the specified format.
				byte[] bytes;
				if (string.Compare(format, "kmz", true) == 0)
				{
					bytes = kml.ToKMZ();
					context.Response.ContentType = "application/vnd.google-earth.kmz";
					context.Response.AddHeader("Content-Disposition", "filename=ExportedGraphics.kmz");
				}
				else
				{
					bytes = kml.ToKML();
					context.Response.ContentType = "application/vnd.google-earth.kml+xml";
					context.Response.AddHeader("Content-Disposition", "filename=ExportedGraphics.kml");
				}
				context.Response.BinaryWrite(bytes);
			}
			else
			{
				context.Response.ContentType = "application/json";
				context.Response.AddHeader("Content-Disposition", "filename=ExportedGraphics.json");
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