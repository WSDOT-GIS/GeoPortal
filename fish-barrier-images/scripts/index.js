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
	function createLightbox(urls) {
		var galleryDiv, docFrag, linksDiv, a, img, url, re = /([^\/]+)_(\d+)(\.\w+)$/i, match, title;
		galleryDiv = document.createElement("div");
		galleryDiv.id = "blueimp-gallery";
		galleryDiv.setAttribute("class", "blueimp-gallery");
		galleryDiv.innerHTML = '<div class="slides"></div><h3 class="title"></h3><a class="prev">‹</a><a class="next">›</a><a class="close">×</a><a class="play-pause"></a><ol class="indicator"></ol>';
		docFrag = document.createDocumentFragment();
		docFrag.appendChild(galleryDiv);

		// Create links.
		linksDiv = document.createElement("div");
		linksDiv.id = "links";
		docFrag.appendChild(linksDiv);
		for (var i = 0, l = urls.length; i < l; i += 1) {
			url = urls[i];
			match = url.match(re);
			title = !!match ? [match[1], " (", match[2], ")"].join("") : "untitled";

			a = document.createElement("a");
			a.href = url;
			a.title = title;
			linksDiv.appendChild(a);

			img = document.createElement("img");
			img.style.width = "calc(100%/6)";
			img.src = url;
			img.alt = title;
			a.appendChild(img);
		}

		document.body.appendChild(docFrag);

		linksDiv.onclick = function (event) {
			var target, link, options, links;
			event = event || window.event;
			target = event.target || event.srcElement;
			link = target.src ? target.parentNode : target;
			options = { index: link, event: event };
			links = this.getElementsByTagName('a');

			blueimp.Gallery(links, options);
		};
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
		createLightbox(urls);
	}

	// Setup the request for the list of images.
	var req = new XMLHttpRequest();
	req.onloadend = handleImageListLoad;
	req.open("get", imagesRootUrl, true);
	req.responseType = "document";
	req.send();
}());