/*global define*/
define(["esri/SpatialReference", "esri/geometry/webMercatorUtils"], function (SpatialReference, webMercatorUtils) {
	var wgs84SR = new SpatialReference(4326);

	function addExportFeatureLink(infoWindow) {
		var actionList = infoWindow.domNode.querySelector(".actionList");
		var link = document.createElement("a");
		var docFrag = document.createDocumentFragment();
		link.textContent = "Export";
		link.href = "#";
		link.title = "Exports the feature to JSON";
		link.classList.add("action");
		link.classList.add("export-feature");
		// Add a space before adding link.
		docFrag.appendChild(document.createTextNode(" "));
		docFrag.appendChild(link);

		link.onclick = function () {
			// Get the currently selected feature.
			var feature = infoWindow.features[infoWindow.selectedIndex];

			// Project to WGS 84 if possible.
			if (webMercatorUtils.canProject(feature.geometry, wgs84SR)) {
				feature.geometry = webMercatorUtils.project(feature.geometry, wgs84SR);
			}

			// Convert to regular object.
			feature = feature.toJson();
			// Convert to JSON string.
			feature = JSON.stringify(feature, null, "\t");

			

			var uri = ["data:application/json", encodeURIComponent(feature)].join(",");

			this.href = uri;
			this.target = "_blank";

			//return false;
		};

		actionList.appendChild(docFrag);
		return link;
	}

	return {
		addExportFeatureLink: addExportFeatureLink
	};
});