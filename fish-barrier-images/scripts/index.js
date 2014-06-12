(function () {
	var imagesRootUrl = "http://hqolymgis21t/FishBarrierImages/";
	var wdfwIdRe = /^([^_]+)_(\d+)\.\w+$/;
	var imageInfos;

	function ImageInfo(anchor) {
		var filename = anchor.textContent;
		var match = filename.match(wdfwIdRe);
		this.wdfwId = match ? match[1] : null;
		this.url = [imagesRootUrl, encodeURIComponent(filename)].join("");
	}

	function createThumbnailDiv(url) {
		var div, a, img;

		div = document.createElement("div");
		div.setAttribute("class", "col-xs-6 col-md-3");

		a = document.createElement("a");
		a.href = url;
		a.target = "_blank";
		a.setAttribute("class", "thumbnail img-thumbnail");
		div.appendChild(a);

		img = document.createElement("img");
		img.setAttribute("data-src", url);
		img.src = url;
		a.appendChild(img);

		return div;
	}

	function handleSelection(e) {
		var thumbContainer = document.getElementById("thumbnailContainer");
		// Remove child nodes.
		while (thumbContainer.hasChildNodes()) {
			thumbContainer.removeChild(thumbContainer.lastChild);
		}

		var urls = e.target.value ? JSON.parse(e.target.value) : null;

		var docFrag = document.createDocumentFragment();

		if (urls) {
			urls.forEach(function (url) {
				docFrag.appendChild(createThumbnailDiv(url));
			});
		}
		thumbContainer.appendChild(docFrag);
	}

	/**
	 * @param {Object.<string,ImageInfo[]>} imageInfos
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
				select.appendChild(option);
			}
		}
		select.selectedIndex = 0;
		select.onchange = handleSelection;
		return select;
	}

	var req = new XMLHttpRequest();
	req.onloadend = function () {
		var links, link, imageInfo, i, l;
		var progress = document.getElementById("progressBar");
		progress.parentElement.removeChild(progress);
		links = this.response.body.querySelectorAll("a[href]");
		imageInfos = {};
		for (i = 0, l = links.length; i < l; i += 1) {
			link = links[i];
			if (wdfwIdRe.test(link)) {
				//imageInfos.push(new ImageInfo(link));
				imageInfo = new ImageInfo(link);

				// Create the array for this WDFW ID if it doesn't exist.
				if (!imageInfos.hasOwnProperty(imageInfo.wdfwId)) {
					imageInfos[imageInfo.wdfwId] = [imageInfo.url];
				} else {
					imageInfos[imageInfo.wdfwId].push(imageInfo.url);
				}
			}
		}
		
		var select = createSelect(imageInfos);
		document.body.insertBefore(select, document.getElementById("thumbnailContainer"));
	};
	req.open("get", imagesRootUrl, true);
	req.responseType = "document";
	req.send();
}());