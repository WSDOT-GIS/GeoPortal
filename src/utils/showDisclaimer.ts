// tslint:disable:only-arrow-functions max-line-length no-console

/**
 * Shows the disclaimer dialog if the configuration contains a disclaimer.  If the dialog is shown, a jQuery object containing the dialog is returned.
 * @param {Boolean} showEvenIfAlreadyAgreed - Set this to true if you want to force the disclaimer to be shown even if there is a cookie indicating the user has already agreed.
 * @returns {Object}
 */
export default function showDisclaimer(
  disclaimerUrl: string,
  showEvenIfAlreadyAgreed?: boolean
) {
  // Get the configuration name from the query string.
  const re = /\bconfig=([^&]+)/i;
  let configName = "";
  if (location.search) {
    const match = location.search.match(re);
    if (match) {
      configName = match[1];
    }
  }
  if (!configName) {
    configName = "";
  }

  const settingName = "GeoportalAgreedToDisclaimer" + configName;

  const previousDisclaimerText = window.localStorage.getItem(settingName);

  // Show the disclaimer if there is no cookie indicating that the user has seen it before.
  if (
    disclaimerUrl !== undefined &&
    (showEvenIfAlreadyAgreed || disclaimerUrl !== null)
  ) {
    (async () => {
      const disclaimerHtml = await fetch(disclaimerUrl).then((response) =>
        response.text()
      );

      if (disclaimerHtml && disclaimerHtml !== previousDisclaimerText) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(disclaimerHtml, "text/html");
        const titleElement = doc.querySelector("head > title");
        const title = titleElement?.textContent ?? "Disclaimer";
        const body = doc.querySelector("body")?.innerHTML;

        const innerHtml = `
              <h1>${title}</h1>
              ${body}
                <form method="dialog">
                    <input type="checkbox" id="doNotShowAgain" /><label for="doNotShowAgain">Do not show again</label>
                    <button autofocus>OK</button>
                </form>`;

        const dialog = document.createElement("dialog");
        dialog.innerHTML = innerHtml;

        document.body.appendChild(dialog);

        dialog.showModal();
      }
    })();

    // Load the content into a div.  Only when the source page has loaded do invoke the dialog constructor.
    // This is to ensure that the dialog is centered on the page.
  }
}
