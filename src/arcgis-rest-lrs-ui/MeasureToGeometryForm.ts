import LrsClient, {
  IG2MInputLocation,
  IM2GLineLocation,
  IM2GPointLocation
} from "@wsdot/arcgis-rest-lrs";
import EsriMap = require("esri/map");
import { addNamedControlsToElement, generateId } from "./utils";

/**
 * Encapsulates the form used for measureToGeometry operation.
 */
export class MeasureToGeometryForm {
  public readonly form = document.createElement("form");
  public readonly routeIdInput: HTMLInputElement;
  public readonly fromMeasureInput: HTMLInputElement;
  public readonly toMeasureInput: HTMLInputElement;
  public readonly temporalViewDateInput: HTMLInputElement;

  public get locations(): Array<IM2GPointLocation | IM2GLineLocation> {
    const routeId = this.routeIdInput.value;
    const fromMeasure = this.fromMeasureInput.valueAsNumber;
    const toMeasure = this.toMeasureInput.value
      ? this.toMeasureInput.valueAsNumber
      : null;
    if (toMeasure === null) {
      return [{ routeId, measure: fromMeasure }];
    } else {
      return [{ routeId, fromMeasure, toMeasure }];
    }
  }

  constructor(public readonly url: string, public readonly layerId: number) {
    const frag = document.createDocumentFragment();

    this.form.action = url;

    const routeIdInput = document.createElement("input");
    routeIdInput.id = generateId("m2gRouteIdInput");
    routeIdInput.name = "routeId";
    routeIdInput.required = true;

    const fromMeasureInput = document.createElement("input");
    fromMeasureInput.id = generateId("m2gFromMeasureInput");
    fromMeasureInput.name = "measure";
    fromMeasureInput.required = true;

    const toMeasureInput = document.createElement("input");
    toMeasureInput.id = generateId("m2gToMeasureField");
    toMeasureInput.name = "toMeasure";
    toMeasureInput.required = false;

    // Set numeric input restrictions.
    for (const element of [fromMeasureInput, toMeasureInput]) {
      element.type = "number";
      element.step = "0.001";
    }

    const temporalViewDateInput = document.createElement("input");
    temporalViewDateInput.type = "date";
    temporalViewDateInput.id = generateId("m2gTemporalViewDate");

    addNamedControlsToElement(frag, {
      "Route ID": routeIdInput,
      "From Measure": fromMeasureInput,
      "To Measure": toMeasureInput,
      "Temporal View Date": temporalViewDateInput
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

    this.form.addEventListener("submit", async ev => {
      const client = new LrsClient(this.form.action);
      const viewDate = this.temporalViewDateInput.value
        ? this.temporalViewDateInput.valueAsDate
        : undefined;
      try {
        const m2gOutput = await client.measureToGeometry(
          this.layerId,
          this.locations,
          viewDate,
          3857
        );
      } catch (err) {
        const errorEvent = new CustomEvent("measureToGeometryError", {
          detail: err
        });
        this.form.dispatchEvent(errorEvent);
      }

      ev.stopImmediatePropagation();
    });
  }
}
