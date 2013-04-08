define([
	'ksf/utils/constructor',
	'./Registry',
	'./Manager',
	'./placement/PlacerWithIdClass',
	'./placement/samples/KsDomInDom',
	'./placement/samples/DomInKsDom',
	'./placement/samples/DomInDom',
], function(
	ctr,
	Registry,
	Manager,
	PlacerWithIdClass,
	KsDomInDom,
	DomInKsDom,
	DomInDom
) {

	return ctr(function DomComponent(){
		this._components = new Registry();
		var domInDomPlacerWithClass = new PlacerWithIdClass({
			placer: new DomInDom(),
			registry: this._components,
		});
		this._placement = new PlacementManager({
			placers: [
				domInDomPlacerWithClass,
				new KsDomPlacer(domInDomPlacerWithClass),
				new InKsDom(domInDomPlacerWithClass)
			],
		});
		this._components.addComponentFactory("domNode", function(){
			return document.createElement(this._domTag || "div");
		}.bind(this));
	}, {
		get domNode() {
			return this._components.get("domNode") || this._components.create("domNode");
		},
		_place: function(placement){
			// use "domNode" as root
			return this._components.place(["domNode", placement]);
		},
	});

});
