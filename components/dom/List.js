define([
	'compose',
	'bacon',
	'./layout/HtmlContainerIncremental'
], function(
	compose,
	Bacon,
	HtmlContainer
){
	return compose(
		HtmlContainer,
		function(tag, args){
			this.get("content").updateContentMapR(
				this.getR("value").
				flatMapLatestDiff(null, function(oldItems, newItems){
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

		}
	);
});