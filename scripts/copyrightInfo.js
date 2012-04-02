(function ($, dojo) {
	/**
	* A widget that displays visible layers' copyright information.
	*/
	$.widget("ui.copyrightInfo", {
		options: {
			/** esri.Map */map: null
		},
		_onLayerAddResultLink: null,
		_visibilityChangeLinks: [],
		_list: null,
		updateCopyrights: function () {
			var i, l, layer, layerId, map = this.options.map;
			// Clear existing copyright notices.
			this._list.empty();
			for (i = 0, l = map.layerIds.length; i < l; i++) {
				layerId = map.layerIds[i];
				layer = map.getLayer(layerId);
				if (typeof (layer.copyright) !== "undefined") {
					$("<li>").appendTo(this._list).text(layer.copyright);
				}
			}

			if ($("> *", this._list).length === 0) {
				$(this.element).hide();
			} else {
				$(this.element).show();
			}
		},
		_create: function () {
			var $this = this, layerAddHandler, layerRemoveHandler, visibiltiyChangeHandler;

			$this.element.addClass("ui-copyrightInfo");

			$this._list = $("<ul>").appendTo($this.element);

			/** this {esri.layers.Layer} */
			visibiltiyChangeHandler = function ( /**{Boolean}*/visibility) {
				$this.updateCopyrights();
			};

			layerAddHandler = function (/** {esri.layers.Layer} */layer, /** {Error} */error) {
				var link;

				if (error) {
					return;
				}

				if (layer.visible) {
					$this.updateCopyrights();
				}

				// If the layer contains copyright information, setup an "onVisibilityChange" event handler.

				link = dojo.connect(layer, "onVisibilityChange", layer, visibiltiyChangeHandler);
				$this._visibilityChangeLinks.push(link);

			};

			layerRemoveHandler = function (/**{esri.layers.Layer}*/layer) {
				$this.updateCopyrights();
			};

			if ($this.options.map) {
				_onLayerAddResultLink = dojo.connect($this.options.map, "onLayerAddResult", $this, layerAddHandler);
			}
			return this;
		},
		_destroy: function () {
			this.element.removeClass("ui-copyrightInfo");
			var i, l;
			// Disconnect dojo event handlers created by this widget.
			if (this._onLayerAddResultLink) {
				dojo.disconnect(this._onLayerAddResultLink);
			}
			for (i = 0, l = this._visibilityChangeLinks.length; i < l; i += 1) {
				dojo.disconnect(this._visibilityChangeLinks[i]);
			}
			$.Widget.prototype.destroy.apply(this, arguments);
		}
	});
} (jQuery, dojo));