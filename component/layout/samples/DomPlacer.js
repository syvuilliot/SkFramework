define([
	'dojo/_base/declare',	'dojo/dom-style',
], function(
	declare,				style
) {
	var areDom = function(child, parent) {
		return (child instanceof HTMLElement) && (parent instanceof HTMLElement);
	}

	var setStyle = function(child, options) {
		style.set(child, options);
	}

	return declare([], {
		put: function(child, parent, options) {
			if (areDom(child, parent)) {
				parent.appendChild(child);
				setStyle(child, options);
			}
		},
		set: function(child, parent, options) {
			if (areDom(child, parent)) {
				setStyle(child, options);
			}
		},
		remove: function(child, parent) {
			if (areDom(child, parent)) {
				parent.removeChild(child);
			}
		}
	});
});