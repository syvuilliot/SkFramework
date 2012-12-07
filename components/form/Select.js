define([
	"dojo/_base/declare",
	"SkFramework/components/Repeater",
	"frb/bind",
	"put-selector/put",
	"SkFramework/utils/frb-dom",
], function(declare, Repeater, bind, put){

	return declare(Repeater, {
		domTag: "select",
		collectionProperty: "options",
		constructor: function(){
			this._cancelValueBinding = bind(this, "domNode.value", {"<->": "_presenter.value"});
		},
		createComponent: function(option){
			return put("option", {
				value: option.value,
				innerHTML: option.label
			});
		},
		destroy: function(){
			this._cancelValueBinding();
			this.inherited(arguments);
		},
	});
});