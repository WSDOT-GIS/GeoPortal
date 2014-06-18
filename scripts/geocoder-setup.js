/*global define, wsdot*/
// Create the Geocoder widget.
define([
	"dojo/_base/Color",
	"esri/layers/GraphicsLayer",
	"esri/dijit/Geocoder",
	"esri/symbols/SimpleMarkerSymbol",
	"esri/renderers/ClassBreaksRenderer",
	"esri/InfoTemplate",
	"dojo/_base/array"
], function (Color, GraphicsLayer, Geocoder, SimpleMarkerSymbol, ClassBreaksRenderer, InfoTemplate, array) {
	var geocoder, graphicsLayer;

	/**
		* Creates the graphics layer that the geocoder will use to show results.
		* @returns {GraphicsLayer}
		*/
	function createGraphicsLayer() {
		var renderer, layer, infos;
		renderer = new ClassBreaksRenderer(new SimpleMarkerSymbol(), "score");
		infos = [
		{
			minValue: 100,
			maxValue: 101,
			symbol: new SimpleMarkerSymbol().setColor(new Color("#00FF00")),
			label: "100",
			description: "Perfect Match"
		},
		{
			minValue: 90,
			maxValue: 100,
			symbol: new SimpleMarkerSymbol().setColor(new Color("#B0FF00")),
			label: "High",
			description: "High Score"
		},
		{
			minValue: 80,
			maxValue: 90,
			symbol: new SimpleMarkerSymbol().setColor(new Color("#FFFF00")),
			label: "Medium-High",
			description: "Medium-High Score"
		},
		{
			minValue: 70,
			maxValue: 80,
			symbol: new SimpleMarkerSymbol().setColor(new Color("#FF7D16")),
			label: "Medium",
			description: "Medium Score"
		},
		{
			minValue: 0,
			maxValue: 69,
			symbol: new SimpleMarkerSymbol().setColor(new Color("#FF0000")),
			label: "Low",
			description: "Low Score"
		}

		];
		array.forEach(infos, function (info) {
			renderer.addBreak(info);
		});

		layer = new GraphicsLayer({
			id: "Located Addresses",
			className: "address-graphics-layer",
			dataAttributes: ["score", "Addr_Type"]
		});
		layer.setInfoTemplate(new InfoTemplate("Address", "<p>${name}</p><p>Score: ${Score}</p>"));
		layer.setRenderer(renderer);

		return layer;
	}

	function setupGeocoder(map, node) {
		graphicsLayer = createGraphicsLayer();
		if (map.loaded) {
			map.addLayer(graphicsLayer);
		} else {
			map.on("load", function () {
				map.addLayer(graphicsLayer);
			});
		}

		
		geocoder = new Geocoder({
			arcgisGeocoder: {
				sourceCountry: "US",
				searchExtent: wsdot.config.mapOptions.extent,
				placeholder: "Find an address"
			},
			autoComplete: true,
			autoNavigate: false,
			map: map
		}, node);
		geocoder.startup();
		geocoder.focus();

		/** @typedef {Object} GeocodeResult
		 * @property {string} name - The returned address string.
		 * @property {Extent} extent
		 * @property {Graphic} feature - Attributes include Addr_Type (e.g., "StreetAddress") and Score (e.g., 100).
		 */

		/** @typedef {Object} GeocodeResponse
		 * @property {GeocodeResult} result
		 * @property {Geocoder} target
		 */

		/** Handles the response from a Geocode operation.
			* @param {GeocodeResult} response
			*/
		function handleResults(response) {
			var feature;
			if (response.result) {
				feature = response.result.feature;
				if (feature) {
					feature.attributes.name = response.result.name;
					graphicsLayer.add(feature);
					map.infoWindow.setFeatures([feature]);
					map.infoWindow.show(feature.geometry);
				}
			}
		}

		geocoder.on("find-results", handleResults);
		geocoder.on("select", handleResults);

		return geocoder;
	}

	return setupGeocoder;

});