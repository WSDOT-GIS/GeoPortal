(function () {
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
	function createThumbnailDiv(url, imgCount) {
		var div, a, img, md;

		div = document.createElement("div");
		md = 12 / imgCount;
		div.classList.add("col-xs-" + Math.round(md * 2));
		div.classList.add("col-md-" + Math.round(md));

		a = document.createElement("a");
		a.href = url;
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
		selectedOption = document.querySelector("option:checked:not([disabled])");

		// Get the list of image URLs associated with the selected option.
		urls = selectedOption && selectedOption.value ? JSON.parse(selectedOption.value) : null;

		// Create thumbnails for each of the image URLs.
		if (urls) {
			docFrag = document.createDocumentFragment();
			urls.forEach(function (url) {
				docFrag.appendChild(createThumbnailDiv(url, urls.length));
			});
			thumbContainer.appendChild(docFrag);

			// Update the query string with the currently selected WDFW ID.
			wdfwId = selectedOption.getAttribute("data-wdfwid");
			url = [location.pathname, "?id=", wdfwId].join("");
			history.replaceState({ "id": wdfwId }, "Images for " + wdfwId, url);
		}

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
				wdfwid = decodeURIComponent(match[1]).replace("+", " ");
			}
		}
		return wdfwid;
	}

	function getNoSelect() {
		var output = false, re = /no\-?select/i;
		if (location.search) {
			if (re.test(location.search)) {
				output = true;
			}
		}
		return output;
	}

	/** Creates a <select> containing options for each ImageInfo.
	 * @param {Object.<string,ImageInfo[]>} imageInfos
	 * @param {string} [wdfwid]
	 * @returns {HTMLSelectElement}
	 */
	function createSelect(imageInfos, wdfwid) {
		var select, option, selectedOption, docFrag, hidden = getNoSelect();
		select = document.createElement("select");
		if (hidden) {
			select.hidden = true;
		}
		docFrag = document.createDocumentFragment();
		option = document.createElement("option");
		option.disabled = true;
		option.textContent = "Select a fish passage barrier ID";
		docFrag.appendChild(option);
		for (var i in imageInfos) {
			if (imageInfos.hasOwnProperty(i)) {
				option = document.createElement("option");
				option.textContent = [i, " (", imageInfos[i].length, " images )"].join("");
				option.value = JSON.stringify(imageInfos[i]);
				option.setAttribute("data-wdfwid", i);
				if (i === wdfwid) {
					option.selected = true;
					selectedOption = option;
				}
				docFrag.appendChild(option);
			}
		}
		select.onchange = handleSelection;
		select.appendChild(docFrag);
		document.body.insertBefore(select, document.getElementById("thumbnailContainer"));
		/*jshint eqnull:true*/
		if (selectedOption) {
			select.selectedIndex = selectedOption.index;
		} else {
			select.selectedIndex = 0;
		}
		/*jshint eqnull:false*/
		return select;
	}

	/** Converts a NodeList of <a> elements into arrays of image infos keyed by WDFW IDs.
	 * @param {NodeList} links
	 * @returns {Object.<string, ImageInfo[]>}
	 */
	function linksToImageInfos(links) {
		var link, i, l, imageInfo, output = {};
		for (i = 0, l = links.length; i < l; i += 1) {
			link = links[i];
			if (wdfwIdRe.test(link)) {
				imageInfo = new ImageInfo(link);

				// Create the array for this WDFW ID if it doesn't exist.
				if (!output.hasOwnProperty(imageInfo.wdfwId)) {
					output[imageInfo.wdfwId] = [imageInfo.url];
				} else {
					output[imageInfo.wdfwId].push(imageInfo.url);
				}
			}
		}
		return output;
	}

	function handleImageListLoad() {
		var links, progress, wdfwid;
		// Remove the progress bar.
		progress = document.getElementById("progressBar");
		progress.parentElement.removeChild(progress);
		// If an ID is specified in the query string, select that element.
		wdfwid = getWdfwIdFromQueryString();
		// Get all of the links in the image list page.
		links = this.response.body.querySelectorAll("a[href]");
		// Convert links into ImageInfo objects and group by WDFW ID.
		imageInfos = linksToImageInfos(links);

		// Create the select element and insert before the thumbnail container.
		var select = createSelect(imageInfos, wdfwid);


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