define([
	'ksf/utils/constructor',
], function(
	ctr
) {
	var areSupported = function(child, parent) {
		return ('domNode' in child) && (parent instanceof HTMLElement);
	};

	// domIn placer
	return ctr(function KsDomPlacer(placer){
		this._placer = placer;
	}, {
		put: function(child, parent, options) {
			if (areSupported(child, parent)) {
				this._placer.put(child.domNode, parent, options);
				child.layout && child.layout();
				return true;
			}
		},
		set: function(child, parent, options) {
			if (areSupported(child, parent)) {
				return this._placer.set(child.domNode, parent, options);
			}
		},
		remove: function(child, parent, options) {
			if (areSupported(child, parent)) {
				return this._placer.remove(child.domNode, parent, options);
			}
		}
	});
});