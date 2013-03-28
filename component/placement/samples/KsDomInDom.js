define([
	'ksf/utils/createConstructor',
	'dojo/_base/lang',
	'./DomInDom'
], function(
	ctr,
	lang,
	DomInDom
) {
	var areSupported = function(child, parent) {
		return child.domNode && (parent instanceof HTMLElement);
	}
	
	var domInDom = new DomInDom();

	return ctr({
		put: function(child, parent, options) {
			if (areSupported(child, parent)) {
				return domInDom.put(child.domNode, parent, options);
			}
		},
		set: function(child, parent, options) {
			if (areSupported(child, parent)) {
				return domInDom.set(child.domNode, parent, options);
			}
		},
		remove: function(child, parent, options) {
			if (areSupported(child, parent)) {
				return domInDom.remove(child.domNode, parent, options);
			}
		}
	});
});