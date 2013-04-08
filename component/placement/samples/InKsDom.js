define([
	'ksf/utils/constructor',
	'dojo/_base/lang',
	'./DomInDom'
], function(
	ctr,
	lang,
	DomInDom
) {
	var areSupported = function(child, parent) {
		return parent.domNode && (child instanceof HTMLElement);
	};

	return ctr(function (placer) {
		this._placer = placer;
	}, {
		put: function(child, parent, options) {
			if (areSupported(child, parent)) {
				return this._placer.put(child, parent.domNode, options);
			}
		},
		set: function(child, parent, options) {
			if (areSupported(child, parent)) {
				return this._placer.set(child, parent.domNode, options);
			}
		},
		remove: function(child, parent, options) {
			if (areSupported(child, parent)) {
				return this._placer.remove(child, parent.domNode, options);
			}
		}
	});
});