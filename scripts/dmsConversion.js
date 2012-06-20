/*jslint browser: true, nomen: true */
/*jshint dojo, jquery, nomen:false */
/*global jQuery */

(function ($) {
	"use strict";
	/** Defines the zoomToXY widget.
	* @example: $("#myDiv").zoomToXY({map: map});
	*/

	// Matches DMS coordinates
	// http://regexpal.com/?flags=gim&regex=^%28-%3F\d%2B%28%3F%3A\.\d%2B%29%3F%29[%C2%B0%3Ad]%3F\s%3F%28%3F%3A%28\d%2B%28%3F%3A\.\d%2B%29%3F%29[%27%E2%80%B2%3A]%3F\s%3F%28%3F%3A%28\d%2B%28%3F%3A\.\d%2B%29%3F%29[%22%E2%80%B3]%3F%29%3F%29%3F\s%3F%28[NSEW]%29%3F&input=40%3A26%3A46N%2C79%3A56%3A55W%0A40%3A26%3A46.302N%2079%3A56%3A55.903W%0A40%C2%B026%E2%80%B247%E2%80%B3N%2079%C2%B058%E2%80%B236%E2%80%B3W%0A40d%2026%E2%80%B2%2047%E2%80%B3%20N%2079d%2058%E2%80%B2%2036%E2%80%B3%20W%0A40.446195N%2079.948862W%0A40.446195%2C%20-79.948862%0A40%C2%B0%2026.7717%2C%20-79%C2%B0%2056.93172%0A
	var dmsRe = /^(-?\d+(?:\.\d+)?)[°:d]?\s?(?:(\d+(?:\.\d+)?)['′:]?\s?(?:(\d+(?:\.\d+)?)["″]?)?)?\s?([NSEW])?/i;
	// Results of match will be [full coords string, Degrees, minutes (if any), seconds (if any), hemisphere (if any)]
	// E.g., ["40:26:46.302N", "40", "26", "46.302", "N"]
	// E.g., ["40.446195N", "40.446195", undefined, undefined, "N"]

	/** Parses a Degrees Minutes Seconds string into a Decimal Degrees number.
	* @param {string}  dmsStr A string containing a coordinate in either DMS or DD format.
	* @return {Number} If dmsStr is a valid coordinate string, the value in decimal degrees will be returned.  Otherwise NaN will be returned.
	*/
	function parseDms(dmsStr) {
		var output = NaN, dmsMatch, degrees, minutes, seconds, hemisphere;
		dmsMatch = dmsRe.exec(dmsStr);
		if (dmsMatch) {
			degrees = Number(dmsMatch[1]);

			minutes = typeof (dmsMatch[2]) !== "undefined" ? Number(dmsMatch[2]) / 60 : 0;
			seconds = typeof (dmsMatch[3]) !== "undefined" ? Number(dmsMatch[3]) / 3600 : 0;
			hemisphere = dmsMatch[4] || null;
			if (hemisphere !== null && /[SW]/i.test(hemisphere)) {
				degrees = Math.abs(degrees) * -1;
			}
			if (degrees < 0) {
				output = degrees - minutes - seconds;
			} else {
				output = degrees + minutes + seconds;
			}
		}
		return output;
	}

	$.parseDms = parseDms;
}(jQuery));