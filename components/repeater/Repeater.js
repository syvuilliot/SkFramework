define([
	'dojo/_base/declare',
	'../../component/DomComponent',	'../../component/Container',
	'../../component/_WithDomNode',	'../../component/_WithDijit',
	'../../component/Presenter',
	'../../utils/binding',
	"put-selector/put",
	'frb/bind',

], function(
	declare,
	DomComponent,							Container,
	_WithDom,								_WithDijit,
	PresenterBase,
	binding,
	put,
	bind
){
	var Presenter = declare([PresenterBase], {
		constructor: function(){
		},
		_valueSetter: function(value){
			//TODO: test that value is a collection
			this.value = value;
		},
	});


	return declare([DomComponent, _WithDom, _WithDijit], {
		domAttrs: {
		},
		collectionProperty: "value",
		//default class for sub components that binds its value to its innerHTML
		componentConstructor: declare(DomComponent, {
			constructor: function(){
				this._cancelValueBinding = bind(this, "domNode.innerHTML", {"<-": "_presenter.value"});
			},
			destroy: function(){
				// console.log("destroy called on", this);
				this._cancelValueBinding();
				this.inherited(arguments);
			},
		}),
		componentConstructorArguments: {},

		constructor: function() {
			//create presenter
			this._presenter = new Presenter();

			this._componentsCollection = [];
			//bind this to presenter value to call swap method
			this._cancelCollectionBinding = bind(this, ".rangeContent()", {"<-": "_presenter."+this.collectionProperty});

		},
		swap: function(start, length, values){
			// console.log("swap called", arguments);
			// delete components
			for(var i=0; i<length; i++){
				this._deleteItemComponent(start);
			}
			// add components
			values.forEach(function(value, index){
				this._addItemComponent(value, start+index);
			}.bind(this));
		},
		clear: function(){
			// console.log("clear called", arguments);
			//delete all components
		},
		_addItemComponent : function(value, index){
			var component = this.createComponent(value);
			this._componentsCollection.splice(index, 0, component);
			this._addComponent(component);
			this._placeComponent(component, index);
		},
		_deleteItemComponent: function(index){
			var component = this._componentsCollection[index];
			if(component) {//TODO: prevent frb from detecting own properties
				this._componentsCollection.splice(index, 1);
				this._deleteComponent(component);
			}
		},
		createComponent: function(value){
			var args = this.componentConstructorArguments;
			var comp = new this.componentConstructor(args);
			comp.set("value", value);
			return comp;
		},
		destroy: function(){
			this._cancelCollectionBinding();
			this.inherited(arguments);
		},

	});
});