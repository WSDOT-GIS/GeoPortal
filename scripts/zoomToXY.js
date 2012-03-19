(function ($) {

	$.widget("ui.zoomToXY", {
		options: {
			map: null,
			zoomLevel: 10
		},
		_xBox: null,
		_yBox: null,
		_submitButton: null,
		_create: function () {
			var $this = this;

			$this._xBox = $("<input type='number' placeholder='X' title='Enter X coordinate here'>").appendTo($this.element);
			$this._yBox = $("<input type='number' placeholder='Y' title='Enter Y coordinate here'>").appendTo($this.element);
			$this._submitButton = $("<button type='button'>").text("Zoom to XY").appendTo($this.element).click(function () {
				var x, y, point, map;
				map = $this.options.map;
				x = $this._xBox.attr("value");
				y = $this._yBox.attr("value");

				x = Number(x);
				y = Number(y);

				if (!isNaN(x) && !isNaN(y)) {
					point = new esri.geometry.Point(x, y, new esri.SpatialReference({ wkid: 4326 }));
					point = esri.geometry.geographicToWebMercator(point);
					map.centerAndZoom(point, $this.options.zoomLevel);
					map.infoWindow.setContent([x, y].join(",")).setTitle("Zoom to XY").show(point);

				} else {
					alert("Invalid value in X or Y coordinate box");
				}

			});
		},
		_destroy: function () {
			// Call the base destroy method.
			$.Widget.prototype.destroy.apply(this, arguments);
		}
	});
} (jQuery));