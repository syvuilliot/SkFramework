define([
	'dojo/_base/declare',
	'SkFramework/component/DomComponent',	'SkFramework/component/Container',
	'SkFramework/component/_WithDomNode',	'SkFramework/component/_WithDijit',
	'SkFramework/component/Presenter',
	'SkFramework/utils/binding',
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
		//default class for sub components that binds its value to its innerHTML
		componentConstructor: declare(DomComponent, {
			_render: function(){
				this.inherited(arguments);
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

			//bind this to presenter value to call swap method
			this._componentsCollection = [];
			this._cancelValueBinding = bind(this, ".*", {"<-": "_presenter.value"});

		},
		swap: function(start, length, values){
			// console.log("swap called", arguments);
			// delete components
			for(var i=0; i<length; i++){
				var component = this._componentsCollection[start];
				if(component) {//TODO: prevent frb from detecting own properties
					this._componentsCollection.splice(start, 1);
					this._deleteComponent(component);
				}
			}
			// add components
			values.forEach(function(value, index, collection){
				var component = this.createComponent(value, index, collection);
				this._componentsCollection.splice(start+index, 0, component);
				this._addComponent(component);
				this._placeComponent(component, start + index);
			}.bind(this));
		},
		clear: function(){
			// console.log("clear called", arguments);
			//delete all components
		},
		createComponent: function(value){
			var args = this.componentConstructorArguments;
			args.value = value;
			var comp = new this.componentConstructor(args);
			return comp;
		},
		destroy: function(){
			this._cancelValueBinding();
			this.inherited(arguments);
		},

	});
});