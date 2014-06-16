﻿(function () {
	var imagesRootUrl = "http://hqolymgis21t/FishBarrierImages/";
	var wdfwIdRe = /^([^_]+)_(\d+)\.\w+$/;
	var imageInfos;

	/**
	 * An object representing information about an image.
	 */
	function ImageInfo(anchor) {
		var filename = anchor.textContent;
		var match = filename.match(wdfwIdRe);
		this.wdfwId = match ? match[1] : null;
		this.url = [imagesRootUrl, encodeURIComponent(filename)].join("");
	}

	/** Creates a thumbnail div for an image.
	 * @param {string} url - URL of an image.
	 * @returns {HTMLDivElement}
	 */
	function createThumbnailDiv(url) {
		var div, a, img;

		div = document.createElement("div");
		div.setAttribute("class", "col-xs-6 col-md-3");

		a = document.createElement("a");
		a.href = url;
		a.target = "_blank";
		a.setAttribute("class", "thumbnail img-responsive");
		div.appendChild(a);

		img = document.createElement("img");
		img.setAttribute("data-src", url);
		img.src = url;
		a.appendChild(img);

		return div;
	}

	/**
	 * Creates thumbnails for the selected WDFW ID.
	 */
	function handleSelection() {
		var thumbContainer, selectedOption, urls, docFrag, wdfwId, url;
		// Get the element that will contain the thumbnails.
		thumbContainer = document.getElementById("thumbnailContainer");
		// Remove child nodes.
		while (thumbContainer.hasChildNodes()) {
			thumbContainer.removeChild(thumbContainer.lastChild);
		}

		// Get the currently selected option.
		selectedOption = document.querySelector("option:checked");

		// Get the list of image URLs associated with the selected option.
		urls = selectedOption ? JSON.parse(selectedOption.value) : null;

		// Create thumbnails for each of the image URLs.
		if (urls) {
			docFrag = document.createDocumentFragment();
			urls.forEach(function (url) {
				docFrag.appendChild(createThumbnailDiv(url));
			});
			thumbContainer.appendChild(docFrag);
		}

		// Update the query string with the currently selected WDFW ID.
		wdfwId = selectedOption.getAttribute("data-wdfwid");
		url = [location.pathname, "?id=", wdfwId].join("");
		history.replaceState({ "id": wdfwId }, "Images for " + wdfwId, url);
	}

	/**
	 * Gets the WDFW ID specified in the query string.
	 * @returns {(string|null)} Returns the ID specified in the query string, or null if there is no corresponding query string parameter.
	 */
	function getWdfwIdFromQueryString() {
		var wdfwid = null, re = /id=([^&]+)/i, match;
		if (location.search) {
			match = location.search.match(re);
			if (match) {
				wdfwid = decodeURIComponent(match[1]);
			}
		}
		return wdfwid;
	}

	/** Creates a <select> containing options for each ImageInfo.
	 * @param {Object.<string,ImageInfo[]>} imageInfos
	 * @returns {HTMLSelectElement}
	 */
	function createSelect(imageInfos) {
		var select = document.createElement("select"), option;
		option = document.createElement("option");
		option.disabled = true;
		option.textContent = "Select a fish passage barrier ID";
		select.appendChild(option);
		for (var i in imageInfos) {
			if (imageInfos.hasOwnProperty(i)) {
				option = document.createElement("option");
				option.textContent = [i, " (", imageInfos[i].length, " images )"].join("");
				option.value = JSON.stringify(imageInfos[i]);
				option.setAttribute("data-wdfwid", i);
				select.appendChild(option);
			}
		}
		select.selectedIndex = 0;
		select.onchange = handleSelection;
		return select;
	}

	function handleImageListLoad() {
		var links, link, imageInfo, i, l, progress;
		// Remove the progress bar.
		progress = document.getElementById("progressBar");
		progress.parentElement.removeChild(progress);
		// Get all of the links in the image list page.
		links = this.response.body.querySelectorAll("a[href]");
		// Convert links into ImageInfo objects and group by WDFW ID.
		imageInfos = {};
		for (i = 0, l = links.length; i < l; i += 1) {
			link = links[i];
			if (wdfwIdRe.test(link)) {
				imageInfo = new ImageInfo(link);

				// Create the array for this WDFW ID if it doesn't exist.
				if (!imageInfos.hasOwnProperty(imageInfo.wdfwId)) {
					imageInfos[imageInfo.wdfwId] = [imageInfo.url];
				} else {
					imageInfos[imageInfo.wdfwId].push(imageInfo.url);
				}
			}
		}

		// Create the select element and insert before the thumbnail container.
		var select = createSelect(imageInfos);
		document.body.insertBefore(select, document.getElementById("thumbnailContainer"));

		// If an ID is specified in the query string, select that element.
		var wdfwid = getWdfwIdFromQueryString();
		var matchingOption = select.querySelector("[data-wdfwid='" + wdfwid + "']");
		if (matchingOption) {
			select.selectedIndex = matchingOption.index;
			handleSelection();
		}
	}

	// Setup the request for the list of images.
	var req = new XMLHttpRequest();
	req.onloadend = handleImageListLoad;
	req.open("get", imagesRootUrl, true);
	req.responseType = "document";
	req.send();
}());