import LrsClient from "@wsdot/arcgis-rest-lrs";
// import { SnappingManagerOptions } from "esri";
import Point = require("esri/geometry/Point");
import EsriMap = require("esri/map");
// import SnappingManager = require("esri/SnappingManager");
import Draw = require("esri/toolbars/draw");

const defaultLrsSvcUrl =
  "https://data.wsdot.wa.gov/arcgis/rest/services/CountyRoutes/CRAB_Routes/MapServer/exts/LRSServer";
const defaultLayerId = 0;

/**
 * Creates a unique ID by appending numbers to the proposed ID until
 * an ID that is not already in use is found.
 * @param id Proposed ID
 */
function generateId(id: string) {
  let outId = id;
  let i = 0;
  while (document.getElementById(outId)) {
    outId = `${id}${i}`;
    i++;
  }
  return outId;
}

/**
 * Splits a camel- or Pascal-cased name into separate words.
 * @param name camel- or Pascal-cased name
 */
function splitName(name?: string | null) {
  if (!name) {
    return null;
  }
  const re = /[A-Z]?[a-z]+/g;
  let match = re.exec(name);
  const parts = new Array<string>();
  while (match) {
    const part = match[0].toLowerCase();
    parts.push(part);
    match = re.exec(name);
  }

  return parts.join(" ");
}

function addToFormWithLabel(
  form: HTMLElement,
  control: HTMLInputElement,
  labelText?: string
) {
  const label = document.createElement("label");
  label.htmlFor = control.id;
  label.textContent = labelText || splitName(control.name);
  form.appendChild(label);
  form.appendChild(control);
  return label;
}

function createForm(
  url: string = defaultLrsSvcUrl,
  layerId: number = defaultLayerId
) {
  const form = document.createElement("form");
  form.id = generateId("geometryToMeasureForm");
  form.action = `${url}/networkLayers/${layerId}/geometryToMeasure`;

  const toleranceControl = document.createElement("input");
  toleranceControl.type = "number";
  toleranceControl.min = "0";
  toleranceControl.name = "tolerance";
  toleranceControl.id = generateId("toleranceInput");

  addToFormWithLabel(form, toleranceControl);

  const dateControl = document.createElement("input");
  dateControl.type = "date";
  dateControl.name = "temporalViewDate";
  dateControl.id = generateId("temporalViewDateInput");

  addToFormWithLabel(form, dateControl);

  const submitButton = document.createElement("button");
  submitButton.type = "submit";
  submitButton.textContent = "Locate";
  form.appendChild(submitButton);

  return form;
}

export default class GeometryToMeasureForm {
  public readonly form: HTMLFormElement;
  public readonly draw: Draw;
  public readonly lrsClient: LrsClient;

  public get tolerance(): number | undefined {
    const input = this.form.elements.namedItem(
      "tolerance"
    ) as HTMLInputElement | null;
    if (!(input && input.value)) {
      return;
    }
    return input.valueAsNumber;
  }

  public get temporalViewDate(): Date | undefined {
    const input = this.form.elements.namedItem(
      "temporalViewDate"
    ) as HTMLInputElement | null;
    if (!(input && input.value)) {
      return;
    }
    return input.valueAsDate;
  }

  /**
   * Creates a new instance of this class.
   * @param map Map object
   * @param url LRS map service URL
   * @param layerId layer ID
   */
  constructor(
    public readonly map: EsriMap,
    public readonly url: string = defaultLrsSvcUrl,
    public readonly layerId: number = defaultLayerId
  ) {
    if (!map || !(map instanceof EsriMap)) {
      throw TypeError(`Invalid map: ${map}`);
    }
    this.form = createForm(url, layerId);
    this.draw = new Draw(this.map);
    this.lrsClient = new LrsClient(url);

    const self = this;

    // Setup the form's submit event.
    this.form.addEventListener("submit", e => {
      try {
        self.draw.activate(Draw.POINT);
      } catch (error) {
        alert("Error: Could not activate the draw toolbar.");
        // tslint:disable-next-line:no-console
        console.error("Error activating the draw toolbar", error);
      }
      e.preventDefault();
    });

    this.draw.on("draw-complete", async e => {
      self.draw.deactivate();
      // Exit if there is no geometry or if the drawn geometry is not a point.
      if (!(e.geometry && e.geometry.type.match(/point/gi))) {
        return;
      }
      const point = e.geometry as Point;

      const wkid = e.geometry.spatialReference.wkid;

      // Call the API.
      // Dispatch an event, differing depending on success or failure
      try {
        const result = await this.lrsClient.geometryToMeasure(
          self.layerId,
          [[point.x, point.y]],
          self.tolerance,
          self.temporalViewDate,
          wkid,
          wkid
        );
        const g2mEvent = new CustomEvent("geometryToMeasure", {
          detail: result
        });
        self.form.dispatchEvent(g2mEvent);
      } catch (ex) {
        const errorEvent = new CustomEvent("geometryToMeasureError", {
          detail: ex
        });
        self.form.dispatchEvent(errorEvent);
      }
    });
  }
}
