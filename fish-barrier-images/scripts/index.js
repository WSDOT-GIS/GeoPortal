/*global blueimp*/
(function () {
	var imagesRootUrl = "http://hqolymgis21t/FishBarrierImages/";
	var wdfwId;


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

	/** Converts a NodeList of <a> elements into an array of URLs.
	 * @param {NodeList} links
	 * @returns {string[]}
	 */
	function linksToUrls(links) {
		var link, i, l, output = [], re, url, filenameRe = /[^\/]+$/;
		// Create a RegExp that only matches image URLs for the WDFW ID.
		re = new RegExp(["\\b", encodeURIComponent(wdfwId), "_\\d+"].join(""), "i");
		for (i = 0, l = links.length; i < l; i += 1) {
			link = links[i];
			if (re.test(link.href)) {
				// Ensure the URL is pointing to the correct root, not relative to the current page.
				url = imagesRootUrl + link.href.match(filenameRe)[0];
				output.push(url);
			}
		}
		return output;
	}

	/**
	 * Creates the Gallery.
	 * @param {string[]} urls - An array of image URL strings.
	 */
	function createGallery(urls) {
		var galleryDiv, docFrag;

		/**
		 * Converts a URL into a gallery item for the blueimp.Gallery constructor. Meant for use with Array.prototype.map.
		 * @param {string} url
		 * @param {number} index
		 * @param {string[]} array
		 * @return {Object.<string, string>}
		 */
		function toGalleryItem(url, index, array) {
			var re = /([^\/]+)_(\d+)(\.\w+)$/i, match, title;
			match = url.match(re);
			title = match ? [decodeURIComponent(match[1]), " (", index + 1, " of ", array.length, ")"].join("") : url;

			return {
				title: title,
				href: url,
				type: "image/jpeg",
				thumbnail: url
			};
		}

		// Create the DOM elements used to create the gallery.
		docFrag = document.createDocumentFragment();
		galleryDiv = document.createElement("div");
		galleryDiv.id = "blueimp-gallery-carousel";
		galleryDiv.setAttribute("class", "blueimp-gallery blueimp-gallery-carousel blueimp-gallery-controls");
		galleryDiv.innerHTML = '<div class="slides"></div><h3 class="title"></h3><a class="prev">‹</a><a class="next">›</a><a class="play-pause"></a><ol class="indicator"></ol>';
		docFrag.appendChild(galleryDiv);

		document.body.appendChild(docFrag);

		blueimp.Gallery(
			urls.map(toGalleryItem),
			{
				container: '#blueimp-gallery-carousel',
				carousel: true
			}
		);
	}

	function handleImageListLoad() {
		var links, progress, urls, p;
		// Remove the progress bar.
		progress = document.getElementById("progressBar");
		progress.parentElement.removeChild(progress);
		// If an ID is specified in the query string, select that element.
		wdfwId = getWdfwIdFromQueryString();
		// Get all of the links in the image list page.
		links = this.response.body.querySelectorAll("a[href]");
		urls = linksToUrls(links);

		if (urls.length > 0) {
			// Convert links into ImageInfo objects and group by WDFW ID.
			// Create the gallery.
			createGallery(urls);
		} else {
			p = document.createElement("p");
			p.innerHTML = "No images available for <em>" + wdfwId + "</em>.";
			document.body.appendChild(p);
		}
	}

	// Setup the request for the list of images.
	var req = new XMLHttpRequest();
	req.onloadend = handleImageListLoad;
	req.open("get", imagesRootUrl, true);
	req.responseType = "document";
	req.send();
}());