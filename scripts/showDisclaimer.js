/*global define, wsdot, Promise*/
define(function () {
    "use strict";

    /**
     * Shows the disclaimer dialog if the configuration contains a disclaimer.  If the dialog is shown, a jQuery object containing the dialog is returned.
     * @param {Boolean} showEvenIfAlreadyAgreed - Set this to true if you want to force the disclaimer to be shown even if there is a cookie indicating the user has already agreed.
     * @returns {Object}
     */
    function showDisclaimer(showEvenIfAlreadyAgreed) {
        var configName, settingName;

        // Get the configuration name from the query string.
        (function () {
            var re = /\bconfig=([^&]+)/i, match;
            if (location.search) {
                match = location.search.match(re);
                if (match) {
                    configName = match[1];
                }
            }
            if (!configName) {
                configName = "";
            }
        }());

        settingName = "GeoportalAggreedToDisclaimer" + configName;

        var previousDisclaimerText = window.localStorage.getItem(settingName);

        // Show the disclaimer if there is no cookie indicating that the user has seen it before.
        if (wsdot.config.disclaimer !== undefined && (showEvenIfAlreadyAgreed || (wsdot.config.disclaimer !== null))) {

            var deferred = new Promise(function (resolve, reject) {
                var request;
                try {
                    request = new XMLHttpRequest();
                    request.open("get", wsdot.config.disclaimer);
                    request.onloadend = function () {

                        if (this.status === 200) {
                            if (!showEvenIfAlreadyAgreed && this.response === previousDisclaimerText) {
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

            deferred.then(function (disclaimerHtml) {
                var parser, doc, title, body;
                if (disclaimerHtml) {
                    parser = new DOMParser();
                    doc = parser.parseFromString(disclaimerHtml, "text/html");
                    title = doc.querySelector("head > title");
                    title = title.textContent;
                    body = doc.querySelector("body");
                    body = body.innerHTML;
                    $("<div>").html(body).dialog({
                        title: title.length > 0 ? title : "Disclaimer",
                        modal: true,
                        closeOnEscape: false,
                        width: 600,
                        buttons: {
                            "Accept": function () {
                                $(this).dialog("close");
                            }
                        },
                        open: function (/*event, ui*/) {
                            // Remove the close button from the disclaimer form.
                            var form = $(this).parent();
                            $("a.ui-dialog-titlebar-close", form).remove();
                        },
                        close: function (/*event, ui*/) {
                            // Store the current date with the setting.
                            window.localStorage.setItem(settingName, disclaimerHtml);
                            $(this).dialog("destroy").remove();
                        }
                    });
                }
            }, function (error) {
                console.error("Error creating disclaimer", error);
            });

            // Load the content into a div.  Only when the source page has loaded do invoke the dialog constructor.
            // This is to ensure that the dialog is centered on the page.
        }
    }

    return showDisclaimer;
});