define([
	"dojo/_base/declare",
	"../../components/repeater/Repeater",
	"../../component/DomComponent",
	'../../component/Presenter',
	"frb/bind",
	"put-selector/put",
	"../../utils/frb-dom",
], function(declare, Repeater, DomComponent, PresenterBase, bind, put){

	var Option = declare(DomComponent, {
		domTag: "option",
		constructor: function(params){
			this._cancelLabelBinding = bind(this, "domNode.label", {"<-": "_presenter.value."+params.labelProp});
		},
		destroy: function(){
			this._cancelLabelBinding();
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
			};
			this._cancelValueBinding = bind(this, "domNode.selectedIndex", {
				"<->": "_presenter.value",
				convert: function(value){
					var options = this._presenter.options;
					return options ? options.indexOf(value) : -1;
				},
				revert: function(selectedIndex){
					var options = this._presenter.options;
					return options ? options[selectedIndex] : undefined;
				},
				trace: true,
			});
		},
		destroy: function(){
			this._cancelValueBinding();
			this.inherited(arguments);
		},
	});
});