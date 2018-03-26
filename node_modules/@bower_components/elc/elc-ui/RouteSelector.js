/*global define,module, require*/
// if the module has no dependencies, the above pattern can be simplified to
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(["../Route", "../RouteId"], factory);
    } else if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory(require("Route", "RouteId"));
    } else {
        // Browser globals (root is window)
        root.elc = factory(root.Route, root.RouteId);
    }
}(this, function (Route, RouteId) {

    /**
     * Creates a Route Selector UI control.
     * @param {HTMLElement} root
     */
    function RouteSelector(root) {
        if (!(root && root instanceof HTMLElement)) {
            throw new TypeError("No root element provided or not an HTML element");
        }

        root.classList.add("route-selector");

        var progressBar = document.createElement("progress");
        progressBar.classList.add("route-list-progress");
        progressBar.textContent = "Loading route list...";
        root.appendChild(progressBar);

        var _routes = null;

        var mainlineSelect = document.createElement("select");
        var routeSelect = document.createElement("select");
        routeSelect.name = "route";
        routeSelect.required = true;
        // for bootstrap
        mainlineSelect.classList.add("form-control");
        routeSelect.classList.add("form-control");

        var cbLabel = document.createElement("label");
        var checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.name = "decrease";
        cbLabel.appendChild(checkbox);
        cbLabel.appendChild(document.createTextNode(" Decrease"));
        cbLabel.classList.add("input-group-addon");

        root.appendChild(mainlineSelect);
        root.appendChild(routeSelect);
        root.appendChild(cbLabel);

        Object.defineProperties(this, {
            /**@property {HTMLElement}*/
            root: {
                get: function () {
                    return root;
                }
            },
            /**@property {Route[]}*/
            routes: {
                get: function () {
                    return _routes;
                },
                set: function (routesArray) {
                    _routes = routesArray;
                    // Sort the routes by route IDs' SR then RRQ (non numeric comes before numeric).
                    _routes.sort(function (a, b) { return RouteId.sort(a.routeId, b.routeId); });

                    var srDocFrag = document.createDocumentFragment();

                    var isGroup = document.createElement("optgroup");
                    isGroup.label = "Interstate Routes";

                    var usGroup = document.createElement("optgroup");
                    usGroup.label = "US Routes";

                    var waGroup = document.createElement("optgroup");
                    waGroup.label = "WA State Routes";



                    // Populate the SR Select.
                    var route, i, l, option, rt;
                    for (i = 0, l = routesArray.length; i < l; i += 1) {
                        route = routesArray[i];
                        if (route.name && route.isMainline) {
                            option = document.createElement("option");
                            option.label = route.label;
                            option.textContent = route.label;
                            option.value = route.name;
                            option.dataset.isBoth = route.isBoth;
                            rt = route.routeTypeAbbreviation;
                            if (rt) {
                                switch (rt) {
                                    case "IS":
                                        isGroup.appendChild(option);
                                        break;
                                    case "US":
                                        usGroup.appendChild(option);
                                        break;
                                    case "SR":
                                        waGroup.appendChild(option);
                                        break;
                                }
                            } else {
                                srDocFrag.appendChild(option);
                            }
                        }
                    }

                    if (isGroup.hasChildNodes()) {
                        srDocFrag.appendChild(isGroup);
                    }
                    if (usGroup.hasChildNodes()) {
                        srDocFrag.appendChild(usGroup);
                    }
                    if (waGroup.hasChildNodes()) {
                        srDocFrag.appendChild(waGroup);
                    }

                    mainlineSelect.appendChild(srDocFrag);
                    addOptionsForCurrentlySelectedMainline();
                    setRouteDirectionControls();

                    root.classList.add("routes-loaded");
                }
            }
        });

        /**
         * Populates the route box with options associated with the currently selected mainline.
         */
        function addOptionsForCurrentlySelectedMainline() {
            var mainline = mainlineSelect.value;
            // Remove options.
            routeSelect.innerHTML = "";

            var docFrag = document.createDocumentFragment();
            var route, option, srRe = /^\d{3}\s/, title, label;
            for (var i = 0, l = _routes.length; i < l; i += 1) {
                route = _routes[i];
                if (route.routeId.sr === mainline) {
                    option = document.createElement("option");
                    option.value = route.name;

                    label = route.isMainline ? "Mainline" : route.routeId.rrq ? [route.routeId.rrt, route.routeId.rrq].join(" ") : route.routeId.rrt;
                    option.label = label;
                    option.textContent = label;

                    title = route.routeId.description;
                    title = title.replace(srRe, "");
                    option.title = title;

                    option.dataset.isBoth = route.isBoth;
                    docFrag.appendChild(option);
                }
            }

            routeSelect.appendChild(docFrag);

            routeSelect.disabled = routeSelect.options.length === 1;

            setRouteDirectionControls();
        }

        function setRouteDirectionControls() {
            var option = routeSelect.options[routeSelect.selectedIndex];
            if (option.dataset.isBoth === "true") {
                checkbox.removeAttribute("disabled");
                root.classList.add("direction-both");
            } else {
                root.classList.remove("direction-both");
                checkbox.setAttribute("disabled", "disabled");

            }
        }

        mainlineSelect.addEventListener("change", addOptionsForCurrentlySelectedMainline, true);

        routeSelect.addEventListener("change", setRouteDirectionControls);
    }

    return RouteSelector;
}));