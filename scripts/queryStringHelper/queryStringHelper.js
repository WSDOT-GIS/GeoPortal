/*global define*/

define(function () {
	/**
	 * A module that creates and parses URL query strings.
	 * @exports queryStringHelper
	 */
	var exports = {};

	//var numberRe = /^-?\d+(?:\.\d+)?$/;

	var extentRe = /\bextent=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/i;

	/**
	 * 
	 * @param {string} [s=location.search]
	 */
	function getExtentValues(s) {
		// Zoom to the extent in the query string (if provided).
		// Test example:
		// extent=-13677603.622831678,5956814.051290565,-13576171.686297385,6004663.630997022

		if (!s) {
			s = window.location.search;
		}
		var match = s.match(extentRe);
		var coords;

		if (match) {
			match.splice(1, 4);
			coords = match.map(function (s) {
				return parseFloat(s);
			});
		}
		return coords;
	}

	/**
	 * Parses a key/value pair from a query string into an object.
	 * @param {string} kvp
	 */
	function KeyValuePair(kvp) {
		var arr = kvp.split("=");
		var key = arr[0];
		var value = arr.length >= 2 ? decodeURIComponent(arr[1]) : null;

		/**@member {string} */
		this.key = key;
		/**@member {?string} */
		this.value = value;
	}

	/**
	 * Converts an object into a query string.
	 * @returns {string}
	 */
	exports.objectToQueryString = function (/**{Object}*/ o) {
		var key, value, output;
		output = [];
		for (key in o) {
			if (o.hasOwnProperty(key)) {
				value = o[key];
				output.push([key, encodeURIComponent(value)].join("="));
			}
		}
		return output.join("&");
	};



	/**
	 * Converts a query string into an object.
	 * @param {string} [search=window.location.search]
	 * @returns {Object.<string, ?string>}
	 */
	exports.queryStringToObject = function (search) {
		var o = {}, kvPairs;
		if (!search) {
			search = window.location.search;
		}
		search = search.replace(/^\?/, "");
		if (search) {
			kvPairs = search.split("&");
			kvPairs.forEach(function (s) {
				var kvp;

				if (extentRe.test(s)) {
					o.extent = getExtentValues();
				} else {
					kvp = new KeyValuePair(s);
					o[kvp.key] = kvp.value;
				}
			});
		}
		return o;
	};

	return exports;
});