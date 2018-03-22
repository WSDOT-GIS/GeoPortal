import { IG2MOutput, IM2GOutput } from "@wsdot/arcgis-rest-lrs";
import ContentPane = require("dijit/layout/ContentPane");
import Graphic = require("esri/graphic");
import ArcGISDynamicMapServiceLayer = require("esri/layers/ArcGISDynamicMapServiceLayer");
import EsriMap = require("esri/map");

import { GeometryToMeasureForm } from "./GeometryToMeasureForm";
import { crabLinesLayer, crabPointsLayer } from "./layers";
import { MeasureToGeometryForm } from "./MeasureToGeometryForm";
import {
  defaultLayerId,
  defaultLrsMapServiceUrl,
  IterateG2MOutputToFeatures,
  m2gOutputToFeatures
} from "./utils";

export function setupCrab(
  toolsAccordion: any,
  serviceUrl: string = defaultLrsMapServiceUrl,
  layerId: number = defaultLayerId
) {
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

    const crabRoutesLayer = new ArcGISDynamicMapServiceLayer(
      defaultLrsMapServiceUrl
    );

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
    const m2gForm = new MeasureToGeometryForm(serviceUrl, layerId);

    crabUI.appendChild(m2gForm.form);
    m2gForm.form.addEventListener("m2gsubmit", async evt => {
      const promise = (evt as CustomEvent<Promise<IM2GOutput>>).detail;
      let output: IM2GOutput;
      try {
        output = await promise;
      } catch (err) {
        console.error("measureToGeometry", err);
        return;
      }
      const iterator = m2gOutputToFeatures(output);

      let current = iterator.next();

      while (!current.done) {
        const graphic = current.value;
        if (/Point$/i.test(graphic.geometry.type)) {
          crabPointsLayer.add(graphic);
        } else {
          crabLinesLayer.add(graphic);
        }

        current = iterator.next();
      }
    });
  });

  paneDiv.appendChild(crabUI);
}
