using System;
using System.Collections;
using System.Collections.Generic;
using System.Configuration;
using System.IO;
using System.Linq;
using System.Net;
using System.Text;
using System.Web;
using System.Web.Script.Serialization;

namespace Wsdot.Grdo.Web.Mapping
{
	/// <summary>
	/// Queries a map service to get a list of the state routes.
	/// </summary>
	public class GetRoutes : IHttpHandler
	{
		enum RouteTypes
		{
			Increase = 1,
			Decrease = 2,
			Ramp = 4
		}

		enum OutputFormat
		{
			None = 0,
			JQuery = 1
		}

		public void ProcessRequest(HttpContext context)
		{
			var jsSerializer = new JavaScriptSerializer();

			// A search term (if provided).
			string term = context.Request.Params["term"];
			OutputFormat outputFormat;
			bool formatSpecified = Enum.TryParse<OutputFormat>(context.Request.Params["f"], true, out outputFormat);
			
			// From the config file, get a dictionary that indicates which layer corresponds to which direction.  E.g., {"increase":1}
			Dictionary<string, int> layerSettings =
				(from kvp in jsSerializer.Deserialize<Dictionary<string, object>>(ConfigurationManager.AppSettings["stateRouteMapServiceLayers"])
				 select new { Key = kvp.Key, Value = Convert.ToInt32(kvp.Value) }).ToDictionary(k => k.Key, v => v.Value);
			
			// Initialize a dictionary that will be keyed by route name.  The associated value indicate in which layers the route occurs.
			var routeInfos = new Dictionary<string, RouteTypes>();
			
			// Get the URL format string from the config file.
			string queryUrlFormat = ConfigurationManager.AppSettings["stateRouteMapService"];

			// Create the query string.
			var qsDict = new Dictionary<string, string>();
			qsDict.Add("where", !string.IsNullOrWhiteSpace(term) ? string.Format("SR LIKE '%{0}%'", term) : "1=1");
			qsDict.Add("fields", "SR");
			qsDict.Add("returnGeometry", "false");
			qsDict.Add("f", "json");

			var queryBuilder = new StringBuilder();
			foreach (var kvp in qsDict)
			{
				if (queryBuilder.Length > 0)
				{
					queryBuilder.Append('&');
				}
				queryBuilder.AppendFormat("{0}={1}", kvp.Key, Uri.EscapeDataString(kvp.Value));
			}

			UriBuilder uriBuilder;

			// Query each layer for route features and store the results in routeInfos.
			foreach (var layerId in layerSettings)
			{
				uriBuilder = new UriBuilder(string.Format("{0}/{1}/query", ConfigurationManager.AppSettings["stateRouteMapService"], layerId.Value));
				uriBuilder.Query = queryBuilder.ToString();

				// Query the map service layer and store the JSON results in a variable
				var queryRequest = WebRequest.Create(uriBuilder.Uri);
				var queryResponse = queryRequest.GetResponse();
				var queryResponseStream = queryResponse.GetResponseStream();
				Dictionary<string, object> dict;
				using (var streamReader = new StreamReader(queryResponseStream))
				{
					dict = jsSerializer.Deserialize<Dictionary<string, object>>(streamReader.ReadToEnd());
				}

				// Get the route names.
				var features = ((ArrayList)dict["features"]).Cast<Dictionary<string, object>>();
				var attributes = from feature in features
								 select feature["attributes"] as Dictionary<string, object>;
				var routeNamesInLayer = from attribute in attributes
										select attribute.First().Value as string;

				foreach (var routeName in routeNamesInLayer)
				{
					var routeType = layerId.Key == "increase" ? RouteTypes.Increase :
							layerId.Key == "decrease" ? RouteTypes.Decrease :
							RouteTypes.Ramp;
					if (routeInfos.ContainsKey(routeName))
					{
						routeInfos[routeName] = routeInfos[routeName] |= routeType;
					}
					else
					{
						routeInfos[routeName] = routeType;
					}
				}
			}

			context.Response.ContentType = "application/json";
			if (!formatSpecified)
			{
				context.Response.Write(jsSerializer.Serialize(routeInfos));
			}
			else if (outputFormat == OutputFormat.JQuery)
			{
				var output = from routeInfo in routeInfos
							 orderby routeInfo.Key
							 select new { label = routeInfo.Key, value = routeInfo.Key, routeLayers = routeInfo.Value };
				context.Response.Write(jsSerializer.Serialize(output));
			}
			context.Response.Cache.SetCacheability(HttpCacheability.Public);
			context.Response.Cache.SetExpires(DateTime.Now.AddMonths(1));
			context.Response.Cache.SetValidUntilExpires(true);
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