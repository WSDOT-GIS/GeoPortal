using Wsdot.Traffic;
using System.Collections.Generic;
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