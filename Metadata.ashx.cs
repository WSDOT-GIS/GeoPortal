using System;
using System.Collections;
using System.Collections.Generic;
using System.Configuration;
using System.IO;
using System.Linq;
using System.Net;
using System.Text;
using System.Text.RegularExpressions;
using System.Web;
using System.Web.Script.Serialization;
using System.Xml;
using System.Xml.Xsl;
using Wsdot.Grdo.Web.Mapping.Properties;

namespace Wsdot.Grdo.Web.Mapping
{
	/// <summary>
	/// Summary description for Metadata
	/// </summary>
	public class Metadata : IHttpHandler
	{

		readonly static Regex
			_outputFormatRegex = new Regex("(?in)^(output)?f(ormat)?$"),
			_oidRegex = new Regex("(?in)^(o(bject)?)?id$"),
			_nameRegex = new Regex("^(?in)name$"),
			// Regexes for XSLT parameters passed via query string (or POST).
			_dublinCoreRegex = new Regex("(?in)^d(ublin)?c(ore)?$"),

			_jsUrlRegex = new Regex("(?in)^j(ava)?s(cript)?url$"),
			_cssUrlRegex = new Regex("(?in)^cssurl$"),

			_jsRegex = new Regex("(?in)^j(ava)?s(cript)?$"),
			_cssRegex = new Regex("(?in)^css?");





		public void ProcessRequest(HttpContext context)
		{
			// Get the parameters (query string or POST).
			var parameters = context.Request.Params;



			var keysEnum = from string key in parameters.Keys select key;

			// Check for an OID in the parameters.
			// Assign a value to the "oid" variable if an OID parameter was provided.
			int? oid = parameters.GetNullableInt(_oidRegex);

			// If there was no OID provided, check for a feature class name and assign a variable.
			string name = parameters.GetStringParameter(_nameRegex);

			if (!oid.HasValue && string.IsNullOrWhiteSpace(name))
			{
				context.Response.Write("{\"error\":\"Either an OID or a feature class name must be provided\"}");
				context.Response.ContentType = "application/json";
				context.Response.StatusCode = (int)HttpStatusCode.BadRequest;
				return;
			}

			// Build the ArcGIS REST URL that will query the map service.
			UriBuilder builder = new UriBuilder(string.Format("{0}/query", ConfigurationManager.AppSettings["metadataRestUrl"]));

			var qsDict = new Dictionary<string, string>();
			qsDict.Add("f", "json");
			qsDict.Add("outFields", "Documentation");
			qsDict.Add("returnGeometry", "false");

			if (oid.HasValue)
			{
				qsDict.Add("where", string.Format("ObjectID+%3D+{0}", oid.Value));
			}
			else if (!string.IsNullOrWhiteSpace(name))
			{
				qsDict.Add("where", string.Format("Name+%3D+'{0}'", name));
			}
			else
			{
				throw new NotSupportedException();
			}

			// Create the query string.
			var qsBuilder = new StringBuilder();
			int i = 0;
			foreach (var kvp in qsDict)
			{
				if (i > 0)
				{
					qsBuilder.Append("&");
				}
				qsBuilder.AppendFormat("{0}={1}", kvp.Key, kvp.Value);
				i++;
			}
			builder.Query = qsBuilder.ToString();

			WebRequest request = WebRequest.Create(builder.Uri);
			WebResponse response = request.GetResponse();

			// Read the response as JSON and then serialize it to an object.
			string json;
			using (StreamReader reader = new StreamReader(response.GetResponseStream()))
			{
				json = reader.ReadToEnd();
			}
			JavaScriptSerializer serializer = new JavaScriptSerializer();
			var data = serializer.Deserialize<Dictionary<string, object>>(json);

			// Get the array of features from the JSON.
			var features = (ArrayList)data["features"];
			if (features.Count < 1)
			{
				// If there are no features, return an error message.
				var errorDict = new Dictionary<string, string>();
				errorDict.Add("error", "No features were returned from this query.");
				context.Response.ContentType = "application/json";
				context.Response.StatusCode = (int)HttpStatusCode.NotFound;
			}
			else
			{
				var feature = (Dictionary<string, object>)features[0];
				var attributes = (Dictionary<string, object>)feature["attributes"];
				var xml = (string)attributes["Documentation"];

				// Get the specified output format.
				var outputFormat = parameters.GetStringParameter(_outputFormatRegex);
				// If an output format was specified and it is "xml", just return the XML;
				// otherwise convert the XML to HTML using the stylesheet.
				if (outputFormat != null && string.Compare(outputFormat, "xml", StringComparison.OrdinalIgnoreCase) == 0)
				{
					context.Response.ContentType = "text/xml";
					context.Response.Write(xml);
				}
				else
				{
					XmlDocument xmlDoc = new XmlDocument();
					xmlDoc.LoadXml(xml);

					XslCompiledTransform xsl = new XslCompiledTransform();

					var xslDoc = new XmlDocument();
					xslDoc.LoadXml(Resources.FgdcPlusHtml5);
					xsl.Load(xslDoc);

					context.Response.ContentType = "text/html";
					var args = new XsltArgumentList();

					string jsUrl = parameters.GetStringParameter(_jsUrlRegex);
					string cssUrl = parameters.GetStringParameter(_cssUrlRegex);

					bool includeDublinCore = parameters.GetBooleanParameter(_dublinCoreRegex);
					bool includeJS = parameters.GetBooleanParameter(_jsRegex);
					bool includeCss = parameters.GetBooleanParameter(_cssRegex);

					if (!string.IsNullOrWhiteSpace(jsUrl))
					{
						args.AddParam("externalJS", string.Empty, jsUrl);
					}
					else
					{
						args.AddParam("includeJavaScript", string.Empty, includeJS);
					}

					if (!string.IsNullOrWhiteSpace(cssUrl))
					{
						args.AddParam("externalCss", string.Empty, cssUrl);
					}
					else
					{
						args.AddParam("includeCss", string.Empty, includeCss);
					}
					args.AddParam("includeDublinCore", string.Empty, includeDublinCore);


					xsl.Transform(xmlDoc, args, context.Response.OutputStream);
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