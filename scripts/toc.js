/*global jQuery*/
/*jslint nomen:true*/

(function ($) {
	"use strict";
	/// <summary>Creates a table of contents, with an entry for each section.</summary>

	var sectionCount = 0;

	function createTocEntry(section) {
		/// <summary>Creates a TOC list item corresponding to an HTML section.</summary>
		var heading, li, subsections, subsectionList, i, l, subsection, a, id;

		// Get the section's id.  If it has no id, assign one.
		id = section.id !== "undefined" ? id : section.attr("id");

		if (!id) {
			id = ["section", sectionCount].join("-");
			if (section.attr) {
				section.attr("id", id);
			} else {
				section.id = id;
			}
			sectionCount += 1;
		}

		// Get the heading for this section.
		heading = $("> *", section).filter("h1,h2,h3,h4,h5,h6");

		li = $("<li>");
		a = $("<a>").attr("href", ["#", id].join("")).text(heading.text()).appendTo(li);

		subsections = $("> section", section);

		l = subsections.length;
		if (l > 0) {
			// If this section has child sections, create corresponding child items in the TOC.
			subsectionList = $("<ol>").appendTo(li);
			for (i = 0, l = subsections.length; i < l; i += 1) {
				// Get the current subsection
				subsection = subsections.eq(i);
				createTocEntry(subsection).appendTo(subsectionList);
			}
		}

		return li;
	}

	$.widget("ui.toc", {
		options: {
		},
		_list: null,
		expanded: true,
		collapse: function () {
			if (this.expanded) {
				this._list.hide("blind");
				this._trigger("collapse");
				this.expanded = false;
			}
		},
		expand: function () {
			if (!this.expanded) {
				this._list.show("blind");
				this._trigger("expand");
				this.expanded = true;
			}
		},
		_toggle: function (evt) {
			var $this = evt.data.widget;
			if ($this._list.css("display") === "none") {
				$this.expand();
			} else {
				$this.collapse();
			}
			return false;
		},
		_create: function () {
			var $this = this, $element = $(this.element), sections, li, toggleLink, i, l;

			// Create a link that will toggle the visibility of the table of contents.
			toggleLink = $("<a href='#'>Table of Contents</a>").appendTo(this.element);
			this._list = $("<ol>").appendTo(this.element);

			toggleLink.click({
				widget: $this
			}, $this._toggle);

			$element.addClass("ui-toc");

			// Get all of the top level sections in the document.
			sections = $("> section", "body");

			for (i = 0, l = sections.length; i < l; i += 1) {
				li = createTocEntry(sections[i]).appendTo(this._list);
			}

			return this;
		},
		_destroy: function () {
			$.Widget.prototype.destroy.apply(this, arguments);
		}
	});
} (jQuery));