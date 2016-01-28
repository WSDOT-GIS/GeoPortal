/// <reference path="../bower_components/polyfills/url.js" />
/// <reference path="../bower_components/promise-polyfill/Promise.js" />

/**
 * List item representing a GP job.
 * @module JobListItem
 */
define(["./gpToBootstrapUtils"], function (gpToBootstrapUtils) {
    "use strict";

    var errorClassName = "error";

    /**
     * An object that manages a list item associated with a job.
     * @constructor
     * @alias module:JobListItem
     * @param {Object.<string, (string|number)>} options - Values for GP parameters.
     * @property {string} jobId - The identifier for the geoprocessing job.
     * @property {HTMLLIElement} listItem - The list item (<li>) associated with this object.
     * @property {Boolean} loading - Gets or sets the "loading" status of this object. Changing this value will toggle the "loading" class on the list item.
     * @property {string} link - Gets or sets the URL inside of the <a> element.
     * @property {string} siteId - Gets or sets the site ID label on the link.
     * @property {string} startDate - Gets or sets the start date label on the link.
     * @property {string} endDate - Gets or sets the end date label on th elink.
     * @property {string} error - Gets or sets the error message on the list item.
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

        var paramSpanDict = {
            site_id: siteIdSpan,
            start_year: startYearSpan,
            start_month: startMonthSpan,
            end_year: endYearSpan,
            end_month: endMonthSpan
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

        var errorP = document.createElement("p");
        errorP.classList.add(errorClassName);
        li.appendChild(errorP);

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
            },
            error: {
                set: function (value) {
                    errorP.textContent = value || "";
                    if (value) {
                        li.classList.add(errorClassName);
                    } else {
                        li.classList.remove(errorClassName);
                    }
                }
            }
        });

        // Assign input parameters
        if (options) {
            for (var pName in options) {
                if (options.hasOwnProperty(pName)) {
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

    JobListItem.prototype.addMessages = function (messages) {
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
                li.textContent = message.description;
                docFrag.appendChild(li);
            });
            self.messagesList.appendChild(docFrag);
        }
    }

    return JobListItem;
});