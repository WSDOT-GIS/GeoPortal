import { IFeature, IFeatureSet } from "@esri/arcgis-rest-common-types";
import {
  createFeatureSelect,
  IFeatureSelect
} from "@wsdot/arcgis-feature-select";
import Popup from "esri/dijit/Popup";
import Extent from "esri/geometry/Extent";
import Multipoint from "esri/geometry/Multipoint";
import Point from "esri/geometry/Point";
import Polygon from "esri/geometry/Polygon";
import Polyline from "esri/geometry/Polyline";
import Graphic from "esri/graphic";
import InfoTemplate from "esri/InfoTemplate";
import EsriMap from "esri/map";

/**
 * Creates a select control and associated label.
 * @param queryTask Defines a feature layer query
 * @returns Returns an array of three objects: DocumentFragment containing the label and select,
 * the label, and the select.
 */
function createLabelAndControl(
  queryTask: any
): [DocumentFragment, HTMLLabelElement, HTMLSelectElement] {
  const label = document.createElement("label");
  label.textContent = queryTask.label;

  const select = document.createElement("select");

  const docFrag = document.createDocumentFragment();
  docFrag.appendChild(label);
  docFrag.appendChild(select);

  return [docFrag, label, select];
}

/**
 * Creates a Query URL for a given feature layer using given parameters.
 * @param url Feature layer URL
 * @param query Query parameters
 */
function createURL(url: string, query: any) {
  const output = new URL(`${url}/query?f=json`);
  for (const key in query) {
    if (query.hasOwnProperty(key)) {
      const value = query[key];
      output.searchParams.append(key, value);
    }
  }
  return output;
}

/**
 * Creates feature zoom select elements.
 * @param map An esri/map
 * @param config geoportal config
 * @param container DOM node that will have selects added to it.
 */
export async function setupFeatureSelects(
  map: EsriMap,
  config: any,
  container: HTMLElement
) {
  if (!map) {
    throw TypeError("map cannot be null or undefined");
  }
  // exit if there is no config or if it has no query tasks
  if (!(config && config.queryTasks)) {
    return;
  }

  const { queryTasks } = config;
  const promises = new Array<Promise<IFeatureSet>>();

  const zoomTemplate = new InfoTemplate("Zoom", (g: Graphic) => {
    let output: any;
    for (const name in g.attributes) {
      if (g.attributes.hasOwnProperty(name)) {
        const value = g.attributes[name];
        output = value;
        break;
      }
    }
    return output;
  });

  function zoomToFeatures(this: IFeatureSelect, ev: CustomEvent<IFeature[]>) {
    if (!ev.detail || !ev.detail.filter(f => !!f.geometry).length) {
      return;
    }
    const features = ev.detail;
    const graphics = features.map(f => {
      const g = new Graphic(f);
      g.setInfoTemplate(zoomTemplate);
      g.geometry.setSpatialReference(map.spatialReference);
      return g;
    });
    const graphic = graphics[0];
    const { geometry } = graphic;

    const popup = map.infoWindow as Popup;
    popup.setFeatures(graphics);

    // Zoom operation will differ depending on geometry type.
    if (geometry instanceof Point) {
      map.centerAndZoom(geometry, 14);
      popup.show(geometry);
    } else if (geometry instanceof Extent) {
      map.setExtent(geometry, true);
      popup.show(geometry.getCenter());
    } else {
      const castGeometry = geometry as Polyline | Polygon | Multipoint;
      map.setExtent(castGeometry.getExtent(), true);
      if (castGeometry instanceof Polygon) {
        popup.show(castGeometry.getCentroid());
      } else {
        castGeometry.getExtent().getCenter();
      }
    }
    this.selectedIndex = 0;
    ev.stopPropagation();
  }

  // Loop through all of the query tasks.
  for (const id in queryTasks) {
    if (queryTasks.hasOwnProperty(id)) {
      const queryTask = queryTasks[id];
      const { label, url, query } = queryTask;
      if (query.outFields) {
        query.orderByFields = query.outFields;
      }
      const fullUrl = createURL(url, query);

      const [frag, labelElement, selectElement] = createLabelAndControl(
        queryTask
      );
      container.appendChild(frag);

      // Query the feature layer for its features.
      const promise = fetch(fullUrl.toString())
        .then(response => response.json() as Promise<IFeatureSet>)
        .then(featureSet => {
          const featureSelect = createFeatureSelect(selectElement, featureSet);
          featureSelect.addEventListener("featureselect", zoomToFeatures);
          featureSelect.disabled = false;
          return featureSet;
        });

      promises.push(promise);
    }
  }

  return await Promise.all(promises);
}
