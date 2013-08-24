define([
	'bacon',
], function(
	Bacon
){
	var CONTAINER = 'container';
	var CONTENT = 'content';
	var FACTORY = 'factory';


	// j'ai fait un mixin de type constructeur, mais ce n'est peut-être pas le plus pertinent, peut-être vaudrait-il mieux utiliser this[CONTAINER] et this[FACTORY]...
	var WithContentMappedToContainer = function(args) {
		this.own(args[CONTAINER].get("content").updateContentMapR(
			this.getR(CONTENT).
			flatMapLatestDiff(null, function(oldItems, newItems){
				return newItems && newItems.asChangesStream(oldItems) ||
					(oldItems ? Bacon.constant(oldItems.toChanges("remove")) : Bacon.never());
			}),
		args[FACTORY]));

	};
	return WithContentMappedToContainer;
});