define([
	'compose'
], function(
	compose
){
	return compose({
		_domNodeGetter: function() {
			if (!this._domNode) {
				// create node if not rendered yet
				this.createRendering();
			}
			return this._domNode;
		},
		_domNodeRemover: function() {
			delete this._domNode;
		},

		destroyRendering: function() {
			this.remove('domNode');
		},

		_applyDomAttr: function(prop, value) {
			this._domNode[prop] = value;
			if (prop === 'innerHTML') {
				this._emit('sizechanged');
			}
		},

		_outerSizeGetter: function() {
			var node = this.get('domNode');
			return {
				height: node.offsetHeight,
				width: node.offsetWidth
			};
		},

		createRendering: function() {
			this._domNode = document.createElement(this._tag);
		},

		updateRendering: function() {
			this.forEach(function(value, prop) {
				this._applyDomAttr(prop, value);
			}.bind(this));
		},
	});
});