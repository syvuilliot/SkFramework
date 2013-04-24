define([
	"ksf/utils/constructor",
	"../List",
	"frb/bind",
	"ksf/utils/frb-dom",
], function(
	ctr,
	List,
	bind
){

	return ctr(function(args){
		this._list = new List({
			domTag: "select",
			factory: {
				create: function (item) {
					var option = document.createElement("option");
					option.innerHTML = item[args.labelProp];
					option.value = item[args.valueProp];
					return option;
				},
				destroy: function(item, cmp){},
			},
		});
		this.domNode = this._list.domNode;
		this.options = args.options;
		this.value = args.value;
		this._cancelValueBinding = bind(this, "_list.domNode.value", {"<->": "value", source: this});
		this._cancelOptionsBinding = bind(this, "_list.value", {"<->": "options", source: this});
	}, {
		destroy: function(){
			this._cancelValueBinding();
			this._cancelOptionsBinding();
			this._list.destroy();
		}
	});
});