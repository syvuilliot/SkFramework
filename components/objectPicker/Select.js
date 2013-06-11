define([
	"ksf/utils/constructor",
	"../List",
	"frb/bindings",
	"dojo/on",
], function(
	ctr,
	List,
	bindings,
	on
){

	return ctr(function(args){
		this._list = new List({
			domTag: "select",
			factory: {
				create: function (item) {
					return bindings.defineBindings(document.createElement("option"), {
						"text": {
							"<-": args.labelProp,
							convert: function(label){
								return label ? label : ""; // prevent option text "undefined"
							},
							source: item,
						},
					});
				},
				destroy: function(item, cmp){
					bindings.cancelBindings(cmp);
				},
			},
			value: [],
		});
		this.domNode = this._list.domNode;
		this.value = args.value;
		this.options = args.options;

		on(this.domNode, "change", function(ev){
			this._preventUpdateSelectedIndex = true;
			this.value = this._list.value[ev.target.selectedIndex];
			this._preventUpdateSelectedIndex = false;
		}.bind(this));

	}, {
		set value(value){
			var selectOptions = this._list.value;
			var oldValue = this._value;
			// remove the option for the oldValue if it is not in options
			if (this.options && !this.options.has(oldValue)){
				selectOptions.pop(); // remove from the end
			}

			this._value = value;
			// add an option if the value is not already in options
			if (!this.options || !this.options.has(value)){
				selectOptions.add(value); // add it to the end
			}
			// update domNode selectedIndex
			if (!this._preventUpdateSelectedIndex){
				this.domNode.selectedIndex = selectOptions.indexOf(value);
			}
		},
		get value(){
			return this._value;
		},
		set options(options){
			this._options = options;
			// reset _selectOptions
			this._updateSelectOptions(0, this._list.value.length, options);
			// start observing
			this.cancelOptionsObserving && this.cancelOptionsObserving();
			this.cancelOptionsObserving = options && options.addRangeChangeListener(function(added, removed, position){
				this._updateSelectOptions(position, removed.length, added);
			}.bind(this));
		},
		get options(){
			return this._options;
		},
		_updateSelectOptions: function(index, remove, added){
			var selectOptions = this._list.value;
			// update _selectOptions
			selectOptions.swap(index, remove, added);
			// add current value if necessary
			if (! selectOptions.has(this.value)){
				selectOptions.add(this.value);
			}
			// update domNode
			this.domNode.selectedIndex = selectOptions.indexOf(this.value);
		},
		destroy: function(){
			bindings.cancelBindings(this);
			this.cancelOptionsObserving && this.cancelOptionsObserving();
			this._list.destroy();
		}
	});
});