define([
	'compose',
	'bacon',
	'../../dom/composite/Composite',
	'./layout/HtmlContainerIncremental'
], function(
	compose,
	Bacon,
	Composite,
	HtmlContainer
){
	/*
	List is an HtmlElement that generates dom components from its 'content' property by using a "factory" and place them in its own view. The value must be a ks incrementally observable collection.
	This list is optimized for only calling the factory when a new item is added and only doing incremental changes to the dom.
	 */
	return compose(
		Composite,
		function(args){
			this._component = new HtmlContainer(args.tag || 'ul');

			this._component.get("content").updateContentMapR(
				this.getR("content").
				flatMapLatestDiff(null, function(oldItems, newItems){
					return newItems && newItems.asChangesStream(oldItems) ||
						(oldItems ? Bacon.constant(oldItems.toChanges("remove")) : Bacon.never());
				}),
			args.factory);

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