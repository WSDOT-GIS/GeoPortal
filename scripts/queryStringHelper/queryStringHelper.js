/*global define*/

define(function () {
	/**
	 * A module that creates and parses URL query strings.
	 * @exports queryStringHelper
	 */
	var exports = {};

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
	 * @returns {Object.<string, ?string>}
	 */
	exports.queryStringToObject = function (/**{string}*/ search) {
		var o = {}, kvPairs;
		if (search) {
			kvPairs = search.split("&");
			kvPairs.forEach(function (s) {
				var arr = s.split("=");
				var key = arr[0];
				var value = arr.length >= 2 ? decodeURIComponent(arr[1]) : null;
				o[key] = value;
			});
		}
		return o;
	};

	return exports;
});