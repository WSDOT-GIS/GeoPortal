/**
 * A layer list that only creates a layer object when the user checks the associated checkbox.
 * @author Jeff Jacobson
 */

import connect = require("dojo/_base/connect");
import Extent = require("esri/geometry/Extent");
import Layer = require("esri/layers/layer");
import { createLayerNameFromUrl } from "../../utils/layerUtils";
import "./layerOptionsWidget";
import { createLayer, formatError, makeIdSafeString } from "./utils";

// tslint:disable:variable-name comment-format only-arrow-functions no-console

const _defaultContextMenuIcon =
  // tslint:disable-next-line:max-line-length
  "<span style='cursor:pointer'>&Rrightarrow;</span>"; // "<img src='images/layerList/contextMenu.png' style='cursor:pointer' height='11' width='11' alt='context menu icon' title='Layer Options' />";
const _defaultLoadingIcon =
  "<img src='images/ajax-loader.gif' height='16' width='16' alt='Loading icon' />";

interface ILayerExtensions {
  visibleLayers: number[];
  layerInfos: any[];
  metadataLayers: any;
  getMetadataUrl: (id: number) => string;
  setVisibleLayers: (layers: number[]) => void;
  getIdsOfLayersWithMetadata: (...params: any[]) => number[];
  supportsMetadata: (...params: any[]) => boolean;
}

/**
 * Toggles the visibility of a sublayer associated with a checkbox.
 * @param {Event} evt - An event object.  Must have a data.list property defined.
 */
function toggleSublayer(this: HTMLInputElement, evt: any) {
  // Initialize variables.  The currentId is the ID corresponding to the checkbox (this).
  const currentId = Number(this.value);
  const layer: Layer & ILayerExtensions = evt.data.layer;

  // Initialize the list of layers that will be sent to the setVisibleLayers method.
  const layers = this.checked ? [currentId] : new Array<number>();

  // Copy the ids of the currently visible layers (excluding "currentId") into a new array.
  for (let i = 0, l = layer.visibleLayers.length; i < l; i += 1) {
    const id = layer.visibleLayers[i];
    const layerInfo = layer.layerInfos[id];
    // Omit layers that have subLayers.
    if (id !== currentId && layerInfo && layerInfo.subLayerIds === null) {
      layers.push(id);
    }
  }

  // If the array is empty, add the value -1 to make the setVisibleLayers query valid.
  if (layers.length === 0) {
    layers.push(-1);
  }

  // Call the setVisibleLayers function.
  layer.setVisibleLayers(layers);
}

/**
 * Adds either an "expanded" or "collaped" class to the specified elements based on the visibility
 * of its child elements.
 * @param {Element} element - A list item element.
 * @param {Boolean} [isCollapsed] - Optional.  Use this to explicitly specify what state the element is in.
 * If omitted, the expanded/collapsed state will be determined automatically.
 */
function setTreeIcon(
  element: HTMLElement | JQuery<HTMLElement>,
  isCollapsed?: boolean
) {
  if (!element) {
    // Exit if element not specified.
    return;
  }

  // Determine the value of "isCollapsed" if not provided.
  if (typeof isCollapsed === "undefined") {
    isCollapsed = $("> ul", element).css("display") === "none";
  }

  // Set the class to either expanded or collapsed depending on the value of isCollapsed.
  if (isCollapsed) {
    $(element)
      .addClass("collapsed")
      .removeClass("expanded");
  } else {
    $(element)
      .addClass("expanded")
      .removeClass("collapsed");
  }
}

/**
 * Toggles the child list of a list item on or off.
 * @param {Object} evt - An event object.  The evt must have a data property that has a parent property.
 * @returns {Boolean} Returns false.
 */
function toggleChildList(evt: JQueryEventObject): boolean {
  const parent = evt.data.parent;
  const childLists = $("> ul", parent);
  const hidden = childLists.css("display") !== "none";

  setTreeIcon(parent, hidden);
  childLists.toggle("blind");
  return false;
}

function createSublayerControls(layer: Layer & ILayerExtensions) {
  if (typeof (layer as any).layerInfos === "undefined") {
    // Layer does not have sublayer infos.
    return null;
  }

  const output = $("<ul>").hide();

  // Create heirarchy for sublayers.
  for (let i = 0, l = layer.layerInfos.length; i < l; i += 1) {
    const layerInfo = layer.layerInfos[i];
    const li = $("<li>").attr({ "data-sublayerId": layerInfo.id });

    // Create a checkbox only if this is not a parent layer.
    const checkbox =
      layerInfo.subLayerIds !== null
        ? null
        : $("<input>")
            .attr({
              type: "checkbox",
              value: layerInfo.id,
              checked: layerInfo.defaultVisibility
            })
            .appendTo(li)
            .addClass("ui-layer-list-sublayer");
    if (layerInfo.subLayerIds === null) {
      $("<label>")
        .text(layerInfo.name)
        .appendTo(li);
    } else {
      // Attach an event to the label link that will toggle the child list.
      li.addClass("ui-layer-list-has-children");
      $("<label>")
        .text(layerInfo.name)
        .appendTo(li)
        .click(
          {
            parent: li
          },
          toggleChildList as any
        );
      setTreeIcon(li);
    }

    let parentUl: JQuery<HTMLElement> | undefined;

    // If its a parent layer, add directly to the output list.
    if (layerInfo.parentLayerId === -1) {
      output.append(li);
    } else {
      // Find the parent li
      const parentLi = $(
        ["li[data-subLayerId=", layerInfo.parentLayerId, "]"].join(""),
        output
      );
      // Get the parent list items child list.
      parentUl = $("ul", parentLi);
      // If a child list hasn't been created, create one now.
      if (parentUl.length === 0) {
        parentUl = $("<ul>").appendTo(parentLi);
      }
      parentUl.append(li);
    }

    // Attach an event to the checkbox.
    if (checkbox) {
      checkbox.change(
        {
          layer,
          list: parentUl
        },
        toggleSublayer
      );
    }
  }

  return output;
}

function showTools(event: any) {
  event.data.tools.show();
}

function hideTools(event: any) {
  event.data.tools.hide();
}

function showOptions(event: any) {
  const layer = event.data.layer;

  // Create the options widget inside a dialog.
  const dialog = ($("<div>") as any)
    .layerOptions({
      layer
    })
    .dialog({
      title: [layer.id, "Options"].join(" "),
      position: [event.clientX, event.clientY],
      modal: true,
      close(/*event, ui*/) {
        // Remove the dialog from the DOM and dispose of it.
        $(this)
          .dialog("destroy")
          .remove();
      }
    });
  return false;
}

/**
 * Removes the "layer not loaded" class and (if appropriate) sets up controls for the child layers.
 * @param {esri/layers/Layer} layer - A map service layer.
 */
function onLayerLoad(this: any, layer: Layer & ILayerExtensions) {
  // The "this" object is a ui.layerListItem widget.
  const $element = $(this.element);
  this._hideLoading();
  $element.removeClass("ui-layer-list-not-loaded");

  try {
    // Check to see if layer supports metadata by attempting to retrieve a list of feature layers from the Metadata SOE.
    // Add a "metadataLayers" property and set the value appropriately.
    // Add a "metadataUrl property to each layerInfo.
    if (typeof layer.getIdsOfLayersWithMetadata === "function") {
      layer.getIdsOfLayersWithMetadata(
        function(layerIds: number[]) {
          layer.metadataLayers = layerIds;

          if (layerIds && layerIds.length) {
            for (let i = 0, l = layerIds.length; i < l; i += 1) {
              const id = layerIds[i];
              const layerInfo = layer.layerInfos[id];
              layerInfo.metadataUrl = layer.getMetadataUrl(id);
            }
          }
        },
        function(/*error*/) {
          layer.metadataLayers = null;
        }
      );
    } else if (typeof layer.supportsMetadata === "function") {
      layer.supportsMetadata(
        function(metadataSupportInfo: any) {
          console.log("supports metadata", metadataSupportInfo);
        },
        function(error: Error) {
          console.error(error);
        }
      );
    }
  } catch (e) {
    console.error("Error creating metadata list for layer", {
      error: e,
      layer
    });
  }

  // Add options link
  const tools = $(this.options.contextMenuIcon)
    .appendTo($element)
    .click(
      {
        layer
      },
      showOptions
    );

  // Setup the mouse over and mouse out events.
  $element
    .mouseover(
      {
        tools
      },
      showTools
    )
    .mouseout(
      {
        tools
      },
      hideTools
    );

  // Add sublayers if the layer supports sub-layer visibility setting, and has more than one sub-layer.
  if (
    !this.options.layer.omitSublayers &&
    typeof layer.setVisibleLayers === "function" &&
    layer.layerInfos.length > 1
  ) {
    // Set the label to toggle sublayer list when clicked.
    $element.addClass("ui-layer-list-has-children");
    const label = $("> label", $element).click(
      { parent: $element },
      toggleChildList as any
    );
    $(createSublayerControls(layer) as any).appendTo($element);
    setTreeIcon($element[0]);
    // Expand the child list.
    label.click();
  }

  try {
    this.setIsInScale();
  } catch (e) {
    if (typeof console !== "undefined" && typeof console.error === "function") {
      console.error(e);
    }
  }
}

/**
 * Modify the control to show that an error has occured with this layer.
 * @param {Error} error - an error
 */
function onLayerError(this: any, error: Error) {
  // The "this" keyword will be a layerListItem widget.
  const layer = this._layer;
  if (!layer.loaded) {
    this.disable();
    this._hideLoading();
    $(this.element)
      .removeClass("ui-layer-list-not-loaded")
      .addClass("ui-state-error")
      .attr("title", "Error\n" + formatError(error));
  }
  // Trigger an event that can be used by consumers of this control..
  this._trigger("layerError", {
    error
  });
}

/**
 * Toggles the layer associated with a checkbox on or off.
 * @param {Object} eventObject - Contains information about the checkbox change event.
 */
function toggleLayer(eventObject: any) {
  const $this = eventObject.data.widget;
  // Turn the layer on if it is checked, off if not.
  if (eventObject.currentTarget.checked) {
    // If the layer hasn't been created yet, create it and add it to the map.
    // Otherwise, show the layer.
    if (!$this._layer) {
      $this._showLoading();
      $this._layer = createLayer($this.options.layer);
      $this.options.map.addLayer($this._layer);
      // Connect the layer load event.
      connect.connect($this._layer, "onError", $this, onLayerError);
      connect.connect($this._layer, "onLoad", $this, onLayerLoad);
    } else {
      $this._layer.show();
    }
  } else {
    if ($this._layer) {
      $this._layer.hide();
    }
  }
}

/**
 * Update the "is in scale" status for each layerListItem in a layerList.
 * Although delta and extent parameters are not used, they are necessary for the method signature.
 * @param {esri/geometry/Extent} extent - unused
 * @param {number} delta - unused
 * @param {number} levelChange - unused
 * @param {number} lod - unused.
 * @this {ui.layerList}
 */
function updateIsInScaleStatus(
  this: any, // JQuery<HTMLElement>,
  extent: Extent,
  delta: number,
  levelChange: number,
  lod: { scale: number }
) {
  // Get all of the layer list items in the current list.
  if (levelChange) {
    const layerListItems = $(".ui-layer-list-item", this.element);

    for (let i = 0, l = layerListItems.length; i < l; i += 1) {
      const layerListItem = layerListItems.eq(i);
      (layerListItem as any).layerListItem("setIsInScale", lod.scale);
    }
  }
}

$.widget("ui.layerListItem", {
  options: {
    layer: null, // An object that is used to create an layer.  Has an id, url, and layerType.
    map: null,
    label: null, // The label to be used instead of the layer's "id" property.
    contextMenuIcon: _defaultContextMenuIcon,
    loadingIcon: _defaultLoadingIcon
  },
  _showLoading() {
    $(".ui-layer-list-item-loading-icon", this.element).show();
  },
  _hideLoading() {
    $(".ui-layer-list-item-loading-icon", this.element).hide();
  },
  _checkbox: null,
  _layer: null, // This is where the Layer object will be stored.
  getLayer() {
    return this._layer;
  },
  _sublayerDiv: null,
  /**
   * Sets the "is in scale" status of this control
   * @param {number} scale - The current scale of the map.
   * @returns {ui.layerListItem} - Returns the calling layer list item.
   */
  setIsInScale(scale: number) {
    const outOfScaleClass = "ui-layer-list-out-of-scale";

    if (!this._layer) {
      return this;
    }

    const layer = this._layer;

    // If scale is not provided, get it from the map.
    if (scale === null || typeof scale === "undefined") {
      scale = this.options.map.__LOD.scale;
    }

    // Check to see if the layer has a scales property that is an array.
    const scales = this._layer.scales;
    if (typeof scales !== "undefined" && $.isArray(scales)) {
      const minScale = scales[0];
      const maxScale = scales[scales.length - 1];
      const isInScale =
        (minScale === 0 || minScale >= scale) &&
        (maxScale === 0 || maxScale <= scale);
      if (isInScale) {
        $(this.element).removeClass(outOfScaleClass);
      } else {
        $(this.element).addClass(outOfScaleClass);
      }
    }

    return this;
  },
  _addInfoFromLoadedLayer: onLayerLoad,
  _create() {
    const $this = this;

    $this.element.addClass("ui-layer-list-item ui-layer-list-not-loaded");

    // Add the layer checkbox to the widget and add change event handler.
    $this._checkbox = $("<input>")
      .attr({
        type: "checkbox",
        "data-layer-id":
          $this.options.layer.id || $this.options.layer.options.id
      })
      .appendTo($this.element)
      .change({ widget: $this }, toggleLayer);

    // Add the label for the checkbox.
    $("<label>")
      .text(
        $this.options.label ||
          $this.options.layer.id ||
          $this.options.layer.options.id ||
          "Unnamed"
      )
      .appendTo($this.element);

    ////// Add the loading progress bar.
    ////$("<progress>").text("Loading...").css({
    ////    "display": "block"
    ////}).appendTo($this.element).hide();

    $($this.options.loadingIcon)
      .addClass("ui-layer-list-item-loading-icon")
      .appendTo($this.element)
      .hide();

    // If this layer has already been loaded, call the layer load event handler.
    if (
      typeof $this.options.layer !== "undefined" &&
      $this.options.layer !== null &&
      typeof $this.options.layer.isInstanceOf === "function" &&
      $this.options.layer.isInstanceOf(Layer)
    ) {
      $this._layer = $this.options.layer;
      $this._addInfoFromLoadedLayer($this._layer);
      // Set the checkbox to match the layer's visibility.

      $this._checkbox[0].checked = $this._layer.visible;
      $($this.element).mouseout();
    }

    return this;
  },
  disable() {
    // Remove the change event handler, disable and uncheck the checkbox.
    this._checkbox.change(null).attr("disabled", true)[0].checked = false;
    $.Widget.prototype.disable.apply(this, arguments);
  },
  _destroy() {
    // Call the base destroy method.
    $.Widget.prototype.destroy.apply(this, arguments);
  }
});

$.widget("ui.layerListGroup", {
  options: {
    map: null,
    groupName: null,
    layers: null,
    startCollapsed: false,
    contextMenuIcon: _defaultContextMenuIcon,
    loadingIcon: _defaultLoadingIcon
  },
  _list: null,
  /**
   * Toggles the list of layers or subgroups on or off.
   * @returns {ui.layerListGroup} the calling layer list group returns itself.
   */
  toggle() {
    // Get the list.  If called from a click event, "this" will not be referencing the widget,
    // so we need to get the list an alternate way.
    const hidden = $("ul", this.element).css("display") === "none";
    // Expand the list if it is hidden, or collapse it if it is currently visible.  Then trigger the appropriate event.
    if (hidden) {
      this._list.show("blind");
      $(this.element).removeClass("collapsed");
      this._trigger("collapse", this);
    } else {
      this._list.hide("blind");
      $(this.element).addClass("collapsed");
      this._trigger("expand", this);
    }
    return this;
  },
  /**
   * Adds a layer to the layer list group.
   * @param {esri/layers/Layer} layer - a layer to be added to the group
   * @returns {ui.layerListGroup} the calling layer list group returns itself.
   */
  _addLayer(layer: Layer) {
    const layerListItem = ($("<li>").appendTo(this._list) as any).layerListItem(
      {
        layer,
        map: this.options.map,
        contextMenuIcon: this.options.contextMenuIcon,
        loadingIcon: this.options.loadingIcon
      }
    );
    this._trigger("layerAdd", this, {
      layer,
      layerListItem: layerListItem.data("layerListItem")
    });
    return this;
  },
  /**
   * Adds a child group to this group.
   * @param {string} name - The name that will be given to the group.
   * @param {Array} layers - An array of layer description objects that will be added to the new group.
   * @returns {ui.layerListGroup} the calling layer list group returns itself.
   */
  _addGroup(name: string, layers: any[]) {
    const group = ($("<li>").appendTo(this._list) as any).layerListGroup({
      groupName: name,
      startCollapsed: this.options.startCollapsed,
      layers,
      map: this.options.map,
      contextMenuIcon: this.options.contextMenuIcon,
      loadingIcon: this.options.loadingIcon
    });
    this._trigger("groupAdd", this, {
      name,
      layers,
      group: group.data("layerListGroup")
    });
    return this;
  },
  _create() {
    const $this = this;
    const layers = this.options.layers;

    // Add a class indicating that this is a layer list group.
    $($this.element).addClass("ui-layer-list-group");
    // Add the group header link.
    const link = $(["<a href='#'>", $this.options.groupName, "</a>"].join(""))
      .attr("href", "#")
      .appendTo($this.element);

    // Add a list to hold the child elements or arrays.
    $this._list = $("<ul>").appendTo($this.element);

    // Add the click event to the link which will toggle the list.
    link.click(function() {
      $this.toggle();
      return false;
    });

    // If layers is an array, it contains layers.  Otherwise it contains groups of layers.
    if ($.type(layers) === "array") {
      // For each layer in layers, add a list item and turn it into a layerListItem.
      for (let i = 0, l = layers.length; i < l; i += 1) {
        $this._addLayer(layers[i]);
      }
    } else if ($.type(layers) === "object") {
      // Add layer list groups for each property in the layers object.
      for (const name in layers) {
        if (layers.hasOwnProperty(name)) {
          $this._addGroup(name, layers[name]);
        }
      }
    }

    if ($this.options.startCollapsed) {
      $this.toggle();
    }

    return this;
  },
  _destroy() {
    $.Widget.prototype.destroy.apply(this, arguments);
  }
});

function getLayerId(layer: any) {
  const type = $.type(layer);
  let output: any;
  if (type === "string") {
    output = layer;
  } else {
    output = layer.id
      ? layer.id
      : layer.options && layer.options.id ? layer.options.id : null;
  }
  return output;
}

$.widget("ui.layerList", {
  options: {
    map: null,
    layers: null,
    startCollapsed: false,
    contextMenuIcon: _defaultContextMenuIcon,
    loadingIcon: _defaultLoadingIcon,
    startLayers: null,
    basemapRe: /layer((?:\d+)|(?:_osm)|(?:_bing))/i,
    bingRe: /layer_bing/i,
    osmRe: /layer_osm/i,
    bingLabel: "Bing",
    osmLabel: "OpenStreetMap",
    defaultBasemapLabel: "Basemap Layer",
    basemapGroupName: "Basemap",
    addAdditionalLayers: true
  },
  getWidget() {
    return this;
  },

  /**
   * Checks to see if a layer already exists in the layer list.
   * @param {Object} layer - a layer
   * @return {Boolean} Returns true if it exists, false otherwise.
   */
  _layerExistsInToc(layer: any) {
    let exists = false;
    const listItemElements = $(".ui-layer-list-item");
    for (let i = 0, l = listItemElements.length; i < l; i += 1) {
      const currentLayer = ($(listItemElements.eq(i)) as any).layerListItem(
        "getLayer"
      );
      if (currentLayer === layer) {
        exists = true;
        break;
      }
    }

    return exists;
  },
  /** Turns on all of the layers specified in the options.startLayers array. */
  _selectStartLayers() {
    const startLayerNames = this.options.startLayers;
    const listItems = $("li.ui-layer-list-item", this.element);
    for (let i = 0, l = listItems.length; i < l; i += 1) {
      const listItem = listItems[i];
      // Loop through all of the names to see if there is a match.
      for (
        let j = 0, nameCount = startLayerNames.length;
        j < nameCount;
        j += 1
      ) {
        const name = startLayerNames[j];
        if ($("label", listItem).text() === name) {
          // Get the checkbox
          let checkbox: any = $("> input", listItem);
          checkbox = checkbox.length ? checkbox[0] : null;

          // Click the checkbox.  This will check it and activate the associated layer.
          if (checkbox) {
            checkbox.click();
            $(checkbox).change(); // This line is necessary to turn the layer on in IE.
          }
          break; // Match found.  Go to the next list item.
        }
      }
    }
  },
  _childNodeType: null,
  _addGroup(name: string) {
    const group = ($(this._childNodeType).appendTo(
      this.element
    ) as any).layerListGroup({
      map: this.options.map,
      startCollapsed: this.options.startCollapsed,
      groupName: name,
      layers: this.options.layers[name],
      contextMenuIcon: this.options.contextMenuIcon,
      loadingIcon: this.options.loadingIcon
    });
    this._trigger("groupAdd", this, {
      group
    });
    return group;
  },
  _addLayer(layer: any, error: Error) {
    let parent = this.element;
    let basemapGroupFound = false;
    const layerId = getLayerId(layer);
    let label: string;
    if (this.options.basemapRe.test(layerId)) {
      // Check to see if a "Basemap" group exists.  Create one if it does not.  Set "parent" to the "Basemap" group.
      // $(".ui-layer-list-group").first().data("layerListGroup").options.groupName
      const groups = $(".ui-layer-list-group", this.element);
      for (let i = 0, l = groups.length; i < l; i += 1) {
        const group = groups.eq(i);
        const groupWidget = group.data("layerListGroup");
        if (
          Boolean(groupWidget.options) &&
          typeof groupWidget.options.groupName === "string" &&
          groupWidget.options.groupName === this.options.basemapGroupName
        ) {
          parent = group[0];
          basemapGroupFound = true;
          break;
        }
      }
      // Create "Basemap" group if it does not already exist.  Assign this group to parent.
      if (!basemapGroupFound) {
        parent = this._addGroup(this.options.basemapGroupName);
        parent.addClass("basemap-group");
      }

      parent = $("ul", parent);

      // Set the label.
      if (this.options.bingRe.test(layerId)) {
        label = this.options.bingLabel;
      } else if (this.options.osmRe.test(layerId)) {
        label = this.options.osmLabel;
      } else {
        label =
          createLayerNameFromUrl(layer) || this.options.defaultBasemapLabel;
      }
    }
    if (!error && !this._layerExistsInToc(layer)) {
      // Add the layer list item
      const layerListItem = ($(this._childNodeType).appendTo(
        parent
      ) as any).layerListItem({
        layer,
        map: this.options.map,
        contextMenuIcon: this.options.contextMenuIcon,
        loadingIcon: this.options.loadingIcon,
        label: label!
      });

      // Trigger an event.
      this._trigger("layerAdd", this, {
        layer,
        layerListItem: layerListItem.data("layerListItem")
      });
    }
    return this;
  },
  /**
   * Removes the list item corresponding to the given layer from the layerList.
   * Intended to be called from the map's removeLayer event.
   * @param layer The layer that will have its corresponding item removed.
   */
  _removeLayer(layer: Layer) {
    /// <summary></summary>
    /// <param name="layer" type="Layer"></param>
    // Get all of the layer list items that have had their layers loaded.
    const listItems = $(".ui-layer-list-item").filter(
      ":not(.ui-layer-list-not-loaded)"
    );
    // Find the one that matches the removed layer and remove it.
    for (let i = 0, l = listItems.length; i < l; i += 1) {
      // Get the item at the current index in a jQuery object.
      const item = listItems.eq(i);
      if ((item as any).layerListItem("getLayer") === layer) {
        item.remove();
        break;
      }
    }
    this._trigger("layerRemove", this, {
      layer
    });
  },
  _addLayersAlreadyInMap() {
    const map = this.options.map;
    const layerIds = map.layerIds.concat(map.graphicsLayerIds);
    // Add layers already in map to the TOC.
    for (let i = 0, l = layerIds.length; i < l; i += 1) {
      this._addLayer(map.getLayer(layerIds[i]));
    }
  },
  _create() {
    const $this = this;
    const map = this.options.map;

    // Add classes to this element for jQuery UI styling and for custom styling.
    $($this.element).addClass("ui-layer-list");

    // Get the base node DOM element.
    const baseNode = this.element.nodeName ? this.element : this.element[0];
    // Determine the type of DOM element.  If the baseNode is either an OL or UL, we will be adding LI elements.
    // Otherwise we will be adding DIV elements.
    $this._childNodeType = /[uo]l/i.test(baseNode.nodeName) ? "<li>" : "<div>";

    if ($.isArray($this.options.layers)) {
      // If the "layers" option is an array, add a layerListItem for each element in the array.
      for (let i = 0, l = $this.options.layers.length; i < l; i += 1) {
        $this._addLayer($this.options.layers[i]);
      }
    } else {
      // For each property in the "layers" object, add a layerListGroup.
      for (const name in $this.options.layers) {
        if ($this.options.layers.hasOwnProperty(name)) {
          $this._addGroup(name);
        }
      }
    }

    // Check the layers specified in the startLayers option.
    if ($.isArray($this.options.startLayers)) {
      $this._selectStartLayers();
    }

    // Setup zoom events to show if layer is out of scale.
    connect.connect(map, "extent-change", this, updateIsInScaleStatus);

    if ($this.options.addAdditionalLayers === true) {
      // Add an event to add layers to the TOC as they are added to the map.
      connect.connect(map, "onLayerAddResult", $this, this._addLayer);
      connect.connect(map, "onLayerRemove", $this, this._removeLayer);

      // Add layers already in map to the TOC.
      $this._addLayersAlreadyInMap();
    }

    return this;
  },
  _destroy() {
    // Call the base destroy method.
    // TODO: destroy the layer list items.
    $.Widget.prototype.destroy.apply(this, arguments);
  }
});

$.widget("ui.tabbedLayerList", {
  options: {
    map: null,
    layers: null,
    startCollapsed: false,
    contextMenuIcon: _defaultContextMenuIcon,
    loadingIcon: _defaultLoadingIcon,
    startLayers: null,
    basemapRe: /layer((?:\d+)|(?:_osm)|(?:_bing))/i,
    basemapGroupName: "Basemap",
    addAdditionalLayers: true
  },
  _create() {
    const $this = this;

    function createTabDiv(tabName: string, addAdditionalLayers?: boolean) {
      const layers: any[] = $this.options.layers[tabName] || [];
      // Create the ID for the current tab.
      const tabId = makeIdSafeString(
        tabName,
        "-",
        "ui-tabbed-layer-list-tab-",
        true
      );
      // Add a link for the current tab.
      tabList.append(
        ["<li><a href='#", tabId, "'>", tabName, "</a></li>"].join("")
      );
      // Create the currrent tab.
      const tabDiv = ($("<div>")
        .attr("id", tabId)
        .appendTo($this.element) as any).layerList({
        map: $this.options.map,
        layers,
        startCollapsed: $this.options.startCollapsed,
        contextMenuIcon: $this.options.contextMenuIcon,
        loadingIcon: $this.options.loadingIcon,
        startLayers: $this.options.startLayers,
        basemapRe: $this.options.basemapRe,
        basemapGroupName: $this.options.basemapGroupName,
        addAdditionalLayers: Boolean(addAdditionalLayers)
      });
    }

    const tabList = $("<ul>").appendTo($this.element);

    // Loop through each property in layers option and create a corresponding list item and div for each.
    for (const tabName in $this.options.layers) {
      if ($this.options.layers.hasOwnProperty(tabName)) {
        createTabDiv(tabName);
      }
    }

    // Add a group for additional layers
    if ($this.options.addAdditionalLayers) {
      createTabDiv("Additional", true);
    }

    $(this.element).tabs();

    return this;
  },
  _destroy() {
    $.Widget.prototype.destroy.apply(this, arguments);
  }
});
