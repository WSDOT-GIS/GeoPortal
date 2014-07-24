/*global define, wsdot*/
// Create the Geocoder widget.
define([
	"dojo/_base/Color",
	"esri/layers/GraphicsLayer",
	"esri/dijit/Geocoder",
	"esri/symbols/SimpleMarkerSymbol",
	"esri/renderers/ClassBreaksRenderer",
	"esri/InfoTemplate"
], function (Color, GraphicsLayer, Geocoder, SimpleMarkerSymbol, ClassBreaksRenderer, InfoTemplate) {
	var geocoder, infoTemplate;

	infoTemplate = new InfoTemplate("Address", "<p>${name}</p><p>Score: ${Score}</p>");

	function setupGeocoder(map, node) {
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
					feature.setInfoTemplate(infoTemplate);
					map.infoWindow.setFeatures([feature]);
					map.infoWindow.show(feature.geometry);
					map.centerAt(feature.geometry);
				}
			}
		}

		geocoder.on("find-results", handleResults);
		geocoder.on("select", handleResults);

		return geocoder;
	}

	return setupGeocoder;

});