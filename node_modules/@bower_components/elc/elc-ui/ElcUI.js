/*global define*/
define([
	"./RouteSelector",
	"dojo/text!./Templates/elc-ui.min.html",
	"dojo/text!./Templates/elc-ui-bootstrap.min.html"
], function (RouteSelector, templateHtml, bootstrapTemplateHtml) {

	/**
	 * 
	 * @param {HTMLElement} rootNode
	 * @param {Object} [options]
	 * @param {Boolean} [options.bootstrap=false] - Use the Bootstrap template instead of default.
	 */
	function ElcUI(rootNode, options) {
		var self = this;
		var parser = new DOMParser();
		var doc = parser.parseFromString(options && options.bootstrap ? bootstrapTemplateHtml : templateHtml, "text/html");
		var uiDom = doc.body.querySelector(".elc-ui-root").cloneNode(true);
		this.root = rootNode;
		this.root.innerHTML = uiDom.outerHTML;

		// Setup route selector

		var routeSelector = new RouteSelector(this.root.querySelector(".route-selector"));

		// Setup nearest route location form
		(function () {
			var form = self.root.querySelector(".find-nearest-route-location-form");
			form.onsubmit = function () {
				var radius = parseFloat(form.radius.value);
				var evt = new CustomEvent('find-nearest-route-location-submit', {
					detail: {
						radius: radius
					}
				});
				self.root.dispatchEvent(evt);

				return false;
			};
		}());

		// Setup route location form.
		(function () {
			var findRouteLocationForm = self.root.querySelector(".find-route-location-form");
			// Default the reference date to today.
			var today = new Date();
			today = today.toISOString().replace(/T.+$/i, '');
			// Use set attribute so that resetting the form returns to this value.
			findRouteLocationForm.referenceDate.setAttribute("value", today);


			// Setup radio button events.
			var changeMPMode = function () {
				//var val = this.value;
				var isSrmp = Boolean(findRouteLocationForm.querySelector("input[value=SRMP]:checked"));
				var isLine = Boolean(findRouteLocationForm.querySelector("input[value=line]:checked"));
				var classList = findRouteLocationForm.classList;

				if (isSrmp) {
					classList.add("mp-mode-srmp");
					classList.remove("mp-mode-arm");
				} else {
					classList.add("mp-mode-arm");
					classList.remove("mp-mode-srmp");
				}

				if (isLine) {
					findRouteLocationForm.endMilepost.setAttribute("required", "required");
					classList.add("geo-mode-line");
					classList.remove("geo-mode-point");
				} else {
					findRouteLocationForm.endMilepost.removeAttribute("required");
					classList.add("geo-mode-point");
					classList.remove("geo-mode-line");
				}
			};

			findRouteLocationForm.onsubmit = function () {
				var evt;
				var detail = {
					Route: this.route.value,
					Decrease: this.decrease.checked,
					ReferenceDate: new Date(this.referenceDate.value),
				};

				var isSrmp = Boolean(this.querySelector("input[value=SRMP]:checked"));

				if (!isSrmp) {
					detail.Arm = parseFloat(this.milepost.value);
				} else {
					detail.Srmp = parseFloat(this.milepost.value);
					detail.Back = this.back.checked;
				}

				// If "line" is checked, add end MP properties.
				if (this.querySelector("input[value=line]:checked")) {
					if (!isSrmp) {
						detail.EndArm = parseFloat(this.endMilepost.value);
					} else {
						detail.EndSrmp = parseFloat(this.endMilepost.value);
						detail.EndBack = this.endBack.checked;
					}
				}

				evt = new CustomEvent('find-route-location-submit', {
					detail: detail
				});
				self.root.dispatchEvent(evt);
				return false;
			};

			// Programatically click input elements that are checked by default so that 
			// appropriate controls are shown / hidden when form is reset.
			findRouteLocationForm.addEventListener("reset", function () {
				var checkedRB = findRouteLocationForm.querySelectorAll("input[checked]");
				for (var i = 0, l = checkedRB.length; i < l; i += 1) {
					checkedRB[i].click();
				}
			});

			// Attach the "changeMPMode" function to radio buttons.
			var radioButtons = findRouteLocationForm.querySelectorAll("input[type=radio]");

			var rb;
			for (var i = 0; i < radioButtons.length; i++) {
				rb = radioButtons[i];
				rb.addEventListener("click", changeMPMode);
			}
		}());

		Object.defineProperties(this, {
		    routes: {
		        get: function () {
		            return routeSelector.routes;
		        },
		        set: function (routesArray) {
		            routeSelector.routes = routesArray;
		        }
		    }
		});
	}

	return ElcUI;
});