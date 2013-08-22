define([
	"compose/compose",
	"ksf/collections/ObservableObject",
	"collections/map",
], function(
	compose,
	ObservableObject,
	Map
){
	// je considère que le fait d'ajouter un "fallback" qui appelle une factory quand un composant n'est pas trouvé par "get" n'est pas une fonctionnalité en soit, c'est juste une logique de surcharge. Donc, suivant ce que l'on s'est dit, je le met directement dans la "composition" et je n'en fais pas un mixin à part (comme c'était le cas).
	var LazyRegistry = compose(
		ObservableObject,

		function(args){
			this._usersCount = new Map();
			this.factories = new Map();
		},
		{
			has: function(id) {
				if (typeof id !== 'string') { return false; }
				return ObservableObject.prototype.has.call(this, id) || this.factories.has(id);
			},
			get: function(id){
				var cmp = ObservableObject.prototype.get.call(this, id);
				if (!cmp) {
					var factory = this.factories.get(id);
					cmp = factory && factory();
					cmp && this.add(cmp, id);
				}
				if (cmp) {
					this._usersCount.set(cmp, (this._usersCount.get(cmp) || 0) + 1);
				}
				return cmp;
			},
			release: function(cmp) {
				var count = (this._usersCount.get(cmp) || 0) - 1;
				if (count <= 0){
					this._usersCount.delete(cmp);
					this.remove(cmp);
					cmp.destroy && cmp.destroy();
				} else {
					this._usersCount.set(cmp, count);
				}
			},
		}
	);

	var WithComponentsRegistryGenerator = function(args){
		var REGISTRY_NAME = args && args.registryName || "_components";

		var WithComponentsRegistry = function(args){
			this[REGISTRY_NAME] = new LazyRegistry();
		};
		WithComponentsRegistry.prototype = {
			destroy: function(){
				this[REGISTRY_NAME].forEach(function(cmp){
					cmp.destroy();
				});
			},
		};
		return WithComponentsRegistry;

	};

	var WithComponentsRegistry = WithComponentsRegistryGenerator();
	WithComponentsRegistry.create = WithComponentsRegistryGenerator;

	return WithComponentsRegistry;
});