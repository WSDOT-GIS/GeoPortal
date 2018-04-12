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
  let configName: string = "";
  if (location.search) {
    const match = location.search.match(re);
    if (match) {
      configName = match[1];
    }
  }
  if (!configName) {
    configName = "";
  }

  const settingName = "GeoportalAggreedToDisclaimer" + configName;

  const previousDisclaimerText = window.localStorage.getItem(settingName);

  // Show the disclaimer if there is no cookie indicating that the user has seen it before.
  if (
    disclaimerUrl !== undefined &&
    (showEvenIfAlreadyAgreed || disclaimerUrl !== null)
  ) {
    const deferred = new Promise<string | null>(function(resolve, reject) {
      try {
        const request = new XMLHttpRequest();
        request.open("get", disclaimerUrl);
        request.onloadend = function() {
          if (this.status === 200) {
            if (
              !showEvenIfAlreadyAgreed &&
              this.response === previousDisclaimerText
            ) {
              resolve(null);
            } else {
              resolve(this.response);
            }
          } else {
            reject(this.statusText);
          }
        };
        request.send();
      } catch (err) {
        reject(err);
      }
    });

    deferred.then(
      function(disclaimerHtml) {
        if (disclaimerHtml) {
          const parser = new DOMParser();
          const doc = parser.parseFromString(disclaimerHtml, "text/html");
          const titleElement = doc.querySelector("head > title");
          const title = titleElement ? titleElement.textContent : "Disclaimer";
          const bodyElement = doc.querySelector("body");
          const body = bodyElement!.innerHTML;
          $("<div>")
            .html(body)
            .dialog({
              title,
              modal: true,
              closeOnEscape: false,
              width: 600,
              buttons: {
                Accept() {
                  $(this).dialog("close");
                }
              },
              open(/*event, ui*/) {
                // Remove the close button from the disclaimer form.
                const form = $(this).parent();
                $("a.ui-dialog-titlebar-close", form).remove();
              },
              close(/*event, ui*/) {
                // Store the current date with the setting.
                window.localStorage.setItem(settingName, disclaimerHtml);
                $(this)
                  .dialog("destroy")
                  .remove();
              }
            } as any);
        }
      },
      function(error) {
        console.error("Error creating disclaimer", error);
      }
    );

    // Load the content into a div.  Only when the source page has loaded do invoke the dialog constructor.
    // This is to ensure that the dialog is centered on the page.
  }
}
