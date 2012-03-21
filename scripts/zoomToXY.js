(function ($) {
	$.widget("ui.zoomToXY", {
		options: {
			map: null,
			zoomLevel: 10,
			symbol: null
		},
		_xBox: null,
		_yBox: null,
		_graphicsLayer: null,
		_submitButton: null,
		_create: function () {
			var $this = this;

			$this._xBox = $("<input type='number' placeholder='X' title='Enter X coordinate here'>").appendTo($this.element);
			$this._yBox = $("<input type='number' placeholder='Y' title='Enter Y coordinate here'>").appendTo($this.element);
			$this._submitButton = $("<button type='button'>").text("Zoom to XY").appendTo($this.element).click(function () {
				var x, y, point, map, renderer, graphic;
				map = $this.options.map;
				// Get the X and Y values from the input boxes, then convert to numbers.
				x = $this._xBox.attr("value");
				y = $this._yBox.attr("value");

				x = Number(x);
				y = Number(y);

				// Check to make sure that the user put numbers into the text boxes.  (If the browser supports the HTML5 number type input, the boxes will not allow non-number values.)
				if (!isNaN(x) && !isNaN(y)) {
					point = new esri.geometry.Point(x, y, new esri.SpatialReference({ wkid: 4326 }));
					point = esri.geometry.geographicToWebMercator(point);
					map.centerAndZoom(point, $this.options.zoomLevel);
					map.infoWindow.setContent([x, y].join(",")).setTitle("Zoom to XY").show(point);

					// Create the graphics layer if it does not already exist.
					if (!$this._graphicsLayer) {
						// If no symbol was specified in the options, create a default.
						if (!$this.options.symbol) {
							$this.options.symbol = new esri.symbol.SimpleMarkerSymbol();
							$this.options.symbol.setColor(new dojo.Color("red"));
							$this.options.symbol.setStyle(esri.symbol.SimpleMarkerSymbol.STYLE_CIRCLE);
						}
						// Create a renderer to use for the graphics layer and assign it the symbol.
						renderer = new esri.renderer.SimpleRenderer($this.options.symbol);

						// Create the graphics layer, assign it a renderer, and add it to the map.
						$this._graphicsLayer = new esri.layers.GraphicsLayer({
							id: "Located XY"
						});
						$this._graphicsLayer.setRenderer(renderer);
						map.addLayer($this._graphicsLayer);

						// Add info template
						$this._graphicsLayer.setInfoTemplate(new esri.InfoTemplate("Zoom to XY", "${x},${y}"));

					}

					// Create the graphic.
					graphic = new esri.Graphic(point);
					graphic.setAttributes({
						x: x,
						y: y
					});

					// Add the graphic to the graphics layer.
					$this._graphicsLayer.add(graphic);

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