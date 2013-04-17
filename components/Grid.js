define([
	'ksf/utils/constructor',
	"frb/bind",
	'frb/bindings',
	'ksf/utils/binding',
	"./CollectionRenderer",
	'ksf/component/DomComponent',
], function(
	ctr,
	bind,
	bindings,
	binding,
	CollectionRenderer,
	DomComponent
){

	var BodyCell = ctr(function(itemRef, configLine){
		this.domNode = document.createElement("td");
		this._renderer = configLine.renderer;
		this._cmp = this._renderer.create(itemRef.value, itemRef);
		this._renderer.place(this._cmp, this.domNode);
	},  {
		destroy: function(){
			this._renderer.unplace(this._cmp, this.domNode);
			this._renderer.destroy(this._cmp);
		},
	});

	var BodyRow = ctr(function BodyRow(itemRef){
		this.domNode = document.createElement("tr");
		this.itemRef = itemRef;
		this._cells = [];
		this._observeConfig = new binding.ReactiveMapping(this, this, {
			sourceProp: "config",
			addMethod: "_add",
			removeMethod: "_remove",
		});
	}, {
		_add: function(configLine, index){
			var cell = new BodyCell(this.itemRef, configLine);
			this._cells.splice(index, 0, cell);
			this.domNode.insertBefore(cell.domNode, this.domNode.children[index]);
		},
		_remove: function(configLine, index){
			var cell = this._cells.splice(index, 1)[0];
			this.domNode.removeChild(cell.domNode);
			cell.destroy();
		},
		destroy: function(){
			this._observeConfig.remove();
			while(this._cells.length){
				this._remove(undefined, 0);
			}
		},
/*		constructor: function(){
			this.own(on(this.domNode, "click", function(){
				this.emit("selected");
			}.bind(this)));
		},
*/	});

	var Body = ctr(function Body() {
		this.domNode = document.createElement("tbody");
		this._rows = [];
		this._observeItems = new binding.ReactiveMapping(this, this, {
			sourceProp: "items",
			addMethod: "_add",
			removeMethod: "_remove",
		});
	}, {
		_add: function(item, index, ref){
			var row = new BodyRow(ref);
			this._rows.splice(index, 0, row);
			bindings.defineBinding(row, "config", {
				"<-": "config",
				source: this,
			});
			this.domNode.insertBefore(row.domNode, this.domNode.children[index]);
		},
		_remove: function(item, index){
			var row = this._rows.splice(index, 1)[0];
			bindings.cancelBinding(row, "config");
			this.domNode.removeChild(row.domNode);
			row.destroy();
		},
		destroy: function(){
			this._observeItems.remove();
			this.items && this.items.forEach(this._remove, this);
		},
	});

/*select: function(value){
	var row;
	switch (typeof value){
		// search by index
		case "number":
			row = this._componentsCollection[value];
			break;
		// if object is a known row component
		case "object":
			if (this._componentsCollection.has(value)) {
				row = value;
				break;
			}
		// else try to find the value in the values collection
		default:
			var index = this.get(this.collectionProperty).indexOf(value);
			// if nothing is found, row is set to undefined whiwh equivalent to selected nothing
			row = index >= 0 ? this._componentsCollection[index] : undefined;
	}
	var oldSelectedRow = this.get("selectedRow");
	oldSelectedRow && put(oldSelectedRow.domNode, "!selected"); // remove selected class on old selected row
	this.set("selectedRow", row ? row : undefined);
	row && put(row.domNode, ".selected");
	// console.log("selected row", this.get("selectedRow"));
	this.set("selected", row ? row.get("value") : undefined);
	// console.log("selected value", this.get("selected"));
	this.set("selectedIndex", row ? this._componentsCollection.indexOf(row) : -1);
	// console.log("selected index", this.get("selectedIndex"));
}
*/
	var Head = function(){
		var thead = document.createElement("thead");
		var tr = document.createElement("tr");
		thead.appendChild(tr);
		return {
			domNode: thead,
			add: function(configLine, index){
				var th = document.createElement("th");
				th.innerHTML = configLine.title;
				tr.insertBefore(th, tr.children[index]);
			},
			remove: function(configLine, index){
				tr.removeChild(tr.children[index]);
			}
		};
	};

	return ctr(DomComponent, function Table() {
		DomComponent.apply(this, arguments);
		//register components
		this._factory.addEach({
			"head":  Head,
			"body": function(){return new Body();},
		});

		//bind components
		this._bindings.addEach([
			["head", function(head){
				// return bind(head, "collection", {source: this, "<-": "config"});
				return new binding.ReactiveMapping(this, head, {sourceProp: "config"});
			}.bind(this)],
			["body", function(body){
				return [
					// new binding.ReactiveMapping(this, body, {sourceProp: "value"}),
					bind(body, "items", {source: this,	"<-": "value"}),
					bind(body, "config", {source: this, "<-": "config"}),
					bind(body, "activeRow", {source: this,	"<->": "activeRow"}),
					// bind(body, "selection", {source: this,"<->": "selection"}),
				];
			}.bind(this)],
		]);

		//place components views
		this._placement.set([
			"head",
			"body",
		]);
	}, {
		_domTag: "table",
		destroy: function(){
			// TODO: call this._components.deleteAll() that call "destroy" on components
			this._components.get("headRow").destroy();
			this._components.get("body").destroy();
		}
	});
});