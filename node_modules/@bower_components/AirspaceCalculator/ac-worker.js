/*global self, importScripts, AirspaceCalculator*/

importScripts('AirspaceCalculator.js');

self.addEventListener("message", function (e) {
	var data = e.data;
	var imageServerUrl = data.imageServerUrl;
	var x = data.x;
	var y = data.y;
	var agl = data.agl;

	AirspaceCalculator.calculateSurfacePenetration(x, y, agl, imageServerUrl).then(function (result) {
		console.log("Airspace Calc. result", result);
	}, function (error) {
		console.error(error);
	});
});





