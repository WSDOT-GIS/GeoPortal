/*global require, esri*/
/*jslint white:true*/

// Copyright ©2012 Washington State Department of Transportation (WSDOT).  Released under the MIT license (http://opensource.org/licenses/MIT).

require(["dojo/_base/lang", "esri/geometry"], function (lang) {
	"use strict";
	lang.extend(esri.geometry.Extent, {
		"toCsv": function () {
			var propNames = ["xmin", "ymin", "xmax", "ymax"],
						output = "",
						i, l;
			for (i = 0, l = propNames.length; i < l; i += 1) {
				if (i > 0) {
					output += ",";
				}
				output += this[propNames[i]];
			}
			return output;
		}
	});
});

