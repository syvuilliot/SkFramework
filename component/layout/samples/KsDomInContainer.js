define([
	'ksf/utils/constructor'
], function(
	ctr
) {
	function supported (parent, child) {
		return parent.addChild && parent.removeChild;
	}

	return ctr({
		addEach: function(children, parent) {
			if (parent.setContent) {
				parent.setContent(children);
				return true;
			}
		},
		put: function(child, parent, options) {
			if (supported(parent, child)) {
				parent.addChild(child, options);
				parent.render();
				return true;
			}
		},
		remove: function(child, parent, options) {
			if (supported(parent, child)) {
				parent.removeChild(child, options);
				parent.render();
				return true;
			}
		}
	});
});