/**
 * Sets up draw toolbar
 */

import { DrawUIHelper, SymbolOptions } from "@wsdot/arcgis-js-draw-ui";
import Color from "esri/Color";
import InfoWindow from "esri/dijit/InfoWindow";
import Graphic from "esri/graphic";
import InfoTemplate from "esri/InfoTemplate";
import EsriMap from "esri/map";
import SimpleFillSymbol from "esri/symbols/SimpleFillSymbol";
import SimpleLineSymbol from "esri/symbols/SimpleLineSymbol";
import SimpleMarkerSymbol from "esri/symbols/SimpleMarkerSymbol";
import TextSymbol from "esri/symbols/TextSymbol";

/**
 * Sets up the draw toolbar and connects it to map.
 * @param map ArcGIS API map object.
 */
export function setupDrawUI(map: EsriMap) {
  function createInfoWindowContent(this: InfoWindow, graphic: Graphic) {
    const btn = document.createElement("button");
    const deleteButtonGraphic = function(this: any) {
      if (this.graphic) {
        map.infoWindow.hide();
        drawHelper.layer.remove(this.graphic);
      }
    };

    btn.type = "button";
    btn.textContent = "Delete";
    btn.title = "Delete this graphic";
    (btn as any).graphic = graphic;
    btn.classList.add("delete-graphic-button");
    btn.onclick = deleteButtonGraphic;
    return btn;
  }

  let drawHelper: DrawUIHelper;

  const drawToolsNode = document.getElementById("drawUI");

  if (drawToolsNode) {
    const lineSymbol = new SimpleLineSymbol();
    const pointSymbol = new SimpleMarkerSymbol();
    const fillSymbol = new SimpleFillSymbol();
    const textSymbol = new TextSymbol("Default Label");
    const lineColor = new Color("red");

    (lineSymbol.setColor(lineColor) as SimpleLineSymbol).setWidth(2);
    pointSymbol.setOutline(lineSymbol);
    fillSymbol.setOutline(lineSymbol);
    textSymbol.setColor(lineColor);

    const symbolOptions = new SymbolOptions(
      pointSymbol,
      lineSymbol,
      fillSymbol,
      textSymbol
    );

    drawHelper = new DrawUIHelper(map, drawToolsNode, symbolOptions, {
      id: "Drawn Features",
      infoTemplate: new InfoTemplate("Drawn Graphic", createInfoWindowContent)
    });

    drawHelper.on("draw-activate", () => {
      map.setInfoWindowOnClick(false);
    });
    drawHelper.on("draw-complete", () => {
      map.setInfoWindowOnClick(true);
    });
  }
}
