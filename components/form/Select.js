define([
	"dojo/_base/declare",
	"../repeater/Repeater",
	"../../component/DomComponent",
	"frb/bind",
	"put-selector/put",
	"../../utils/frb-dom"
], function(declare, Repeater, DomComponent, bind, put){

	var Option = declare(DomComponent, {
		domTag: "option",
		constructor: function(params){
			this._cancelLabelBinding = bind(this, "domNode.label", {"<-": "_presenter.value."+params.labelProp});
			this._cancelValueBinding = bind(this, "domNode.value", {"<-": "_presenter.value."+params.valueProp});
		},
		destroy: function(){
			this._cancelLabelBinding();
			this._cancelValueBinding();
			this.inherited(arguments);
		},
	});

	return declare(Repeater, {
		domTag: "select",
		collectionProperty: "options",
		componentConstructor: Option,
		constructor: function(params){
			this.componentConstructorArguments = {
				labelProp: params.labelProp || "label",
				valueProp: params.valueProp || "value",
			};
			this._cancelValueBinding = bind(this, "domNode.value", {
				"<->": "_presenter.value",
				// trace: true,
			});
		},
		swap: function(){
			this.inherited(arguments);
			// HACK: ensure that domNode.value is always in sync
			if (this.domNode){
				this.domNode.value = this.get("value");
			}
		},
		_insertComponentIntoDom: function(){
			this.inherited(arguments);
			// HACK: ensure that domNode.value is always in sync
			this.domNode.value = this.get("value");
		},
		destroy: function(){
			this._cancelValueBinding && this._cancelValueBinding(); // should be in _unrender
			this.inherited(arguments);
		},
	});
});