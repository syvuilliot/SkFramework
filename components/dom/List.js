define([
	'compose',
	'bacon',
	'ksf/collections/OrderableSet',
	'./HtmlElement'
], function(
	compose,
	Bacon,
	OrderableSet,
	HtmlElement
){
	return compose(
		HtmlElement,
		function(tag, args){
			var list = this;
			this._content = new OrderableSet();
			this._content.updateContentMapR(
				this.getR("value").
				flatMapLatestDiff(new OrderableSet(), function(oldItems, newItems){
					var diffChanges = [];
					oldItems && oldItems.forEach(function(item){
						diffChanges.push({type: "remove", value: item, index: 0});
					});
					newItems && newItems.forEach(function(item, index){
						diffChanges.push({type: "add", value: item, index: index});
					});
					return newItems && newItems.asStream("changes").toProperty(diffChanges) || Bacon.constant(diffChanges);
				}),
			args.factory);

			this._content.asStream("changes").onValue(function(changes) {
				var domNode = this.get('domNode');
				changes.forEach(function(change) {
					if (change.type === 'add') {
						domNode.insertBefore(change.value.get('domNode'), domNode.children[change.index]);
					} else {
						domNode.removeChild(change.value.get('domNode'));
					}
				});
			}.bind(this));
		}
	);
});