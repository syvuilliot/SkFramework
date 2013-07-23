define([
	'compose'
], function(
	compose
){
	return compose({
		_outerSizeGetter: function() {
			var node = this.get('domNode');
			return {
				height: node.offsetHeight,
				width: node.offsetWidth
			};
		}
	});
});