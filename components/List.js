define([
	'compose',
	'ksf/dom/composite/Composite',
	'ksf/dom/composite/WithContentMappedToContainer',
], function(
	compose,
	Composite,
	WithContentMappedToContainer
){
	/*
	List is a container wrapper that generates dom components from its 'content' property by using a "factory" and place them in the container. Its 'content' value must be a ks incrementally observable collection.
	This list is optimized for only calling the factory when a new item is added and only doing incremental changes to the dom.
	 */
	return compose(
		Composite,
		WithContentMappedToContainer,
		function(args){
			this._component = args.container;
		}, {
			_applyStyle: function() {
				this.style.forEach(function(value, category) {
					this._component.style.set(category, value);
				}, this);
			},

			createRendering: function() {
				this._applyStyle();
				this.set('domNode', this._component.get('domNode'));
			},

			updateRendering: function() {
				this._applyStyle();
			}
		}
	);
});