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

		createRendering: function() {
			this._domNode = document.createElement(this._tag);
		},

		destroyRendering: function() {
			this.remove('domNode');
		},

		_applyDomAttr: function(prop, value) {
			this._domNode[prop] = value;
			if (prop == 'innerHTML') {
				this._emit('sizechanged');
			}
		},
		updateRendering: function() {
			this.forEach(function(value, prop) {
				this._applyDomAttr(prop, value);
			}.bind(this));
		},
	});
});