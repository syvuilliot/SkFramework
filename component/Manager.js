define([
	'ksf/utils/constructor',
	'./Registry',
	'./RegistryFactory',
	'./placement/Manager',
	'./RegistryFactoryPlacement',
	'ksf/utils/proxyFunctions',
], function(
	ctr,
	Registry,
	RegistryFactory,
	PlacementManager,
	RegistryFactoryPlacement,
	proxy
) {

	var Manager = ctr(function Manager(args) {
		this._registry = new Registry();
		this._registryFactory = new RegistryFactory(this._registry);
		this._placement = new PlacementManager(args.placers);
		this._registryFactoryPlacement = new RegistryFactoryPlacement({
			components: this._registryFactory,
			placement: this._placement,
		});
	});

	proxy.methods(Manager.prototype, "_registry", [
		"getId",
	]);
	proxy.methods(Manager.prototype, "_registryFactory", [
		"addComponentFactory",
		"addEachComponentFactory",
		"addEachBindingsFactory",
		"create",
		"get",
	]);
	proxy.methods(Manager.prototype, "_registryFactoryPlacement", [
		"place",
	]);

	return Manager;

});
