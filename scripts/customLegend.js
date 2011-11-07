/*jslint white: true, nomen: true */
/*global dojo, jQuery */
(function ($) {
    "use strict";

    var basemapSelectionChangeHandler;

    basemapSelectionChangeHandler = function () {
        var gallery, basemap, $sections, id;
        gallery = this.options.basemapGallery;
        basemap = gallery.getSelected();

        // Loop through all of the basemap-specific sections specified in the options...
        for (id in this.options.basemapSpecificSelections) {
            if (this.options.basemapSpecificSelections.hasOwnProperty(id)) {
                // Get the sections associated with the basemap matching the id (not necessarily the currently selected basemap).
                $sections = this.options.basemapSpecificSelections[id];
                // If $sections is a string, convert it to a jQuery object.
                if (typeof ($sections) === "string") {
                    $sections = $($sections, this.element);
                }

                // Turn the sections on if they belong to the current basemap, off otherwise.
                if (basemap.id === id) {
                    $sections.addClass("hidden");
                } else {
                    $sections.removeClass("hidden");
                }
            }

        }
    };

    $.widget("ui.customLegend", {
        options: {
            html: null,
            basemapGallery: null,
            basemapSpecificSections: null, // e.g., { "fcBasemap": "#basemapLegend" }
            htmlType: "html" // html, url
        },
        setBasemapGallery: function (basemapGallery) {
            if (basemapGallery) {
                this.options.basemapGallery = basemapGallery;
            }
            if (this.options.basemapGallery && typeof (this.options.basemapSpecificSections) === "object") {
                dojo.connect(this.options.basemapGallery, "onSelectionChange", this, basemapSelectionChangeHandler);
            }
        },
        _create: function () {
            var $this = this;
            // Add the HTML to the element.
            if (!this.options.html) {
                throw new Error("html option not provided");
            }

            function setupControl() {
                $($this.options.html).appendTo($this.element);
                if ($this.options.basemapGallery) {
                    $this.setBasemapGallery(basemapGallery);
                }
            }

            // If html is HTML code (and not a URL pointing to HTML)...
            if (/url/i.test($this.options.htmlType)) {
                // Load the HTML markup from the html option's URL.
                $.ajax(this.options.html, {
                    dataType: "html",
                    success: function (data) {
                        $this.options.html = data;
                        setupControl();
                    }
                });
            } else {
                setupControl();
            }

            return this;
        },
        _destroy: function () {
            $.Widget.prototype.destroy.apply(this, arguments);
        }
    });
} (jQuery));