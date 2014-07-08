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
		var link, i, l, output = [], re;
		re = new RegExp(["\\b", wdfwId, "_\\d+"].join(""), "i");
		for (i = 0, l = links.length; i < l; i += 1) {
			link = links[i];
			if (re.test(link.href)) {
				output.push(link.href);
			}
		}
		return output;
	}

	/**
	 * Creates the lightbox.
	 * @param {string[]} urls - An array of image URL strings.
	 */
	function createGallery(urls) {
		var galleryDiv, docFrag;

		function toGalleryItem(url, index, array) {
			var re = /([^\/]+)_(\d+)(\.\w+)$/i, match, title;
			match = url.match(re);
			title = match ? [match[1], " (", index + 1, " of ", array.length, ")"].join("") : url;

			return {
				title: title,
				href: url,
				type: "image/jpeg",
				thumbnail: url
			};
		}

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
				onopen: function () {
					console.debug(this, arguments);
				},
				container: '#blueimp-gallery-carousel',
				carousel: true
			}
		);
	}

	function handleImageListLoad() {
		var links, progress;
		// Remove the progress bar.
		progress = document.getElementById("progressBar");
		progress.parentElement.removeChild(progress);
		// If an ID is specified in the query string, select that element.
		wdfwId = getWdfwIdFromQueryString();
		// Get all of the links in the image list page.
		links = this.response.body.querySelectorAll("a[href]");
		// Convert links into ImageInfo objects and group by WDFW ID.
		var urls = linksToUrls(links);
		createGallery(urls);
	}

	// Setup the request for the list of images.
	var req = new XMLHttpRequest();
	req.onloadend = handleImageListLoad;
	req.open("get", imagesRootUrl, true);
	req.responseType = "document";
	req.send();
}());