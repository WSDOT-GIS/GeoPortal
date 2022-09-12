import {
  IG2MInputLocation,
  IM2GLineLocation,
  IM2GPointLocation,
  LrsClient,
} from "@wsdot/arcgis-rest-lrs";
import EsriMap = require("esri/map");
import { createCountyOptions } from "./CountyLookup";
import { crabRouteIdRe } from "./crabUtils";
import {
  addNamedControlsToElement,
  generateId,
  getLrsServerEndpointUrl,
} from "./utils";

/**
 * Encapsulates the form used for measureToGeometry operation.
 */
export class MeasureToGeometryControl {
  public readonly form: HTMLFormElement;
  public readonly routeIdInput: HTMLInputElement;
  public readonly fromMeasureInput: HTMLInputElement;
  public readonly toMeasureInput: HTMLInputElement;
  public readonly temporalViewDateInput: HTMLInputElement;

  public get temporalViewDate() {
    return this.temporalViewDateInput.value
      ? new Date(this.temporalViewDateInput.value)
      : undefined;
  }

  /**
   * Gets the locations from the user's input.
   */
  public get locations(): Array<IM2GPointLocation | IM2GLineLocation> {
    const routeId = this.routeIdInput.value;
    const fromMeasure = parseFloat(this.fromMeasureInput.value);
    const toMeasure = this.toMeasureInput.value
      ? parseFloat(this.toMeasureInput.value)
      : null;

    const directions = ["i", "d"];

    return directions.map((d) => {
      if (toMeasure === null) {
        return { routeId: routeId + d, measure: fromMeasure };
      } else {
        return { routeId: routeId + d, fromMeasure, toMeasure };
      }
    });
  }

  /**
   *
   * @param mapServiceUrl measureToGeometry endpoint
   * @param layerId Layer ID
   * @example https://data.example.com/arcgis/rest/services/CountyRoutes/CRAB_Routes/MapServer/"
   * @throws Error is thrown if operationUrl is invalidly formatted.
   */
  constructor(public mapServiceUrl: string, public layerId: number) {
    this.form = document.createElement("form");
    this.form.classList.add("measure-to-geometry-form");
    this.form.action = getLrsServerEndpointUrl(
      mapServiceUrl,
      layerId,
      "measureToGeometry"
    );

    const roadNoRe = /^\d{1,5}$/;

    function updateRouteIdInput() {
      const stateNo = 53000;
      const countyNo = parseInt(countySelect.value, 10);
      const match = roadNoInput.value.match(roadNoRe);
      if (!match) {
        routeIdInput.value = "";
        return;
      }

      const roadNo = parseInt(match[0], 10);

      const routeId = `${(stateNo + countyNo) * 100000 + roadNo}`;

      routeIdInput.value = routeId;
    }

    const frag = document.createDocumentFragment();

    const countySelect = document.createElement("select");
    countySelect.appendChild(createCountyOptions());
    countySelect.required = true;
    countySelect.title = "Select a county";
    countySelect.id = generateId("countySelect");

    const roadNoInput = document.createElement("input");
    roadNoInput.id = generateId("roadNumber");
    roadNoInput.required = true;
    roadNoInput.pattern = roadNoRe.source;
    roadNoInput.title = "Enter a one- to five-digit road number";

    [countySelect, roadNoInput].forEach((element) => {
      element.addEventListener("change", updateRouteIdInput);
    });

    const routeIdInput = document.createElement("input");
    routeIdInput.id = generateId("m2gRouteIdInput");
    routeIdInput.name = "routeId";
    routeIdInput.type = "hidden";
    routeIdInput.required = true;
    routeIdInput.pattern = crabRouteIdRe.source;
    frag.appendChild(routeIdInput);

    const fromMeasureInput = document.createElement("input");
    fromMeasureInput.id = generateId("m2gFromMeasureInput");
    fromMeasureInput.name = "measure";
    fromMeasureInput.title = "begin measure in miles";
    fromMeasureInput.required = true;

    const toMeasureInput = document.createElement("input");
    toMeasureInput.id = generateId("m2gToMeasureField");
    toMeasureInput.name = "toMeasure";
    toMeasureInput.title = "end measure in miles";
    toMeasureInput.placeholder = "Please omit if not locating a line segment.";
    toMeasureInput.required = false;

    // Set numeric input restrictions.
    for (const element of [fromMeasureInput, toMeasureInput]) {
      element.type = "number";
      element.step = "0.001";
    }

    const temporalViewDateInput = document.createElement("input");
    temporalViewDateInput.type = "date";
    temporalViewDateInput.id = generateId("m2gTemporalViewDate");
    temporalViewDateInput.name = "temporalViewDate";

    addNamedControlsToElement(frag, {
      County: countySelect,
      "Road No.": roadNoInput,
      "From Milepost": fromMeasureInput,
      "To Milepost": toMeasureInput,
      "Temporal View Date": temporalViewDateInput,
    });

    this.routeIdInput = routeIdInput;
    this.fromMeasureInput = fromMeasureInput;
    this.toMeasureInput = toMeasureInput;
    this.temporalViewDateInput = temporalViewDateInput;

    const submitButton = document.createElement("button");
    submitButton.type = "submit";
    submitButton.textContent = "Submit";

    frag.appendChild(submitButton);

    const resetButton = document.createElement("button");
    resetButton.type = "reset";
    resetButton.textContent = "Reset";

    frag.appendChild(resetButton);

    this.form.appendChild(frag);

    // Setup form submit event.

    this.form.addEventListener("submit", (ev) => {
      const form = ev.target as HTMLFormElement;
      const client = new LrsClient(this.form.action);
      const viewDate = this.temporalViewDateInput.value
        ? this.temporalViewDateInput.valueAsDate || undefined
        : undefined;
      const promise = client.measureToGeometry(
        this.layerId,
        this.locations,
        viewDate,
        3857
      );
      const customEvt = new CustomEvent("m2gsubmit", {
        detail: promise,
      });
      form.dispatchEvent(customEvt);

      ev.preventDefault();
    });
  }
}
