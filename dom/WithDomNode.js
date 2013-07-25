define([
], function(
){
	return {
		_domNodeGetter: function() {
			if (!this.has('domNode')) {
				// create node if not rendered yet
				this.createRendering();
			}
			return this._Getter('domNode');
		},

		_domNodeRemover: function() {
			delete this._domNode;
		}
	};
});