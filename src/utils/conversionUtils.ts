import FormatError from "./FormatError";

/**
 * An object with no values that should be turned into tables.
 */
interface IAttributes {
  [key: string]: string | number | Date | boolean | null;
}

/**
 * Gets a Set of all of property names of the objects in an array.
 * (Set type is used as output so each property name only appears
 * once in the set.)
 * @param array An array of objects
 * @returns {Set.<string>}
 */
export function getProperties(array: IAttributes[]): Set<string> {
  const output = new Set<string>();
  for (const name in array) {
    if (array.hasOwnProperty(name)) {
      output.add(name);
    }
  }
  return output;
}

export function toTable(array: IAttributes[]) {
  const propertyNames = getProperties(array);
  const table = document.createElement("table");
  const thead = table.createTHead();
  const tbody = table.createTBody();
  let row = thead.insertRow(-1);

  for (const name of propertyNames) {
    const th = document.createElement("th");
    th.textContent = name;
    row.appendChild(th);
  }

  for (const item of array) {
    row = tbody.insertRow(-1);
    for (const name of propertyNames) {
      const cell = row.insertCell(-1);
      const value = item[name];
      if (value != null) {
        cell.textContent = value.toString();
      }
    }
  }

  return table;
}

/**
 * Converts a JavaScript object or value into an HTML table.
 * @param o any value or object.
 */
export function toElement(o: any) {
  if (typeof o !== "object") {
    const text = document.createTextNode(`${o}`);
    return text;
  } else if (o instanceof Date) {
    const timeElement = document.createElement("time");
    timeElement.dateTime = o.toISOString();
    timeElement.textContent = o.toString();
    return timeElement;
  }

  const table = document.createElement("table");
  for (const propName in o) {
    if (o.hasOwnProperty(propName)) {
      const value = o[propName];
      const row = table.insertRow(-1);
      const th = document.createElement("th");
      th.textContent = propName;
      row.appendChild(th);
      const td = row.insertCell(-1);
      const cellContent = toElement(value);
      if (cellContent) {
        td.appendChild(cellContent);
      }
    }
  }
  return table;
}

export function convertToHtml(dataUrl: string) {
  const { mediaType, base64, data } = parseDataUrl(dataUrl);

  if (mediaType) {
    if (mediaType === "application/json") {
      const o = JSON.parse(data);
      const table = toElement(o);
      return table;
    }
  }

  const pre = document.createElement("pre");
  pre.textContent = data;
  return pre;
}

/**
 * Represents the components that make up a data URL.
 */
export interface IDataUrlParts {
  /** The media type, aka MIME type. */
  mediaType?: string;
  /** Indicates if the data in the URL was base64 encoded. */
  base64: boolean;
  /** The unencoded data */
  data: string;
}

/**
 * Parses a data URL into a string.
 * @param {string} dataUrl A data URL
 * @throws {FormatError} Thrown if dataUrl is not a correctly formatted data URL.
 */
export function parseDataUrl(dataUrl: string): IDataUrlParts {
  // data:[<mediatype>][;base64],<data>
  const re = /^data:([^;]+)?(?:;([^,]+))?,(.+)$/;
  const match = dataUrl.match(re);
  if (match) {
    const [mediaType, base64, data] = match.slice(1);
    let text: string;
    if (base64) {
      text = btoa(data);
    } else {
      text = decodeURIComponent(data);
    }
    return {
      mediaType,
      base64: Boolean(base64),
      data: text,
    };
  } else {
    // const text = dataUrl;
    // return { mediaType: null, base64: null, text };
    throw new FormatError(dataUrl, re);
  }
}
