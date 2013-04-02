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
	}

	var domInDom = new DomInDom();

	return ctr({
		put: function(child, parent, options) {
			if (areSupported(child, parent)) {
				return domInDom.put(child, parent.domNode, options);
			}
		},
		set: function(child, parent, options) {
			if (areSupported(child, parent)) {
				return domInDom.set(child, parent.domNode, options);
			}
		},
		remove: function(child, parent, options) {
			if (areSupported(child, parent)) {
				return domInDom.remove(child, parent.domNode, options);
			}
		}
	});
});