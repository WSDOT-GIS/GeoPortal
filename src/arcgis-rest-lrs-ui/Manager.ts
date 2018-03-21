import { IG2MOutput } from "@wsdot/arcgis-rest-lrs";
import ContentPane = require("dijit/layout/ContentPane");
import GraphicsLayer = require("esri/layers/GraphicsLayer");
import EsriMap = require("esri/map");
import { GeometryToMeasureForm } from "./GeometryToMeasureForm";
import { IterateG2MOutputToFeatures, m2gOutputToFeatures } from "./utils";

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
  window.addEventListener("mapload", e => {
    const map = (e as any).detail as EsriMap;
    const crabPointLayers = new GraphicsLayer({
      id: "CRAB Points"
    });

    map.addLayer(crabPointLayers);

    const g2mForm = new GeometryToMeasureForm(map);
    crabUI.appendChild(g2mForm.form);

    // TODO: add graphic instead of writing to console.
    g2mForm.form.addEventListener("geometryToMeasure", g2mEvt => {
      const result = (g2mEvt as CustomEvent<IG2MOutput>).detail;
      // console.log("geometryToMeasure complete", result);
      const features = IterateG2MOutputToFeatures(result);

      // console.log("geometry to measure", [g2mEvt.detail, features]);
      // features.forEach(f => crabPointLayer.add(f));
      let f = features.next();
      while (f) {
        if (f.done) {
          break;
        }
        crabPointLayers.add(f.value);
        f = features.next();
      }
    });

    g2mForm.form.addEventListener("geometryToMeasureError", errorEvt => {
      const error = (errorEvt as CustomEvent).detail;
      // tslint:disable-next-line:no-console
      console.error("geometry to measure error", error);
      alert("Geometry to measure error. See console for details.");
    });
  });

  paneDiv.appendChild(crabUI);
}
