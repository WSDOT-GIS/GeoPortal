import { IG2MOutput } from "@wsdot/arcgis-rest-lrs";
import ContentPane = require("dijit/layout/ContentPane");
import Color = require("esri/Color");
import PopupTemplate = require("esri/dijit/PopupTemplate");
import FeatureLayer = require("esri/layers/FeatureLayer");
import EsriMap = require("esri/map");
import SimpleRenderer = require("esri/renderers/SimpleRenderer");
import SimpleMarkerSymbol = require("esri/symbols/SimpleMarkerSymbol");
import { GeometryToMeasureForm } from "./GeometryToMeasureForm";
import { MeasureToGeometryForm } from "./MeasureToGeometryForm";
import {
  defaultLayerId,
  defaultLrsMapServiceUrl,
  IterateG2MOutputToFeatures,
  m2gOutputToFeatures
} from "./utils";

export function createCrabRoutesLayer(
  url: string = `${defaultLrsMapServiceUrl}/${defaultLayerId}`
) {
  const featureLayer = new FeatureLayer(url, {
    id: "CRAB Routes",
    outFields: ["RouteId"]
  });

  return featureLayer;
}

export function setupCrab(toolsAccordion: any) {
  const toolsAccordianDiv = document.getElementById("toolsAccordion");
  if (!toolsAccordianDiv) {
    throw Error("#toolsAccordion element not found.");
  }
  const paneDiv = document.createElement("div");
  paneDiv.id = "crabPane";
  toolsAccordianDiv.appendChild(paneDiv);
  const contentPane = new ContentPane(
    { title: "CRAB", id: "crabPane" },
    paneDiv
  );
  toolsAccordion.addChild(contentPane);
  const crabUI = document.createElement("div");

  crabUI.id = "drawUI";

  // When the map loads, add event handling code for the form.
  window.addEventListener("mapload", e => {
    // Get the map object from the event.
    const map = (e as any).detail as EsriMap;

    const crabRoutesLayer = createCrabRoutesLayer();

    const pointSymbol = new SimpleMarkerSymbol();
    pointSymbol.setColor(new Color("red"));
    const pointRenderer = new SimpleRenderer(pointSymbol);
    const layerDefinition = {
      geometryType: "esriGeometryPoint",
      fields: [
        {
          name: "measure",
          type: "esriFieldTypeDouble"
        },
        {
          name: "routeId",
          type: "esriFieldTypeString"
        }
      ]
    };

    // Create the layer for located points and add to map.
    const crabPointsLayer = new FeatureLayer(
      {
        layerDefinition,
        featureSet: null
      },
      {
        id: "CRAB Points"
      }
    );
    crabPointsLayer.setRenderer(pointRenderer);

    const pointsPopupTemplate = new PopupTemplate({
      title: "{measure} @ {routeId}",
      description:
        "<dl><dt>Route ID</dt><dd>{routeId}</dd><dt>Measure</dt><dd>{measure}</dd></dl>"
    });

    crabPointsLayer.setInfoTemplate(pointsPopupTemplate);

    map.addLayers([crabRoutesLayer, crabPointsLayer]);

    // Setup Geometry to Measure form.
    const g2mForm = new GeometryToMeasureForm(map);
    crabUI.appendChild(g2mForm.form);

    g2mForm.form.addEventListener("geometryToMeasure", g2mEvt => {
      const result = (g2mEvt as CustomEvent<IG2MOutput>).detail;
      const features = IterateG2MOutputToFeatures(result);

      let f = features.next();
      while (f) {
        if (f.done) {
          break;
        }
        crabPointsLayer.add(f.value);
        f = features.next();
      }
    });

    g2mForm.form.addEventListener("geometryToMeasureError", errorEvt => {
      const error = (errorEvt as CustomEvent).detail;
      // tslint:disable-next-line:no-console
      console.error("geometry to measure error", error);
      alert("Geometry to measure error. See console for details.");
    });

    // Add Measure to Geometry form.
    const m2gForm = new MeasureToGeometryForm();
  });

  paneDiv.appendChild(crabUI);
}
