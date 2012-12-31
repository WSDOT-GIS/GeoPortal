/*global esri, dojo, jQuery */
/*jslint white: true, nomen: true */

// Copyright (C) 2012 Washington State Department of Transportation.  Licensed under The MIT License (http://opensource.org/licenses/MIT).

/**
* @author Jeff Jacobson 
*/

define(["dojo/_base/declare", "esri/layers/graphics"], function (declare) {
	"use strict";

	var travelerApiSR = new esri.SpatialReference({ wkid: 4326 });


	function getCameraAttributes(cameraData) {
		var attributes, name, cameraLocation, clName, toOmit = /(Display)?((?:Longitude)|(?:Latitude))/;
		attributes = {};
		// Copy the properties from the camera data into "attributes" (excluding "CameraLocation").
		for (name in cameraData) {
			if (!toOmit.test(name) && cameraData.hasOwnProperty(name) && name !== "CameraLocation") {
				attributes[name] = cameraData[name];
			}
		}

		// Copy the properties of the CameraLocation property into "attributes".
		cameraLocation = cameraData.CameraLocation;
		for (clName in cameraLocation) {
			if (!toOmit.test(clName) && cameraLocation.hasOwnProperty(clName)) {
				// Check to see if the property already exists in attributes.  If it does, prefix name with "CameraLocation" so the existing value is not overwritten.
				if (attributes.hasOwnProperty(clName)) {
					attributes["CameraLocation" + clName] = cameraLocation[clName];
				} else {
					attributes[clName] = cameraLocation[clName];
				}
			}
		}

		return attributes;
	}

	function getCameraPoint(cameraData, toWebMercator) {
		var point = new esri.geometry.Point(cameraData.CameraLocation.Longitude, cameraData.CameraLocation.Latitude, travelerApiSR);

		// Convert the point from geo. to WebMercator if that option was specified.
		if (toWebMercator) {
			point = esri.geometry.geographicToWebMercator(point);
		}

		return point;
	}

	/**
	* Converts camera data into a graphic.
	* @param {Object} cameraData One of the camera data elements from the GetCamerasAsJson operation.
	* @param {Boolean} toWebMercator Set to true if you want the graphic to be converted to web mercator, false to leave at WGS 84.
	*/
	function cameraToGraphic(cameraData, toWebMercator) {
		var point, attributes, graphic;

		attributes = getCameraAttributes(cameraData);
		point = getCameraPoint(cameraData, toWebMercator);

		// Initialize the graphic attributes.
		graphic = new esri.Graphic();
		graphic.setAttributes({
			cameras: [attributes]
		}).setGeometry(point);

		return graphic;
	}

	declare("wsdot.layers.CameraGraphicsLayer", esri.layers.GraphicsLayer, {
		onRefreshStart: function () {
		},
		onRefreshEnd: function (error) {
		},
		/**
		* Creates a new instance of CameraGraphicsLayer
		* @param {Object} options The options for initializing this layer.  See the esri.layers.GraphicsLayer documentation for details.
		*/
		constructor: function (options) {
			this.url = options.url;
			this._options = options;
			this.refresh();
		},

		/**
		* Searches all of the graphics in the layer until a graphic in the same location as "point" is found.  
		* @param {esri.geometry.Point} point 
		* @return {esri.Graphic | null} Returns the first graphic found in the same location as "point", or null if no match is found.
		*/
		getGraphicAtLocation: function (point) {
			var layer = this, i, l, graphic, otherGraphic = null;

			for (i = 0, l = this.graphics.length; i < l; i++) {
				graphic = this.graphics[i];
				if (graphic.geometry.x === point.x && graphic.geometry.y === point.y) {
					otherGraphic = graphic;
					break;
				}
			}

			return otherGraphic;

		},

		/**
		* Adds camera data to the layer as a graphic. 
		* @param {Object} cameraData One of the objects from the array returned from the GetCameraDataAsJson array. 
		*/
		addCamera: function (cameraData) {
			var attributes, point, existingGraphic, newGraphic;
			point = getCameraPoint(cameraData, this._options.toWebMercator);
			// See if there are already any graphics where this camera is to be located...
			existingGraphic = this.getGraphicAtLocation(point);
			if (existingGraphic) {
				// Add attributes for the new camera to the exisitng graphic.
				attributes = getCameraAttributes(cameraData);
				existingGraphic.attributes.cameras.push(attributes);
			} else {
				// Create a new graphic
				newGraphic = cameraToGraphic(cameraData, this._options.toWebMercator);
				this.add(newGraphic);
			}
		},

		/**
		* Refreshes the layer's graphics.  Calls the Traveler API to get the camera data and recreates the graphics. 
		*/
		refresh: function () {
			var layer = this;

			/**
			* Converts an array of camera data to graphics and adds the graphics to the layer.
			* @param {Object} data An array of camera data (returned from the GetCamerasAsJson operation).
			*/
			function addCameraDataAsGraphics(data) {
				var i, l;
				try {
					for (i = 0, l = data.length; i < l; i += 1) {
						// layer.add(cameraToGraphic(data[i], layer._options.toWebMercator));
						layer.addCamera(data[i]);
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

			if (this._options.useJsonp) {
				dojo.io.script.get({
					url: layer.url,
					callbackParamName: "callback",
					load: addCameraDataAsGraphics,
					error: function (error) {
						layer.onRefreshEnd(error); // Trigger event.
					}
				});
			} else {
				// Query the WSDOT Traveler API for camera data...
				return dojo.xhrGet({
					url: layer.url,
					handleAs: "json",
					load: addCameraDataAsGraphics,
					error: function (error) {
						layer.onRefreshEnd(error); // Trigger event.
					}
				}, { useProxy: false });
			}
		}
	});

});