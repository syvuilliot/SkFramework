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
						"text": {"<-": args.labelProp, source: item},
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
			"_list.value": {"<-": "_options"},
			"domNode.selectedIndex": {
				"<->": "value",
				source: this,
				convert: function(item){
					return this._options && this._options.indexOf(item);
				}.bind(this),
				revert: function(index){
					return this._options && this._options[index];
				}.bind(this),
			},
		});

	}, {
		set options(value){
			this._options = value;
			// keep domNode in sync when changing options (by default the browser select the first option)
			this.domNode.selectedIndex = this._options && this._options.indexOf(this.value);
		},
		get options(){
			return this._options;
		},
		destroy: function(){
			bindings.cancelBindings(this);
			this._list.destroy();
		}
	});
});