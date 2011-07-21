using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Net;
using System.Web.Script.Serialization;
using System.IO;
using System.Collections;
using System.Configuration;

namespace Wsdot.Grdo.Web.Mapping
{
	/// <summary>
	/// Queries a map service to get 
	/// </summary>
	public class GetRoutes : IHttpHandler
	{
		enum RouteTypes
		{
			Increase = 1,
			Decrease = 2,
			Ramp = 4
		}

		public void ProcessRequest(HttpContext context)
		{
			var jsSerializer = new JavaScriptSerializer();
			
			// From the config file, get a dictionary that indicates which layer corresponds to which direction.  E.g., {"increase":1}
			Dictionary<string, int> layerSettings =
				(from kvp in jsSerializer.Deserialize<Dictionary<string, object>>(ConfigurationManager.AppSettings["stateRouteMapServiceLayers"])
				 select new { Key = kvp.Key, Value = Convert.ToInt32(kvp.Value) }).ToDictionary(k => k.Key, v => v.Value);
			
			// Initialize a dictionary that will be keyed by route name.  The associated value indicate in which layers the route occurs.
			var routeInfos = new Dictionary<string, RouteTypes>();
			
			// Get the URL format string from the config file.
			string queryUrlFormat = ConfigurationManager.AppSettings["stateRouteMapServiceQueryFormat"];

			// Query each layer for route features and store the results in routeInfos.
			foreach (var layerId in layerSettings)
			{
				// Query the map service layer and store the JSON results in a variable
				var queryRequest = WebRequest.Create(string.Format(queryUrlFormat, layerId.Value));
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
			context.Response.Write(jsSerializer.Serialize(routeInfos));
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