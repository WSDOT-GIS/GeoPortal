/*global define*/
define([
	"dojo/Deferred",
	"esri/request",
	"esri/InfoTemplate"
], function (Deferred, esriRequest, InfoTemplate) {

	var galleryUrl = "http://wsdot-gis.github.io/arcgis-server-attachment-gallery/";

	function createGalleryLink(featureUrl) {
		var a = document.createElement("a");
		var qs = [
			["url", encodeURIComponent(featureUrl)].join("="),
			["fields", encodeURIComponent(attributeOrder.join(","))].join("=")
		].join("&");
		a.href = [galleryUrl, qs].join("?");
		a.textContent = "View attached images in carousel";
		a.target = "_blank";
		return a;
	}

	function getAttributeData(featureUrl) {
		var deferred = new Deferred();
		var attributesUrl = [featureUrl, "attachments"].join("/");
		esriRequest({
			url: attributesUrl,
			content: {
				f: "json"
			}
		}).then(function (response) {
			if (response) {
				response.attachmentsUrl = attributesUrl;
				if (response.attachmentInfos) {
					deferred.resolve(response);
				} else if (response.error) {
					deferred.reject(response.error);
				}
			} else {
				deferred.reject(response);
			}
		}, function (error) {
			deferred.reject(error);
		});
		return deferred;
	}

	function createImageLinkList(getAttributeDataResponse) {
		var attachmentsUrl = getAttributeDataResponse.attachmentsUrl;
		var attachmentInfos = getAttributeDataResponse.attachmentInfos;
		var attInfo, ul, li, a;
		ul = document.createElement("ul");
		var imageTypeRe = /^image\//i;
		ul.classList.add("attachment-link-list");
		for (var i = 0, l = attachmentInfos.length; i < l; i += 1) {
			attInfo = attachmentInfos[i];
			li = document.createElement("li");
			a = document.createElement("a");
			a.href = [attachmentsUrl, attInfo.id].join("/");
			a.target = "_blank";
			a.textContent = attInfo.name;
			if (a.dataset) {
				a.dataset.size = attInfo.size;
				a.dataset.contentType = attInfo.contentType;
			}

			if (imageTypeRe.test(attInfo.contentType)) {
				li.classList.add("image-link-item");
			}

			li.appendChild(a);
			ul.appendChild(li);
		}
		return ul;
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



		var value, name, row, cell, linkProgress;

		row = document.createElement("tr");
		table.appendChild(row);
		cell = document.createElement("th");
		cell.colSpan = "2";

		var linkCell = cell;
		linkProgress = document.createElement("progress");
		linkProgress.textContent = "Loading attachment data...";
		linkCell.appendChild(linkProgress);

		// Query the attributes endpoint to see if the feature has attachments.
		getAttributeData(featureUrl).then(function (response) {
			linkCell.removeChild(linkProgress);
			var link, list;
			if (response.attachmentInfos && response.attachmentInfos.length > 0) {
				link = createGalleryLink(featureUrl);
				link.classList.add("gallery-link");
				linkCell.appendChild(link);

				list = createImageLinkList(response);
				linkCell.appendChild(list);
			} else {
				linkCell.textContent = "No attachments detected";
			}
		}, function (attributesError) {
			linkCell.removeChild(linkProgress);
			console.error("attributes error", attributesError);
		});

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