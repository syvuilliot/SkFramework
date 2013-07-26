define([
	'compose',
	'collections/set'
], function(
	compose,
	Set
){
	return compose({
		_applyStyle: function() {
			var style = this.get('style'),
				newClasses = new Set(),
				domNode = this.get('domNode');
			style && style.forEach(function(value) {
				newClasses.add(value);
			});
			if (this._classes) {
				this._classes.difference(newClasses).forEach(function(cls) {
					domNode.classList.remove(cls);
				});
			}
			newClasses.difference(this._classes || []).forEach(function(cls) {
				domNode.classList.add(cls);
			});
			this._classes = newClasses;
		}
	});
});