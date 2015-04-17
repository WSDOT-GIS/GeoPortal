/*global define*/
define([], function () {
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

			// TODO: Project to WGS 84.

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