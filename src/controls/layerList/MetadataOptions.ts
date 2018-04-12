/**
 * Options for the MetadataOptions class constructor.
 */
export interface IMetadataOptionsParameters {
  /**
   * Specifies that the metadata list provided by the Layer
   * Metadata SOE is to be ignored. Only the "additionalMetadata" links will be used.
   */
  ignoreSoe?: boolean;
  /** A dictionary of metadata URLs. */
  additionalMetadata?: { [name: string]: string };
}

export default class MetadataOptions {
  public ignoreSoe: boolean;
  public additionalMetadata: { [name: string]: string };
  /**
   *
   * @param {Object} jsonObject - An object.
   * @param {boolean} jsonObject.ignoreSoe - Specifies that the metadata list provided by the Layer
   * Metadata SOE is to be ignored. Only the "additionalMetadata" links will be used.
   * @param {Object.<string, string>} jsonObject.additionalMetadata - A dictionary of metadata URLs.
   */
  constructor(jsonObject: IMetadataOptionsParameters) {
    this.ignoreSoe = Boolean(jsonObject.ignoreSoe);
    this.additionalMetadata = jsonObject.additionalMetadata || {};
  }
  /**
   * Creates a list of links.
   * @returns {HTMLUListElement} - An HTML unordered list containing links.
   */
  public createListOfLinks(): HTMLUListElement {
    const ul = document.createElement("ul");
    for (const name in this.additionalMetadata) {
      if (this.additionalMetadata.hasOwnProperty(name)) {
        const li = document.createElement("li");
        const a = document.createElement("a");
        li.appendChild(a);
        a.textContent = name;
        a.href = this.additionalMetadata[name];
        a.target = "_blank";
        ul.appendChild(li);
      }
    }
    return ul;
  }
}
