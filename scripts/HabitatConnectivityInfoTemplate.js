/*global define*/
define([
	"esri/InfoTemplate"
], function (InfoTemplate) {

	// TODO: Don't show link until confirming that there are actually attachments.
	// Because some features may not have any associated graphics, use esriRequest to get attribute information.
	// If the response shows that there are attachments, replace the (currently not present) progress element
	// with the link.

	var galleryUrl = "http://wsdot-gis.github.io/arcgis-server-attachment-gallery/";

	function createGalleryLink(featureUrl) {
		var a = document.createElement("a");
		var qs = [
			["url", encodeURIComponent(featureUrl)].join("="),
			["fields", encodeURIComponent(attributeOrder.join(","))].join("=")
		].join("&");
		a.href = [galleryUrl, qs].join("?");
		a.textContent = "Attached Images";
		a.target = "_blank";
		return a;
	}

	var attributeOrder = [
		"Structure ID",
		"Location Name",
		"Fence ID",
		"Feature Name",
		"State Route ID",
		"Milepost",
		"Beginning Milepost",
		"Ending Milepost",
		"State Route Direction",
		"Fence Height",
		"Fence Material",
		"Post Material",
		"Structure Type",
		"Structure Subtype",
		"Structure Design Function",
		"I-4 Program",
		"Permeability Ranked",
		"Bridge Structure ID",
		"Bridge Number"
	];


	function createTable(graphic) {
		var displayFieldName = graphic.result.displayFieldName;
		var attr = graphic.attributes;
		var ignoreRe = /^((O(BJECT)?ID(_\d+)?)|(Shape(\.STLength\(\))))$/i;
		var table = document.createElement("table");

		var caption = document.createElement("caption");
		caption.textContent = attr[displayFieldName];

		table.appendChild(caption);
		table.classList.add("habitat-connectivity");

		var featureUrl = [graphic.layer.url, graphic.result.layerId, attr.OBJECTID].join("/");
		var link = createGalleryLink(featureUrl);


		var value, name, row, cell;

		row = document.createElement("tr");
		table.appendChild(row);
		cell = document.createElement("th");
		cell.colSpan = "2";

		cell.appendChild(link);



		row.appendChild(cell);
		
		for (var i = 0, l = attributeOrder.length; i < l; i++) {
			name = attributeOrder[i];
			if (attr.hasOwnProperty(name) && !ignoreRe.test(name) && name !== displayFieldName) {
				value = attr[name];
				row = table.insertRow(-1);
			
				cell = document.createElement("th");
				cell.textContent = name;
				row.appendChild(cell);

				cell = document.createElement("td");
				cell.textContent = value;
				row.appendChild(cell);
				table.appendChild(row);
			}
		}

		return table;
	}

	function createContent(graphic) {
		var table = createTable(graphic);
		return table;
	}

	return new InfoTemplate({
		content: createContent
	});

});