define([
	'dojo/_base/declare'
], function(
	declare
) {
	return declare([], {
		content: null,
		
		_contentSetter: function(content) {
			this.content = content;
		}
	});
});
