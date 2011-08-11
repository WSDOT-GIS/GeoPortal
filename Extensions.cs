using Wsdot.Traffic;
using System.Collections.Generic;
using System.Text.RegularExpressions;
using System.Collections.Specialized;
using System;
using System.Linq;

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
	}
}

namespace Wsdot.Web.Mapping.Sample
{
	public class Point
	{
		public decimal x { get; set; }
		public decimal y { get; set; }

		// override object.Equals
		public override bool Equals(object obj)
		{
			//       
			// See the full list of guidelines at
			//   http://go.microsoft.com/fwlink/?LinkID=85237  
			// and also the guidance for operator== at
			//   http://go.microsoft.com/fwlink/?LinkId=85238
			//

			if (obj == null || GetType() != obj.GetType())
			{
				return false;
			}

			Point p = obj as Point;
			if (p != null)
			{
				return this.x == p.x && this.y == p.y;
			}

			return base.Equals(obj);
		}

		// override object.GetHashCode
		public override int GetHashCode()
		{
			return x.GetHashCode() ^ y.GetHashCode();
		}
	}

	public static class Extensions
	{
		public static Point ToPoint(this RoadwayLocation roadwayLocation)
		{
			return new Point { x = roadwayLocation.Longitude, y = roadwayLocation.Latitude };
		}
	}
}