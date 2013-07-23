define([
	'compose'
], function(
	compose
){
	return compose({
		_applyBounds: function(bounds) {
			var width = bounds.width || null;
			var height = bounds.height || null;
			
			var nodeStyle = this.get('domNode').style;
			nodeStyle.width = width && (width + 'px');
			nodeStyle.height = height && (height + 'px');
		},
		updateRendering: function() {
			var bounds = this.get('bounds');
			if (bounds) {
				this._applyBounds(bounds);
			}
		}
	});
});