define([
	"ksf/utils/constructor",
	"../List",
	"frb/bindings",
	"ksf/utils/frb-dom",
], function(
	ctr,
	List,
	bindings
){

	return ctr(function(args){
		this._list = new List({
			domTag: "select",
			factory: {
				create: function (item) {
					return bindings.defineBindings(document.createElement("option"), {
						"innerHTML": {"<-": args.labelProp, source: item},
						"value": {"<-": args.valueProp, source: item},
					});
				},
				destroy: function(item, cmp){
					bindings.cancelBindings(cmp);
				},
			},
		});
		this.domNode = this._list.domNode;
		this.options = args.options;
		this.value = args.value;
		bindings.defineBindings(this, {
			"_list.domNode.value": {"<->": "value", source: this},
			"_list.value": {"<->": "options", source: this},
		});
	}, {
		destroy: function(){
			bindings.cancelBindings(this);
			this._list.destroy();
		}
	});
});