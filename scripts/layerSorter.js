(function ($) {
    "use strict";

    $.widget("ui.layerSorter", {
        options: {
            map: null
        },
        _list: null,
        _moveLayer: function (listItem) {
            var map, index, layer;
            map = this.options.map;
            layer = listItem.data("layer");
            if (map && layer) {
                index = $(listItem).index();
                map.reorderLayer(layer, index);
            }
        },
        _populateList: function () {
            var $this = this, map = this.options.map, i, l, layerId, layer;

            /// Create the list if it does not already exist.
            if (!this._list) {
                this._list = $("<ul>").appendTo(this.element).sortable({
                    stop: function (event, ui) {
                        var item = ui.item;
                        $this._moveLayer(item);
                    }
                }).disableSelection();
            }
            this._list.empty();

            for (i = 0, l = map.layerIds.length; i < l; i += 1) {
                layerId = map.layerIds[i];
                layer = map.getLayer(layerId);
                $(['<li class="ui-state-default" title="', layer.description, '"><span class="ui-icon ui-icon-arrowthick-2-n-s"></span>', layerId, '</li>'].join("")).data("layer", layer).appendTo(this._list);
            }
        },
        _refresh: function () {
            /// <summary>Updates the layer sorter list to match the layers</summary>
            this._populateList();
        },
        _create: function () {
            var $this = this, $element = $(this.element);

            $element.addClass("ui-layer-sorter");
            $("<p>Drag items in this list to rearrange layers.</p>").appendTo(this.element);

            // Populate the list of layers.
            this._populateList();

            // TODO: Add event handing to reorganize layers when layer's list item has been moved.
            dojo.connect(this.options.map, "onLayerReorder", $this, $this._populateList);

            return this;
        },
        _destroy: function () {
            // Call the base destroy method.
            $.Widget.prototype.destroy.apply(this, arguments);
        }
    });
} (jQuery));