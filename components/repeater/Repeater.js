define([
	'ksf/utils/constructor',
	'frb/observe',

], function(
	ctr,
	observe
){

	var creator = function(value){
		var div = document.createElement("div");
		div.innerHTML = value;
		return div;
	};
	var destructor = function(cmp){
		cmp.destroy && cmp.destroy();
	};
	var placer = function(cmp, container, index){
		container.insertBefore(cmp, container.children[index]);
	};
	var unplacer = function(cmp, container){
		container.removeChild(cmp);
	};


	return ctr(function Repeater(args){
		this.domNode = document.createElement(args && args.domTag || "div");
		this._create = args && args.create || creator;
		this._destroy = args && args.destroy || destructor;
		this._place = args && args.place || placer;
		this._unplace = args && args.unplace || unplacer;
		this._components = [];
		this.collection = args && args.collection;

		var rangeChangeListener = function (added, removed, position) {
			var cmp;
			// console.log("rangeChangeListener arguments", arguments);
			removed.forEach(function(){
				cmp = this._components.splice(position, 1)[0];
				this._unplace(cmp, this.domNode, position);
				this._destroy(cmp);
			}, this);
			added.forEach(function(value, index){
				cmp = this._create(value);
				this._components.splice(position+index, 0, cmp);
				this._place(cmp, this.domNode, position+index);
			}, this);
		}.bind(this);

		this._cancelCollectionObserving = observe(this, "collection", function (collection) {
			this._rangeChangeCanceler && this._rangeChangeCanceler(); // cancel previous collection change listener
			// destroy components from previous collection
			rangeChangeListener([], this._components, 0);
			// start observing new collection
			this._rangeChangeCanceler = collection.addRangeChangeListener(rangeChangeListener);
			rangeChangeListener(collection, [], 0);
		}.bind(this));
	}, {
		destroy: function(){
			this._cancelCollectionObserving();
			this._rangeChangeCanceler && this._rangeChangeCanceler();
		},
	});

});