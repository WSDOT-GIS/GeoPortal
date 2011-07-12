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

        public void ProcessRequest(HttpContext context)
        {
            // Get the parameters (query string or POST).
            var parameters = context.Request.Params;

            Regex oidRegex = new Regex("(?in)^(o(bject)?)?id$");
            Regex nameRegex = new Regex("^(?in)name$");


            // Check for an OID in the parameters.
            string oidKey = (from string key in parameters.Keys select key).FirstOrDefault(k => oidRegex.IsMatch(k));
            // Assign a value to the "oid" variable if an OID parameter was provided.
            int? oid = oidKey == null ? default(int?) : int.Parse(parameters[oidKey]);

            // If there was no OID provided, check for a feature class name and assign a variable.
            string nameKey = oid.HasValue ? null : (from string key in parameters.Keys select key).FirstOrDefault(k => nameRegex.IsMatch(k));
            string name = nameKey == null ? null : parameters[nameKey];

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

            string json;
            using (StreamReader reader = new StreamReader(response.GetResponseStream()))
            {
                json = reader.ReadToEnd();
            }
            JavaScriptSerializer serializer = new JavaScriptSerializer();
            var data = serializer.Deserialize<Dictionary<string, object>>(json);
            var features = (ArrayList)data["features"];
            if (features.Count < 1)
            {
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

                XmlDocument xmlDoc = new XmlDocument();
                xmlDoc.LoadXml(xml);

                XslCompiledTransform xsl = new XslCompiledTransform();

                var xslDoc = new XmlDocument();
                xslDoc.LoadXml(Resources.FGDC_Plus);
                xsl.Load(xslDoc);

                context.Response.ContentType = "text/html";
                xsl.Transform(xmlDoc, new XsltArgumentList(), context.Response.OutputStream);
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