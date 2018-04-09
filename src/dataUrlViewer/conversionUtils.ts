import FormatError from "./FormatError";

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
      data: text
    };
  } else {
    // const text = dataUrl;
    // return { mediaType: null, base64: null, text };
    throw new FormatError(dataUrl, re);
  }
}
