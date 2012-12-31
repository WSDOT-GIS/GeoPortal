/*global esri, dojo, wsdot */
/*jslint white: true, nomen: true */
/*jshint smarttabs:true, dojo:true */

/**
 * @author Jeff Jacobson 
 */

define(["dojo/_base/declare", "esri/layers/graphics"], function(declare) {
	"use strict";

	var travelerApiSR = new esri.SpatialReference({wkid: 4326});

	/**
	 * Parses the string date representations returned by .NET serialization into a Date object.
	 * @param {string} A .NET serialized date string.
	 * @return {Date} Returns the date that the input string represents, or null if the string could not be parsed successfully.
	 */
	function parseDotNetDate(str) {
		var dateRe = /Date\((\d+)([+\-]\d+)?\)/, match, output, ticks, offset;
		match = dateRe.exec(str);
		output = null;
		if (match) {
			ticks = Number(match[1]);
			offset = Number(match[2]);
			output = new Date(ticks + offset);
		}
		return output;
	}

	/**
	 * Returns an object containing the attributes in the input data element.  The returned object will be "flattened";
	 * The properties of the returned object will not be other objects, but values such as string, boolean, date, number, or null.
	 * @param {Object} travelerInfoData One of the travelerInfo data elements from the REST operation.
	 * @param {Boolean} toWebMercator Set to true if you want the graphic to be converted to web mercator, false to leave at WGS 84.
	 * @param {RegExp} xRe A regular expression that determines which field will be used for the X value.
	 * @param {RegExp} yRe A regular expression that determines which field will be used for the Y value.
	 * @return {esri.Graphic} 
	 */
	function getGraphic(travelerInfoData, toWebMercator, xRe, yRe) {
		var attributes, objects, x = null, y = null, graphic, point;
		attributes = {};
		objects = {};
		if (!yRe) {
			yRe = /Latitude/i;
		}
		if (!xRe) {
			xRe = /Longitude/i;
		}

		(function () {
			var name, value, date;
			for (name in travelerInfoData) {
				if (travelerInfoData.hasOwnProperty(name)) {
					value = travelerInfoData[name];
					if (typeof(value) === "object") {
						// If the value is itself another object, store it for later processing.
						objects[name] = value;
					} else if (typeof(value) === "string") {
						// Try to parse a date from the string value.
						date = parseDotNetDate(value);
						// If it was a date, assign the date to the attribute.  Otherwise assign the original string value.
						attributes[name] = date !== null ? date : dojo.trim(value);
					} else {
						attributes[name] = value;
					}
				}
			}
		}());

		// Now loop through all of the atttributes that were other objects.
		(function() {
			var name, value, oName, oValue, date, newAttrName;
			for (name in objects) {
				if (objects.hasOwnProperty(name)) {
					value = objects[name];
					for (oName in value) {
						if (value.hasOwnProperty(oName)) {
							oValue = value[oName];
							// Get the name for the new attribute.  If "attributes" already contains this name, add a prefix.
							newAttrName = attributes.hasOwnProperty(oName) ? name + oName : oName;
							if (typeof(oValue) === "string") {
								date = parseDotNetDate(oValue);
								attributes[newAttrName] = date !== null ? date : dojo.trim(oValue);
							} else {
								attributes[newAttrName] = oValue;
							}
						}
					}
				}
			}
		}());

		// Loop through the flattened list of attributes to get X and Y.
		(function(){
			var name, value;
			for (name in attributes) {
				if (attributes.hasOwnProperty(name)) {
					value = attributes[name];
					if (typeof(value) === "number") {
						if (xRe.test(name)) {
							x = value;
						} else if (yRe.test(name)) {
							y = value;
						}
					}

					// Break out of the loop if both X and Y values have been found. 
					if (x !== null && y !== null) {
						break;
					}
				}

			}
		}());

		point = new esri.geometry.Point(x, y, travelerApiSR);
		// Convert the point from geo. to WebMercator if that option was specified.
		if (toWebMercator) {
			point = esri.geometry.geographicToWebMercator(point);
		}
		graphic = new esri.Graphic();

		graphic.setGeometry(point).setAttributes(attributes);

		return graphic;
	}

	/**
	 * A data layer used for displaying information from the WSDOT Traveler Information API. 
	 * @class wsdot.layers.TravelerInfoGraphicsLayer 
	 */
	declare("wsdot.layers.TravelerInfoGraphicsLayer", esri.layers.GraphicsLayer, {
		onRefreshStart: function () {
		},
		onRefreshEnd: function (error) {
		},
		/**
		 * Creates a new instance of TravelerInfoGraphicsLayer
		 * @param {Object} options The options for initializing this layer.  See the esri.layers.GraphicsLayer documentation for details.
		 * @param {String} options.url The URL to the WSDOT Traveler Information API REST endpoint that is providing the data.
		 * @param {Boolean} options.toWebMercator The WSDOT Traveler Information API provides locations in WGS 1984.  
		 * If your map is using Web Mercator Auxiliary Sphere (102100), set this value to true.  If your map is WGS 1984, set this to false.
		 * Any other projection is not supported by this class.
		 * @param {RegExp} options.xRe A regular expression that determines which property of the traveler info data is used for the
		 * X coordinate.
		 * @param {RegExp} options.yRe A regular expression that determines which property of the traveler info data is used for the
		 * Y coordinate.
		 * */
		constructor: function (options) {
			this.url = options.url;
			this._options = options;
			this.refresh();
		},

		/**
		 * Adds travelerInfo data to the layer as a graphic. 
		 * @param {Object} travelerInfoData One of the objects from the array returned from the Get*AsJson array. 
		 */
		addTravelerInfo: function(travelerInfoData) {
			var graphic = getGraphic(travelerInfoData, this._options.toWebMercator, this._options.xRe, this._options.yRe);
			this.add(graphic);
		},

		/**
		 * Refreshes the layer's graphics.  Calls the Traveler API to get the travelerInfo data and recreates the graphics. 
		 */
		refresh: function () {
			var layer = this;

			/**
			 * Converts an array of travelerInfo data to graphics and adds the graphics to the layer.
			 * @param {Object} data An array of travelerInfo data (returned from the Get*AsJson operation).
			 */
			function addDataAsGraphics(data) {
				var i, l;
				try {
					for (i = 0, l = data.length; i < l; i += 1) {
						// layer.add(travelerInfoToGraphic(data[i], layer._options.toWebMercator));
						layer.addTravelerInfo(data[i]);
					}

					layer.onRefreshEnd(); // Trigger event.
				} catch (e) {
					layer.onRefreshEnd(e); // Trigger event.
				}
			}

			this.clear(); // Clear all of the existing graphics from the layer.
			this.onRefreshStart(); // Trigger event.

			// If a renderer was specified in the options, set the layer's renderer to match.
			if (this._options.renderer) {
				layer.setRenderer(this._options.renderer);
			}

			esri.request({
				url: layer.url,
				handleAs: "json"
			}).then(addDataAsGraphics, function (error) {
				layer.onRefreshEnd(error); // Trigger event.
			});
		}
	});
	
});