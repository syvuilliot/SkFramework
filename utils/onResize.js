define([],
function() {
	var getSize = function(el) {
		return {
			w: el.clientWidth,
			h: el.clientHeight
		};
	};
	
	return function(el, callback, options) {
		var oldSize = getSize(el);
		var pollId = setInterval(function() {
			var size = getSize(el);
			if (size.w != oldSize.w || size.h != oldSize.h) {
				callback();
			}
			oldSize = size;
		}, (options && options.interval) || 500);
		
		return {
			remove: function() {
				clearInterval(pollId);
			}
		};
	};
});
