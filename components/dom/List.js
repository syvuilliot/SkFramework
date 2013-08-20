define([
	'compose',
	'bacon',
	'./layout/HtmlContainerIncremental'
], function(
	compose,
	Bacon,
	HtmlContainer
){
	/*
	List is an HtmlElement that generates its content from its value property by using a "factory". The value should must be a ks incrementally observable collection.
	This list is optimized for only calling the factory when a new item is added and only doing incremental changes to the dom.
	 */
	return compose(
		HtmlContainer,
		function(tag, args){
			this.get("content").updateContentMapR(
				this.getR("value").
				flatMapLatestDiff(null, function(oldItems, newItems){
					return newItems && newItems.asChangesStream(oldItems) ||
						(oldItems ? Bacon.constant(oldItems.toChanges("remove")) : Bacon.never());
				}),
			args.factory);

		}
	);
});