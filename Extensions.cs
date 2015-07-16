using System;
using System.Collections.Specialized;
using System.Linq;
using System.Text.RegularExpressions;

namespace Wsdot.Grdo.Web
{
	public static class Extensions
	{
		public static string GetStringParameter(this NameValueCollection parameters, Regex re)
		{
			if (parameters == null) { throw new ArgumentNullException("parameters"); }
			if (re == null) { throw new ArgumentNullException("re"); }

			string key = (from string k in parameters.Keys select k).FirstOrDefault(k => re.IsMatch(k));
			return parameters[key];
		}

		/// <summary>
		/// Gets a <see cref="bool"/> parameter from a <see cref="NameValueCollection"/> using a <see cref="Regex"/> to match the key.
		/// </summary>
		/// <param name="parameters"></param>
		/// <param name="re"></param>
		/// <returns></returns>
		public static bool GetBooleanParameter(this NameValueCollection parameters, Regex re)
		{
			if (parameters == null) { throw new ArgumentNullException("parameters"); }
			if (re == null) { throw new ArgumentNullException("re"); }

			string boolAsString = parameters.GetStringParameter(re);
			bool output;
			if (boolAsString != null && bool.TryParse(boolAsString, out output))
			{
				return output;
			}
			else
			{
				return false;
			}
		}

		public static int? GetNullableInt(this NameValueCollection parameters, Regex re)
		{
			if (parameters == null) { throw new ArgumentNullException("parameters"); }
			if (re == null) { throw new ArgumentNullException("re"); }
			string intAsString = parameters.GetStringParameter(re);
			int output;
			if (string.IsNullOrWhiteSpace(intAsString))
			{
				return default(int?);
			}
			else if (int.TryParse(intAsString, out output))
			{
				return output;
			}
			else
			{
				return default(int?);
			}
		}

		public static string[] GetStringArrayParametrer(this NameValueCollection parameters, Regex re)
		{
			if (parameters == null) { throw new ArgumentNullException("parameters"); }
			if (re == null) { throw new ArgumentNullException("re"); }

			Regex csvRe = new Regex(@"[^,\[\]""]+");
			
			// Get the list of strings.
			string csv = parameters.GetStringParameter(re);
			var matches = csvRe.Matches(csv);
			if (matches != null && matches.Count > 0)
			{
				return (from Match match in matches select match.Value).ToArray();
			}
			else
			{
				return null;
			}
		}
	}
}