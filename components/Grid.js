define([
	'ksf/utils/constructor',
	"dojo/dom-class",
	"frb/bind",
	'frb/bindings',
	'ksf/utils/binding',
	'ksf/component/DomComponent',
], function(
	ctr,
	domClass,
	bind,
	bindings,
	binding,
	DomComponent
){

	var BodyCell = ctr(function(itemRef, configLine){
		this.domNode = document.createElement("td");
		this.item = itemRef;
		this.columnConfig = configLine;
		this._renderer = configLine.renderer;
		this._cmp = this._renderer.create(itemRef.value, this);
		this._renderer.place(this._cmp, this.domNode);
	},  {

		destroy: function(){
			this._renderer.unplace(this._cmp, this.domNode);
			this._renderer.destroy(this._cmp, this);
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
			this.config && this.config.forEach(function(config){
				this._remove(config, 0);
			}.bind(this));
		},
		active: function(){
			domClass.add(this.domNode, "active");
		},
		unactive: function(){
			domClass.remove(this.domNode, "active");
		},
	});

	var Body = ctr(function Body() {
		this.domNode = document.createElement("tbody");
		this._rows = [];
		this._observeItems = new binding.ReactiveMapping(this, this, {
			sourceProp: "items",
			addMethod: "_add",
			removeMethod: "_remove",
		});
		this._activeRow = undefined;
		bindings.defineBinding(this, "activeRow", {
			"<->": "activeItem",
			convert: function(item){
				// console.log("convert called with", item);
				return this.items && this._rows[this.items.indexOf(item)];
			},
			revert: function(row){
				// console.log("revert called with", row);
				return row && row.itemRef.value;
			},
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
			row.clickHandler = function(){
				this._rowClicked(row);
			}.bind(this);
			row.domNode.addEventListener("click", row.clickHandler);
		},
		_remove: function(item, index){
			var row = this._rows.splice(index, 1)[0];
			if (row === this._activeRow){
				this.activeRow = undefined;
			}
			bindings.cancelBinding(row, "config");
			this.domNode.removeChild(row.domNode);
			row.domNode.removeEventListener("click", row.clickHandler);
			row.destroy();
		},
		destroy: function(){
			this._observeItems.remove();
			bindings.cancelBinding(this, "activeRow");
			this.items && this.items.forEach(this._remove, this);
		},
		activeRow: {
			set : function(row){
				// unactive current activeRow
				this._activeRow && this._activeRow.unactive();
				// active new row
				if (row){
					this._activeRow = row;
					this._activeRow.active();
				}
			},
			get : function(){
				return this._activeRow;
			},
			configurable: true,
			enumerable: true,
		},
		_rowClicked: function(row){
			this.activeRow = row;
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
	var Head = ctr(function(){
		this.domNode = document.createElement("thead");
		this.tr = document.createElement("tr");
		this.domNode.appendChild(this.tr);
		this._observeConfig = new binding.ReactiveMapping(this, this, {
			sourceProp: "config",
			addMethod: "_add",
			removeMethod: "_remove",
		});
	}, {
		_add: function(configLine, index){
			var th = document.createElement("th");
			this.tr.insertBefore(th, this.tr.children[index]);
			if (configLine.title){
				th.innerHTML = configLine.title;
			} else {
				configLine.header.create(th);
				th.clickHandler = function(){
					this.activeSorter(configLine.header);
				}.bind(this);
				th.addEventListener("click", th.clickHandler);
			}
		},
		_remove: function(configLine, index){
			var th = this.tr.removeChild(this.tr.children[index]);
			th.removeEventListener("click", th.clickHandler);
			if (configLine.header === this._activeSorter){
				this.activeSorter(undefined);
			}
			if (configLine.header){
				configLine.header.destroy();
			}
		},
		activeSorter: function(sorter){
			if (sorter === this._activeSorter){
				sorter.sort();
			} else {
				this._activeSorter && this._activeSorter.unsort();
				sorter && sorter.sort();
				this._activeSorter = sorter;
			}
		},
		destroy: function(){
			this._observeConfig.remove();
			this.config && this.config.forEach(function(config){
				this._remove(config, 0);
			}.bind(this));
		},
	});

	return ctr(DomComponent, function Table() {
		DomComponent.apply(this, arguments);
		//register components
		this._factory.addEach({
			"head": function(){return new Head();},
			"body": function(){return new Body();},
		});

		//bind components
		this._bindings.addEach([
			["head", function(head){
				// return bind(head, "collection", {source: this, "<-": "config"});
				return [
					bind(head, "config", {source: this, "<-": "config"}),
					bind(head, "sortingColumn", {"<->": "sortingColumn", source: this}),
				];
			}.bind(this)],
			["body", function(body){
				return [
					// new binding.ReactiveMapping(this, body, {sourceProp: "value"}),
					bind(body, "items", {source: this,	"<-": "value"}),
					bind(body, "config", {source: this, "<-": "config"}),
					bind(body, "activeItem", {source: this,	"<->": "activeItem"}),
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