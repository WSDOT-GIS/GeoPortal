import { createLayerNameFromUrl } from "../utils/layerUtils";

export = $.widget("ui.layerSorter", {
  options: {
    map: null
  },
  _list: null,
  /**
   * Moves the layer corresponding list item to the same position in the map.
   * @param {HTMLLIElement} listItem - HTML list item element.
   */
  _moveLayer(listItem: JQuery<HTMLLIElement>) {
    const map = this.options.map;
    const layer = listItem.data("layer");
    if (map && layer) {
      // Determine the new index.  Remember, map index values are the reverse of that of the layer list.
      const index = map.layerIds.length - 1 - $(listItem).index();
      map.reorderLayer(layer, index);
    }
  },
  _populateList() {
    const $this = this;
    // Write an error to the console if the options property is not present, then exit.
    if (!this.options) {
      // tslint:disable-next-line:no-console
      console.error(
        "layerSorter._populateList: this.options not present.",
        this
      );
      return;
    }
    const map = this.options.map;
    // Create the list if it does not already exist.
    if (!this._list) {
      this._list = $("<ul>")
        .appendTo(this.element)
        .sortable({
          stop(event, ui) {
            const item = ui.item;
            $this._moveLayer(item);
          }
        })
        .disableSelection();
    }
    this._list.empty();

    // Loop through the layers in reverse order, so topmost layer is on the top of the list.
    for (let l = map.layerIds.length, i = l - 1; i >= 0; i -= 1) {
      const layerId = map.layerIds[i];
      const layer = map.getLayer(layerId);
      $(
        [
          '<li class="ui-state-default" title="',
          layer.description,
          '"><span class="ui-icon ui-icon-arrowthick-2-n-s"></span>',
          createLayerNameFromUrl(layer),
          "</li>"
        ].join("")
      )
        .data("layer", layer)
        .appendTo(this._list);
    }
  },
  _refresh() {
    /// <summary>Updates the layer sorter list to match the layers</summary>
    this._populateList();
  },
  _create() {
    const $this = this;
    const $element = $(this.element);

    $element.addClass("ui-layer-sorter");
    $("<p>Drag items in this list to rearrange layers.</p>").appendTo(
      this.element
    );

    // Populate the list of layers.
    this._populateList();

    // Add event handing to reorganize layers when layer's list item has been moved.
    // // dojo.connect(this.options.map, "onLayerReorder", $this, $this._populateList);
    this.options.map.on("layers-reordered", () => $this._populateList());

    return this;
  },
  _destroy() {
    // Call the base destroy method.
    $.Widget.prototype.destroy.apply(this, arguments);
  }
});
