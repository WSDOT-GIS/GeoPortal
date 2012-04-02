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
		_addCopyright: function (/**{esri.layers.Layer}*/layer) {
			$("<div>", this.element).attr({
				"data-layerId": layer.id
			}).text(layer.copyright).appendTo(this.element);
		},
		_removeCopyright: function (/**{esri.layers.Layer}*/layer) {
			$("div[data-layerId=" + layer.id + "]", this.element).remove();
		},
		_create: function () {
			var $this = this, layerAddHandler, layerRemoveHandler, visibiltiyChangeHandler;

			$this.element.addClass("ui-copyrightInfo");

			/** this {esri.layers.Layer} */
			visibiltiyChangeHandler = function ( /**{Boolean}*/visibility) {
				if (visibility) {
					$this._addCopyright(this);
				} else {
					$this._removeCopyright(this);
				}
			};

			layerAddHandler = function (/** {esri.layers.Layer} */layer, /** {Error} */error) {
				var link;

				if (layer.visible) {
					$this._addCopyright(layer);
				}

				// If the layer contains copyright information, setup an "onVisibilityChange" event handler.
				if (typeof (layer.copyright) == "string" && layer.copyright.trim().length > 0) {
					link = dojo.connect(layer, "onVisibilityChange", layer, visibiltiyChangeHandler);
					$this._visibilityChangeLinks.push(link);
				}
			};

			layerRemoveHandler = function (/**{esri.layers.Layer}*/layer) {
				$this._removeCopyright(layer);
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