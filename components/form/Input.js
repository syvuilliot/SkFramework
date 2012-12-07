define([
	"dojo/_base/declare",
	"SkFramework/component/DomComponent",
	"frb/bind",
	"SkFramework/utils/frb-dom",
], function(declare, DomComponent, bind){

	return declare(DomComponent, {
		domTag: "input",
		constructor: function(){
			this._cancelValueBinding = bind(this, "domNode.value", {"<->": "_presenter.value"});
		},
		destroy: function(){
			this._cancelValueBinding();
			this.inherited(arguments);
		},
	});
});