define([
	'ksf/utils/constructor',
	'./Manager',
	'./placement/samples/KsDomInDom',
	'./placement/samples/DomInKsDom',
	'./placement/samples/DomInDom',
], function(
	ctr,
	Manager,
	KsDomInDom,
	DomInKsDom,
	DomInDom
) {

	return ctr(function DomComponent(){
		this._components = new Manager({
			placers: [new DomInDom(), new KsDomInDom(), new DomInKsDom()],
		});
		this._components.addComponentFactory("domNode", function(){
			return document.createElement(this._domTag || "div");
		}.bind(this));
	}, {
		get domNode() {
			return this._components.get("domNode") || this._components.create("domNode");
		},
		_setPlacement: function(placement){
			// use "domNode" as root
			return this._components.place(["domNode", placement]);
		},
	});

});
