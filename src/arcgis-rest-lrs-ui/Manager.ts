/**
 * The code in this module is responsible for setting up git DOM elements to host the
 * CRAB tools and attached event handlers.
 */

import { IG2MOutput, IM2GOutput } from "@wsdot/arcgis-rest-lrs";
import ContentPane = require("dijit/layout/ContentPane");
import Popup = require("esri/dijit/Popup");
import geometryEngineAsync = require("esri/geometry/geometryEngineAsync");
import Point = require("esri/geometry/Point");
import Polyline = require("esri/geometry/Polyline");
import Graphic = require("esri/graphic");
import ArcGISDynamicMapServiceLayer = require("esri/layers/ArcGISDynamicMapServiceLayer");
import EsriMap = require("esri/map");

import { GeometryToMeasureControl } from "./GeometryToMeasureControl";
import { crabLinesLayer, crabPointsLayer } from "./layers";
import { MeasureToGeometryControl } from "./MeasureToGeometryControl";
import {
  defaultLayerId,
  defaultLrsMapServiceUrl,
  IterateG2MOutputToFeatures,
  m2gOutputToFeatures
} from "./utils";

/**
 * Creates the CRAB tools and adds them to the dojo Accordion control.
 * @param toolsAccordion The dojo Accordion control where the CRAB pane will be added
 * @param serviceUrl CRAB routes map service URL
 * @param layerId Layer ID integer for the CRAB routes layer in the map service.
 */
export function setupCrab(
  toolsAccordion: any,
  serviceUrl: string = defaultLrsMapServiceUrl,
  layerId: number = defaultLayerId
) {
  // Create layout elements
  const toolsAccordianDiv = document.getElementById("toolsAccordion");
  if (!toolsAccordianDiv) {
    throw Error("#toolsAccordion element not found.");
  }
  const paneDiv = document.createElement("div");
  paneDiv.id = "crabPane";
  toolsAccordianDiv.appendChild(paneDiv);
  const contentPane = new ContentPane(
    { title: "CRMP", id: "crabPane" },
    paneDiv
  );
  toolsAccordion.addChild(contentPane);
  const crabUI = document.createElement("div");

  crabUI.id = "crabUI";

  // When the map loads, add event handling code for the form.
  // "mapload" is a custom event on the window setup in main.js.
  window.addEventListener("mapload", e => {
    // Get the map object from the event.
    const map = (e as any).detail as EsriMap;

    // Add FeatureLayers to the map for located graphics to be added to.
    map.addLayers([crabPointsLayer, crabLinesLayer]);

    const crabToolLabelClass = "crab-tool-label";

    const g2mLabel = document.createElement("div");
    g2mLabel.textContent = "Locate a point on a County Road";
    g2mLabel.classList.add(crabToolLabelClass);
    crabUI.appendChild(g2mLabel);

    const descriptionP = document.createElement("p");

    // Setup Geometry to Measure form.
    const g2mForm = new GeometryToMeasureControl(map);
    g2mForm.tolerance = 50;

    descriptionP.innerHTML = `Select <b>${
      g2mForm.form.querySelector("button[type=submit]")!.textContent
    } </b> then click on a country road`;
    crabUI.appendChild(descriptionP);
    crabUI.appendChild(g2mForm.form);

    g2mForm.form.addEventListener("geometryToMeasure", g2mEvt => {
      const result = (g2mEvt as CustomEvent<IG2MOutput>).detail;
      const features = Array.from(IterateG2MOutputToFeatures(result));

      // Stop drawing layer while features are added.
      crabPointsLayer.suspend();

      // Add features.
      try {
        for (const f of features) {
          crabPointsLayer.add(f);
        }
      } finally {
        // Resume layer drawing after adding features.
        crabPointsLayer.resume();
      }

      // Show the located point feature in the map's popup.
      // If nothing was found, show an alert with location statuses.
      if (features.length) {
        const popup = map.infoWindow as Popup;
        popup.setFeatures(features);
        const firstFeature = features[0];
        const firstPoint = firstFeature.geometry as Point;
        popup.show(firstPoint!);
      } else {
        const statuses = result.locations.map(l => l.status);
        const msg = `No locations found: ${statuses.join(", ")}`;
        alert(msg);
      }
    });

    // Handle custom error event from the GeometryToMeasure HTMLFormElement.
    g2mForm.form.addEventListener("geometryToMeasureError", errorEvt => {
      const error = (errorEvt as CustomEvent).detail;
      // tslint:disable-next-line:no-console
      console.error("geometry to measure error", error);
      alert("Geometry to measure error. See console for details.");
    });

    const m2gLabel = document.createElement("div");
    m2gLabel.classList.add(crabToolLabelClass);
    m2gLabel.textContent = "Locate a County Road and Milepost";
    crabUI.appendChild(m2gLabel);

    // Add Measure to Geometry form.
    const m2gForm = new MeasureToGeometryControl(serviceUrl, layerId);

    crabUI.appendChild(m2gForm.form);

    // Add clear graphics button
    const clearGraphicsDiv = document.createElement("div");
    clearGraphicsDiv.id = "crabClearControls";
    const clearGraphicsButton = document.createElement("button");
    clearGraphicsButton.classList.add("clear-crab-button");
    clearGraphicsDiv.appendChild(clearGraphicsButton);
    clearGraphicsButton.textContent =
      "Remove graphics created by CRMP tools from the map";
    clearGraphicsButton.onclick = () => {
      crabLinesLayer.clear();
      crabPointsLayer.clear();
    };
    crabUI.appendChild(clearGraphicsDiv);

    // Handle the custom event for when the user submits parameters for
    // measureToGeometry operation. This event is defined in
    // MeasureToGeometryControl.ts
    m2gForm.form.addEventListener("m2gsubmit", async evt => {
      // Event detail is a Promise that will return the measureToGeometry results.
      const promise = (evt as CustomEvent<Promise<IM2GOutput>>).detail;
      const popup = map.infoWindow as Popup;

      // Await the measureToGeometry results.
      let output: IM2GOutput;
      try {
        output = await promise;
      } catch (err) {
        // tslint:disable-next-line:no-console
        console.error("measureToGeometry", err);
        return;
      }

      // Create arrays for the different types of graphics.
      const nullGeoGraphics = new Array<Graphic>(); // Unlocatable results go here
      const pointGraphics = new Array<Graphic>();
      const polylineGraphics = new Array<Graphic>();

      // Put the graphics into appropriate arrays.
      let graphic: Graphic | null = null;
      for (graphic of m2gOutputToFeatures(output)) {
        if (!graphic.geometry) {
          nullGeoGraphics.push(graphic);
        } else if (/Point$/i.test(graphic.geometry.type)) {
          pointGraphics.push(graphic);
        } else {
          polylineGraphics.push(graphic);
        }
      }

      // Add points and lines to corresponding layers.
      // Suspend the layers while adding features, then resume
      // when finished.
      [crabPointsLayer, crabLinesLayer].forEach(l => l.suspend());

      if (pointGraphics.length) {
        pointGraphics.forEach(g => crabPointsLayer.add(g));
      }
      if (polylineGraphics.length) {
        polylineGraphics.forEach(g => crabLinesLayer.add(g));
      }

      [crabPointsLayer, crabLinesLayer].forEach(l => l.resume());

      // Get the first graphic of point, or if no points, polyline.
      // Value will be null if no graphics were added this time.
      const firstGraphic = pointGraphics.length
        ? pointGraphics[0]
        : polylineGraphics.length
          ? polylineGraphics[0]
          : null;

      if (firstGraphic) {
        // Change the map view so the first graphic is visible.
        if (firstGraphic.geometry instanceof Point) {
          map.centerAt(firstGraphic.geometry);
        } else if (firstGraphic.geometry instanceof Polyline) {
          map.setExtent(firstGraphic.geometry.getExtent());
        }

        // Get the point where the popup will be opened.
        const popupPoint =
          firstGraphic.geometry instanceof Point
            ? firstGraphic.geometry
            : firstGraphic.geometry instanceof Polyline
              ? firstGraphic.geometry.getPoint(0, 0)
              : null;

        // Open the popup at the first graphic.
        if (popupPoint) {
          popup.show(popupPoint);
        }

        // Set the popup's features to update its content.
        popup.setFeatures(pointGraphics.concat(polylineGraphics));
        // The rest of the function is for showing a message
        // if no results are found. Since we know there were graphics,
        // There is no need to proceed any further.
        return;
      }

      // Show a message to the user if no results were found.
      if (nullGeoGraphics && nullGeoGraphics.length) {
        const message = nullGeoGraphics
          .map(g => {
            const { routeId, status } = g.attributes;
            return `${routeId}: ${status}`;
          })
          .join("\n");
        alert(message);
      }
    });
  });

  // Add the CRAB UI to the accordion content pane.
  paneDiv.appendChild(crabUI);
}
