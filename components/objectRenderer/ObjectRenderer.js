define([
	'dojo/_base/declare',
	'SkFramework/utils/binding',
	"put-selector/put",
	'frb/bind',
	"SkFramework/components/repeater/Repeater",

], function(
	declare,
	binding,
	put,
	bind,
	Repeater
){

	return declare([Repeater], {
		collectionProperty: "config",

		constructor: function() {
		},
		_addItemComponent : function(value, index){
			this.inherited(arguments);
			//create binding between this._presenter.value and component
			var comp = this._componentsCollection[index];
			var prop = value.property;
			var cancelValueBinding = bind(comp._presenter, "value", {
				"<->": prop ? "value."+prop : "value", // if prop is undefined, bind the whole value
				source: this._presenter
			});
			var bindingRemover = {
				remove: function(){cancelValueBinding();},
			};
			this._bindComponent(comp, bindingRemover);
		},
		createComponent: function(configLine){
			var constructor = configLine.componentConstructor || this.componentConstructor;
			var args = configLine.componentConstructorArguments || this.componentConstructorArguments;
			var comp = new constructor(args);
			return comp;
		},

	});
});