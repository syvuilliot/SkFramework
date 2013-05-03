define([
	'ksf/utils/constructor',
	'dojo/_base/lang'
], function(
	ctr,
	lang
) {
	var areDom = function(child, parent) {
		return (child instanceof HTMLElement) && (parent instanceof HTMLElement);
	}

	var setOptions = function(child, options) {
		for (var i in options) {
			lang.mixin(child[i], options[i]);
		}
	}

	return ctr({
		put: function(child, parent, options) {
			if (areDom(child, parent)) {
				parent.appendChild(child);
				setOptions(child, options);
				return true;
			}
		},
		set: function(child, parent, options) {
			if (areDom(child, parent)) {
				setOptions(child, options);
				return true;
			}
		},
		remove: function(child, parent, options) {
			if (areDom(child, parent)) {
				parent.removeChild(child);
				return true;
			}
		}
	});
});