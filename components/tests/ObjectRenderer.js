define([
	'intern!object',	'intern/chai!assert',
	"../ObjectRenderer",
	"frb/bindings",
	"dojo/on",
	"ksf/utils/frb-dom"
], function(
	registerSuite,
	assert,
	ObjectRenderer,
	bindings,
	on
){

	var personRenderer = window.personRenderer = new ObjectRenderer({
		container: document.createElement("ul"),
	});
	document.body.appendChild(personRenderer.container);
	var personRendererComponents = personRenderer._renderer._components;
	var personRendererDomChildren = personRenderer.container.children;


	var syv = window.syv = {name: "Sylvain", age: "31", sexe: "M", address: {street: "République", city: "Choisy"}};
	var aur = window.aur = {name: "Aurélie", age: "30", sexe:"F", address: {street: "République", city: "Choisy le roi"}};

	function assertComponentUpdated (){
		//check that _components is updated
		console.assert(config.length === personRendererComponents.length);
		config.forEach(function(configLine, index){
			//check that the component value is the corresponding value property
			console.assert(personRendererComponents[index][configLine.renderer.property] === personRenderer.item[configLine.property]);
		});
	}

	var liRenderer = {
		create: function(value){
			return document.createElement("li");
		},
		destroy: function(cmp){
			cmp.innerHTML="destroyed";
		},
		place: function(cmp, container, index){
			container.insertBefore(cmp, container.children[index]);
		},
		unplace: function(cmp, container){
			container.removeChild(cmp);
		},
		property: "innerHTML",
		setSize: function(cmp, hauteur, largeur){

		},
		setSelected: function(cmp, selected){
			if (selected){
				// cmp.style...
			} else {
				// cmp.style...
			}
		}
	};

	var config = window.config = [
		{property: "name", renderer: liRenderer},
		{property: "age", renderer: liRenderer},
	];

	// set a config
	personRenderer.config = config;
	personRenderer.item = syv;
	assertComponentUpdated();


	// change a value in config
	console.assert(typeof Object.getOwnPropertyDescriptor(syv, "age").set === "function", "The binding on value property is not set");
	config.set(1, {property: "sexe", renderer: liRenderer});
	assertComponentUpdated();
	//check that the binding on value property is canceled
	console.assert(Object.getOwnPropertyDescriptor(syv, "age").set === undefined, "The binding on value property is not canceled");



	// remove and insert many values in collection
	config.splice(1, 2, {property: "age", renderer: liRenderer}, {property: "sexe", renderer: liRenderer});
	assertComponentUpdated();

	//reverse config
	config.reverse();
	assertComponentUpdated();

	//change value
	personRenderer.item = aur;
	assertComponentUpdated();
	console.assert(Object.getOwnPropertyDescriptor(syv, "age").set === undefined, "The binding on value property is not canceled");
	console.assert(Object.getOwnPropertyDescriptor(syv, "name").set === undefined, "The binding on value property is not canceled");
	console.assert(Object.getOwnPropertyDescriptor(syv, "sexe").set === undefined, "The binding on value property is not canceled");

	// remove one value at the beginning of the config
	//check that the corresponding component has been destroyed
	var c = personRenderer._renderer._components[0];
	config.shift();
	assertComponentUpdated();
	console.assert(c.innerHTML === "destroyed");

	//remove many values from the collection
	config.splice(1, 3);
	assertComponentUpdated();

	//set an empty config
	config=[];
	personRenderer.config = config;
	assertComponentUpdated();

	// set a new non empty config in the personRenderer
	config = [
		{property: "name", renderer: liRenderer},
		{property: "age", renderer: liRenderer},
	];
	personRenderer.config = config;
	assertComponentUpdated();



	//destroy personRenderer
	personRenderer.destroy();
	//check that the value binding is canceled
	//certainly not the best way, but I check that the setter installed by frb is well removed
	console.assert(Object.getOwnPropertyDescriptor(personRenderer._configRenderer, "item").set === undefined);


	// config with constructor and arguments

/*	Input = declare(DomComponent, {
		domTag: "input",
		constructor: function(){
			this._cancelValueBinding = bind(this, "domNode.value", {"<->": "_presenter.value"});
		},
		destroy: function(){
			this._cancelValueBinding();
			this.inherited(arguments);
		},
	});
	NumberInput = declare(Input, {
		domAttrs: {
			type: "number",
		},
		constructor: function(){
			this._cancelValueBinding();//cancel binding from Input
			this._cancelValueBinding = bind(this, "+domNode.value", {"<->": "_presenter.value"});//coerce to number
		},
	});
*/
	personRenderer = new ObjectRenderer({
		container: document.createElement("div"),
	});
	document.body.appendChild(personRenderer.container);

	var inputRenderer = function(type){
		return {
			create: function(value){
				var input = document.createElement("input");
				input.type = type;
				return input;
			},
			destroy: function(cmp){
				cmp.value = "destroyed";
			},
			place: function(cmp, container, index){
				container.insertBefore(cmp, container.children[index]);
			},
			unplace: function(cmp, container){
				container.removeChild(cmp);
			},
			property: "value",
		};
	};

	config = [{
		property: "name",
		renderer: inputRenderer("text"),
	}, {
		property: "age",
		renderer: inputRenderer("number"),
	}];
	personRenderer.config = config;
	personRenderer.item = syv;

	personRendererComponents = personRenderer._renderer._components;
	personRendererDomChildren = personRenderer.container.children;


	//check that initial config is well rendered
	assertComponentUpdated();

	// add and remove values in config
	config.splice(1,2, {
		property: "sexe",
		renderer: inputRenderer("text"),
	}, {
		property: "age",
		renderer: inputRenderer("number"),
	});
	assertComponentUpdated();

	//use nested property
	config.push({
		property: "address.city",
		renderer: inputRenderer("text"),
	});
	console.assert(personRenderer._renderer._components[3].value === "Choisy");
	config.pop();

	// change the value
	personRenderer.item = aur;
	assertComponentUpdated();

	//change value property
	aur.age = "35";
	assertComponentUpdated();

	// simulate a change from user
	var input = personRenderer._renderer._components[0];
	input.value = "Aurélie Vuilliot";
	on.emit(input, "change", {});
	assertComponentUpdated();
	console.assert(aur.name === "Aurélie Vuilliot");

});