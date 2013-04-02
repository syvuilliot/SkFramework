define([
	'ksf/utils/constructor',
	'./ManagerPlacer',
	'./placement/samples/KsDomInDom',
	'./placement/samples/DomInKsDom',
	'./placement/samples/DomInDom',
], function(
	ctr,
	ManagerPlacer,
	KsDomInDom,
	DomInKsDom,
	DomInDom
) {

	return ctr(function(params){
		var placers = [new DomInDom(), new KsDomInDom(), new DomInKsDom()];
		placers = params && params.placers ? placers.concat(params.placers) : placers;
		this._components = new ManagerPlacer({
			placers: placers
		});
		this._components.addComponentFactory("domNode", function(){
			return document.createElement(this._domTag || "div");
		});
	}, {
		get domNode() {
			return this._components.get("domNode") || this._components.create("domNode");
		},
	});

});
