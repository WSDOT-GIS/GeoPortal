/*jshint jquery:true*/
/*jslint white: true, nomen: true*/
/*global dojo, jQuery */
(function ($, dojo) {
	"use strict";
	/**
	* A widget that displays visible layers' copyright information.
	*/
	$.widget("ui.copyrightInfo", {
		options: {
			/** {esri.Map} */map: null
		},
		_onLayerAddResultLink: null,
		_visibilityChangeLinks: [],
		_list: null,
		updateCopyrights: function () {
			var i, l, layer, layerId, map = this.options.map;
			// Clear existing copyright notices.
			this._list.empty();
			// Add a copyright notice for each layer that is visible and has a copyright property.
			for (i = 0, l = map.layerIds.length; i < l; i += 1) {
				layerId = map.layerIds[i];
				layer = map.getLayer(layerId);
				if (typeof (layer.copyright) !== "undefined" && layer.visible) {
					$("<li>").appendTo(this._list).text(layer.copyright);
				}
			}

			// If there are no copyright notices, hide this widget.  Otherwise, show it.
			if ($("> *", this._list).length === 0) {
				$(this.element).hide();
			} else {
				$(this.element).show();
			}
		},
		_create: function () {
			var $this = this, layerAddHandler, layerRemoveHandler, visibiltiyChangeHandler;

			// Add a class to allow styling.
			$this.element.addClass("ui-copyrightInfo");

			// Create a list to add the copyright items.
			$this._list = $("<ul>").appendTo($this.element);

			/** this {esri.layers.Layer} */
			visibiltiyChangeHandler = function ( /**{Boolean}*/visibility) {
				$this.updateCopyrights();
			};

			// This method is called when a layer is added.
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

			// Update the copyright information.
			layerRemoveHandler = function (/**{esri.layers.Layer}*/layer) {
				$this.updateCopyrights();
			};

			if ($this.options.map) {
				$this._onLayerAddResultLink = dojo.connect($this.options.map, "onLayerAddResult", $this, layerAddHandler);
				dojo.connect($this.options.map, "onLayerRemove", $this, layerRemoveHandler);
			}
			return this;
		},
		_destroy: function () {
			var i, l;
			// Restore the element to the state it was in before becoming a copyrightInfo widget.
			this._list.remove();
			this.element.removeClass("ui-copyrightInfo");
			// Disconnect dojo event handlers created by this widget.
			if (this._onLayerAddResultLink) {
				dojo.disconnect(this._onLayerAddResultLink);
			}
			// Disconnect the visibility change event handler links created by this widget.
			for (i = 0, l = this._visibilityChangeLinks.length; i < l; i += 1) {
				dojo.disconnect(this._visibilityChangeLinks[i]);
			}
			// Call the base destroy method.
			$.Widget.prototype.destroy.apply(this, arguments);
		}
	});
} (jQuery, dojo));