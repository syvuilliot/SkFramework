define([
	"compose/compose",
	"ksf/collections/ObservableObject",
	"./Destroyable",
	"./WithComponentsRegistry"
], function(
	compose,
	ObservableObject,
	Destroyable,
	WithComponentsRegistry

){
	// c'est un domComponent dont la création du domNode est délégué à d'autres domComponents
	// on peut ainsi se contenter de manipuler les composants selon l'API KSF au lieu de manipuler directement des domNodes
	// c'est pourquoi il a l'outillage pour manipuler des composants : componentsRegsitry et layoutManager
	var CompositeDomComponent = compose(
		ObservableObject,
		Destroyable, // WithBindingsRegistry
		WithComponentsRegistry, // no need for customization
		// WithTreeLayoutManager
		{
			destroy: function(){
				Destroyable.prototype.destroy.call(this);
				WithComponentsRegistry.prototype.destroy.call(this);
			},
		}
	);

	return CompositeDomComponent;
});