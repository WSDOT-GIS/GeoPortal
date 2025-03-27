// tslint:disable:only-arrow-functions max-line-length no-console

/**
 * Shows the disclaimer dialog if the configuration contains a disclaimer.  If the dialog is shown, a jQuery object containing the dialog is returned.
 * @param showEvenIfAlreadyAgreed - Set this to true if you want to force the disclaimer to be shown even if there is a cookie indicating the user has already agreed.
 */
export default async function showDisclaimer(
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
    const disclaimerHtml = await fetch(disclaimerUrl).then((response) =>
      response.text()
    );

    if (disclaimerHtml && disclaimerHtml !== previousDisclaimerText) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(disclaimerHtml, "text/html");
      const titleElement = doc.querySelector("head > title");
      const title = titleElement?.textContent ?? "Disclaimer";
      const body = doc.querySelector("body")?.cloneNode(true)?.childNodes;

      const dialog = document.createElement("dialog");
      dialog.classList.add("disclaimer-dialog");

      const h1 = document.createElement("h1");
      h1.textContent = title;
      dialog.appendChild(h1);

      if (body) {
        dialog.append(...body);
      }

      const form = document.createElement("form");
      form.method = "dialog";

      if (!showEvenIfAlreadyAgreed) {
        const doNotShowAgain = document.createElement("input");
        doNotShowAgain.type = "checkbox";
        doNotShowAgain.id = "doNotShowAgain";
        const label = document.createElement("label");
        label.htmlFor = "doNotShowAgain";
        label.textContent = "Do not show again";
        form.appendChild(doNotShowAgain);
        form.appendChild(label);
      }

      const okButton = document.createElement("button");
      okButton.type = "submit";
      okButton.textContent = "OK";
      okButton.autofocus = true;
      form.appendChild(okButton);
      dialog.appendChild(form);

      document.body.appendChild(dialog);
      dialog.showModal();
    }

    // Load the content into a div.  Only when the source page has loaded do invoke the dialog constructor.
    // This is to ensure that the dialog is centered on the page.
  }
}
