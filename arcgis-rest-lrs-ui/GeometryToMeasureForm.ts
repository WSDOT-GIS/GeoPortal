import LrsClient from "@wsdot/arcgis-rest-lrs";
// import { SnappingManagerOptions } from "esri";
import Point = require("esri/geometry/Point");
import EsriMap = require("esri/map");
// import SnappingManager = require("esri/SnappingManager");
import Draw = require("esri/toolbars/draw");

const defaultLrsSvcUrl =
  "https://data.wsdot.wa.gov/arcgis/rest/services/CountyRoutes/CRAB_Routes/MapServer";
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
  form.action = `${url}/exts/LRSServer/networkLayers/${layerId}/geometryToMeasure`;

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
    this.form = createForm(url, layerId);
    this.draw = new Draw(this.map);
    this.lrsClient = new LrsClient(url);

    // Setup the form's submit event.
    this.form.addEventListener("submit", e => {
      this.draw.activate(Draw.POINT);
      e.preventDefault();
    });

    this.draw.on("draw-complete", async e => {
      this.draw.deactivate();
      if (!(e.geometry && e.geometry.type.match(/point/gi))) {
        return;
      }
      const point = e.geometry as Point;

      const wkid = e.geometry.spatialReference.wkid;

      const result = await this.lrsClient.geometryToMeasure(
        this.layerId,
        [[point.x, point.y]],
        this.tolerance,
        this.temporalViewDate,
        wkid,
        wkid
      );

      console.debug("geometryToMeasure result", result);
    });
  }
}
