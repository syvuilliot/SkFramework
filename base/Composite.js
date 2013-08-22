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
	var CompositeDomComponent = compose(
		ObservableObject,
		Destroyable,
		WithComponentsRegistry, // no need for customization
		{
			destroy: function(){
				Destroyable.prototype.destroy.call(this);
				WithComponentsRegistry.prototype.destroy.call(this);
			},
		}
	);

	return CompositeDomComponent;
});