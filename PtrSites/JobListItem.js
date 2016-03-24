/// <reference path="../bower_components/polyfills/url.js" />
/// <reference path="../bower_components/promise-polyfill/Promise.js" />

/**
 * @external GPMessage
 * @property {string} type - The type of message
 * @property {string} description - The text of the message
 * @see {@link https://developers.arcgis.com/javascript/jsapi/gpmessage-amd.html|esri/tasks/GPMessage}
 */

/**
 * List item representing a GP job.
 * @module JobListItem
 */
define(["./gpToBootstrapUtils"], function (gpToBootstrapUtils) {
    "use strict";

    /**
     * @typedef {Object.<string, (string|number)>} JobListOptions
     * @property {string} siteId - Site ID
     * @property {number} startYear - Start Year
     * @property {number} startMonth - Start Month
     * @property {number} endYear - End Year
     * @property {number} endMonth - End Month
     */

    /**
     * An object that manages a list item associated with a job.
     * @constructor
     * @alias module:JobListItem
     * @param {JobListOptions} options - Values for GP parameters.
     * @property {string} jobId - Gets or sets the identifier for the geoprocessing job.
     * @property {HTMLLIElement} listItem - Gets the list item (<li>) associated with this object.
     * @property {HTMLUListElement} messagesList - Gets the GP messages list element.
     * @property {string} status - Gets or sets the "esriJob..." status class in the class attribute.
     * @property {string} link - Gets or sets the URL inside of the <a> element.
     */
    function JobListItem(options) {
        var _jobId = null;
        var li = document.createElement("li");
        li.classList.add("list-group-item");
        var progress = document.createElement("progress");
        progress.textContent = "Loading...";

        var a = document.createElement("a");
        a.setAttribute("type", "application/zip");

        var icon = document.createElement("span");
        icon.setAttribute("class", "glyphicon glyphicon-compressed");
        a.appendChild(icon);

        // Create span placeholders for GP parameter values.
        var siteIdSpan = document.createElement("span");
        var startYearSpan = document.createElement("span");
        var startMonthSpan = document.createElement("span");
        var endYearSpan = document.createElement("span");
        var endMonthSpan = document.createElement("span");

        // Create lookup for placeholder spans.
        var paramSpanDict = {

            Site_ID: siteIdSpan,
            Start_Year: startYearSpan,
            Start_Month: startMonthSpan,
            End_Year: endYearSpan,
            End_Month: endMonthSpan
        };

        a.appendChild(siteIdSpan);
        a.appendChild(document.createTextNode(" from "));
        a.appendChild(startYearSpan);
        a.appendChild(document.createTextNode("-"));
        a.appendChild(startMonthSpan);
        a.appendChild(document.createTextNode(" to "));
        a.appendChild(endYearSpan);
        a.appendChild(document.createTextNode("-"));
        a.appendChild(endMonthSpan);
        li.appendChild(a);
        li.appendChild(progress);

        var messagesList = document.createElement("ul");
        messagesList.setAttribute("class", "message-list list-group");
        li.appendChild(messagesList);

        Object.defineProperties(this, {
            jobId: {
                get: function () {
                    return _jobId;
                },
                set: function(value) {
                    _jobId = value;
                    li.dataset.jobId = value;
                }
            },
            listItem: {
                get: function () {
                    return li;
                }
            },
            messagesList: {
                get: function() {
                    return messagesList;
                }
            },
            status: {
                get: function () {
                    // Loop through all of the "esriJob..." class names and get the first one.
                    var current, output, re = /^esriJob(\w+)$/, match;
                    for (var i = 0; i < li.classList.length; i++) {
                        current = li.classList.item(i);
                        match = current.match(re);
                        if (match) {
                            output = current;
                            break;
                        }
                    }
                    return output;
                },
                set: function (value) {
                    // Remove all "esriJob..." classes.
                    var current, re = /^esriJob(\w+)$/, match;
                    var toRemove = [];
                    for (var i = 0; i < li.classList.length; i++) {
                        current = li.classList.item(i);
                        match = current.match(re);
                        if (match) {
                            toRemove.push(current);
                        }
                    }
                    toRemove.forEach(function (cls) {
                        li.classList.remove(cls);
                    });
                    li.classList.add(value);
                }
            },
            link: {
                get: function () {
                    return a.href;
                },
                set: function (url) {
                    a.href = url;
                }
            }
        });

        // Assign input parameters
        if (options) {
            for (var pName in options) {
                if (options.hasOwnProperty(pName) && paramSpanDict.hasOwnProperty(pName)) {
                    paramSpanDict[pName].textContent = options[pName];
                }
            }
        }
    }

    /**
     * Updates the "download" attribute of the anchor element.
     */
    JobListItem.prototype.updateDownloadAttribute = function () {
        var a, fn;
        a = this.listItem.querySelector("a");
        fn = ["PTR ", this.siteId, " from ", this.startDate, " to ", this.endDate, ".zip"].join("");
        a.setAttribute("download", fn);
    };

    /**
     * Updates the GP message list
     * @param {GPMessage[]} messages - Geoprocessing messages
     */
    JobListItem.prototype.addMessages = function (messages) {

        /**
         * Creates an element with the message description. A system message will return an <a>; otherwise a text node will be returned.
         * @param {string} messageDesc - The value from the message.description.
         * @returns {(HTMLAnchorElement|Text)} - Either an anchor or a regular text node.
         */
        function createMessageNode(messageDesc) {
            var systemRe = /((?:INFO)|(?:WARNING)|(?:ERROR))\s+(\d+)/i;
            var match = messageDesc.match(systemRe);
            var output;
            if (match) {
                output = document.createElement("a");
                output.href = "//desktop.arcgis.com/search/?q=" + encodeURIComponent([match[1], match[2]].join(" "));
                output.textContent = messageDesc;
                output.target = "_blank";
            } else {
                output = document.createTextNode(messageDesc);
            }
            return output;
        }

        // Create a document fragment.
        // For each message, add a corresponding list item to the document fragment.
        // Replace the existing items with the document fragment.
        var self = this;
        self.messagesList.innerHTML = "";
        var docFrag = document.createDocumentFragment();
        if (messages && Array.isArray(messages)) {
            messages.forEach(function (message) {
                var li = document.createElement("li");
                li.setAttribute("class", [
                    "list-group-item",
                    message.type,
                    gpToBootstrapUtils.getBootstrapClassName(message.type)
                ].join(" "));
                li.appendChild(createMessageNode(message.description));
                docFrag.appendChild(li);
            });
            self.messagesList.appendChild(docFrag);
        }
    };

    return JobListItem;
});