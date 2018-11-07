import MetadataOptions from "./MetadataOptions";

function setOpacity(event: any, ui: any) {
  const value = event.target.valueAsNumber || ui.value;
  const layer = event.data.layer;
  layer.setOpacity(value);
}

const LayerOptionsWidget = $.widget("ui.layerOptions", {
  options: {
    layer: null
  } as any,
  /**
   * Adds a metadata link if the layer has metadata ids specified.
   */
  _addMetadataLink() {
    const layer = this.options.layer;
    if (
      Array.isArray(layer.metadataLayers) &&
      layer.metadataLayers.length > 0
    ) {
      //  && !(layer.metadataOptions && !layer.metadataOptions.ignoreSoe
      const docfrag = document.createElement("div");
      docfrag.classList.add("metadata-list-container");
      const heading = document.createElement("h3");
      heading.textContent = "Metadata";
      docfrag.appendChild(heading);
      // Add metadata links from SOE
      if (
        !(layer.metadataOptions && layer.metadataOptions.ignoreSoe === true)
      ) {
        const ul = document.createElement("ul");
        docfrag.appendChild(ul);
        // Loop through each of the metadata ids and create an array of metadata info objects.
        for (let i = 0, l = layer.metadataLayers.length; i < l; i += 1) {
          const id = layer.metadataLayers[i];
          let url: string | null;
          try {
            url = layer.getMetadataUrl(id, "html");
          } catch (e) {
            // tslint:disable-next-line:no-console
            console.error("Error getting metadata URL", e);
            url = null;
          }
          if (url) {
            let label: string | undefined;
            if (layer.layerInfos) {
              label = layer.layerInfos[id].name;
            }
            // Add a link that will open metadata urls in a new window.
            const li = document.createElement("li");
            ul.appendChild(li);
            const a = document.createElement("a");
            a.href = url;
            a.textContent = label || "Metadata for sublayer " + id;
            a.setAttribute("class", "ui-layer-options-metadata-link");
            a.target = "_blank";
            li.appendChild(a);
          }
        }
      }
      // Add additional metadata links
      if (
        layer.metadataOptions &&
        layer.metadataOptions instanceof MetadataOptions
      ) {
        const ul = layer.metadataOptions.createListOfLinks();
        docfrag.appendChild(ul);
      }
      this.element[0].appendChild(docfrag);
    }
  },
  _create() {
    const $this = this;
    if (this.options.layer === null) {
      throw new Error("No layer specified");
    }

    const layer = $this.options.layer;

    // Add the opacity slider if the layer supports the setOpacity function.
    if (typeof layer.setOpacity === "function") {
      $("<label>")
        .text("Transparency")
        .appendTo($this.element);
      const sliderContainer = $("<div>")
        .addClass("ui-layer-list-opacity-slider-container")
        .appendTo($this.element);
      // Add opacity slider

      // Convert into a jQuery UI slider.  (HTML5 slider doesn't work in many browsers.)
      // Firefox and Chrome support it.
      const slider = $("<div>")
        .appendTo(sliderContainer)
        .slider({
          value: layer.opacity,
          min: 0,
          max: 1,
          step: 0.1
        })
        .appendTo(sliderContainer)
        .bind(
          "slidechange",
          {
            layer
          },
          setOpacity
        );
    }

    // Add metadata links.
    $this._addMetadataLink();
  },
  _destroy() {
    // Call the base destroy method.
    $.Widget.prototype.destroy.apply(this, arguments);
  }
});

export = LayerOptionsWidget;
