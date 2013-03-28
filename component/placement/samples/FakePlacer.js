define([
	'ksf/utils/createConstructor'
], function(
	ctr
) {
	/*
	 * Template for placer
	 */
	 
	var isSupportedChild = function(element) {
		return true;
	};
	
	var isSupportedParent = function(element) {
		return true;
	};
	
	return ctr({
		/*
		 * Place child in parent
		 */
		add: function(child, parent, options) {
			if (isSupportedChild(child) && isSupportedParent(parent)) {
				// do the actual work here
				return true;
			}
			return false;
		},
		
		/*
		 * Configure placed child
		 */
		set: function(child, parent, options) {
			if (isSupportedChild(child) && isSupportedParent(parent)) {
				// do the actual work here
				return true;
			}
			return false;
		},
		
		/*
		 * Remove child from parent
		 */
		remove: function (child, parent) {
			if (isSupportedChild(child) && isSupportedParent(parent)) {
				// do the actual work here
				return true;
			}
			return false;
		}
	});
});
