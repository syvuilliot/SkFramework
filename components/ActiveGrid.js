define([
	'ksf/utils/constructor',
	"./List",
	"./ActiveList",
	"frb/bind",
	'frb/bindings',
	'ksf/components/DomComponent',
	'ksf/component/placement/samples/DomInDom',
	'ksf/component/placement/samples/KsDomIn',
	"dojo/dom-class",
], function(
	ctr,
	List,
	ActiveList,
	bind,
	bindings,
	DomComponent,
	DomInDom,
	KsDomIn,
	domClass
){

	var BodyCell = ctr(function BodyCell(item, column){
		this.domNode = document.createElement("td");
		this.item = item;
		this.column = column;
		this._content = column.factory.create(item);
		this.placer = column.placer || new DomInDom();
		this.placer.put(this._content, this.domNode);
	},  {

		destroy: function(){
			this.placer.remove(this._content, this.domNode);
			this.column.factory.destroy(this.item, this.content);
		},
	});

	var BodyRow = ctr(function BodyRow(item){
		this.domNode = document.createElement("tr");
		this._cells = new List({
			domNode : this.domNode,
			factory: {
				create: function (column) {
					var cell = new BodyCell(item, column);
					return cell;
				},
				destroy: function(column, cell){
					cell.destroy();
				},
			},
			placer: new KsDomIn(new DomInDom()),
		});
		bindings.defineBinding(this._cells, "value", {source: this, "<-": "columns"});
	}, {
		destroy: function(){
			bindings.cancelBinding(this._cells, "value");
			this._cells.destroy();
		}
	});

	var Body = ctr(function Body() {
		this.domNode = document.createElement("tbody");
		this._rows = new ActiveList({
			domNode : this.domNode,
			factory: {
				create: function (item) {
					var row = new BodyRow(item);
					bindings.defineBinding(row, "columns", {"<-": "columns", source: this});
					return row;
				}.bind(this),
				destroy: function(item, row){
					bindings.cancelBinding(row, "columns");
				},
			},
			placer: new KsDomIn(new DomInDom()),
			activeListener:	{
				add: function(row, cb){
					row.domNode.addEventListener("click", cb);
				},
				remove: function(row, cb){
					row.domNode.removeEventListener("click", cb);
				},
			},
			activeSetter: {
				set: function(row){
					domClass.add(row.domNode, "active");
				},
				unset: function(row, returned){
					domClass.remove(row.domNode, "active");
				},
			},

		});
		bindings.defineBindings(this._rows, {
			"value": {"<-": "value", source: this},
			"activeItem": {"<->": "activeItem", source: this},
		});
	}, {
		destroy: function(){
			bindings.cancelBinding(this._rows, "value");
			this._rows.destroy();
		},
	});

	var Head = ctr(function(){
		this.domNode = document.createElement("thead");
		this.tr = document.createElement("tr");
		this.domNode.appendChild(this.tr);
		this._cells = new List({
			domNode : this.tr,
			factory: {
				create: function (column) {
					var cell = document.createElement("th");
					cell.innerHTML = column;
					return cell;
				},
				destroy: function(column, cell){
				},
			},
		});
		bindings.defineBinding(this._cells, "value", {source: this, "<-": "columns"});
	}, {
		destroy: function(){
			bindings.cancelBinding(this._cells, "value");
			this._cells.destroy();
		},
	});

	return ctr(DomComponent, function Table(args) {
		DomComponent.apply(this, arguments);
		// init values
		this.value = args && args.value;
		this.columns = args && args.columns;

		//register components
		this._factory.addEach({
			"head": function(){return args && args.header || new Head();},
			"body": function(){return args && args.body || new Body();},
		});

		//bind components
		this._bindings.addEach([
			["head", function(head){
				return [
					bind(head, "columns", {source: this, "<-": "columns.map{header}"}),
				];
			}.bind(this)],
			["body", function(body){
				return [
					bind(body, "value", {source: this,	"<-": "value"}),
					bind(body, "columns", {source: this, "<-": "columns.map{body}"}),
					bind(body, "activeItem", {source: this, "<->": "activeItem"}),
				];
			}.bind(this)],
		]);

		//place components views
		this._placement.set([
			"head",
			"body",
			// "footer"
		]);

	}, {
		_domTag: "table",
		destroy: function(){
			// TODO: call this._components.deleteAll() that call "destroy" on components
			this._components.get("head").destroy();
			this._components.get("body").destroy();
		}
	});
});