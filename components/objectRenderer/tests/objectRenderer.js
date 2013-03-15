define([
	"../ObjectRenderer",
	"dojo/_base/declare",
	"../../../component/DomComponent",
	"frb/bind",
	"dojo/on",
	"frb/dom"
], function(ObjectRenderer, declare, DomComponent, bind, on){

	window.personRenderer = new ObjectRenderer({
		domTag: "ul",
		componentConstructorArguments: {domTag: "li"},
	});
	document.body.appendChild(personRenderer.domNode);
	personRenderer.set('inDom');
	window.personRendererComponentsCollection = personRenderer._componentsCollection;
	window.personRendererComponents = personRenderer._registeredComponents;
	window.personRendererDomChildren = personRenderer.domNode.children;

	syv = {name: "Sylvain", age: 31, sexe: "M", address: {street: "République", city: "Choisy"}};
	aur = {name: "Aurélie", age: 30, sexe:"F", address: {street: "République", city: "Choisy"}};

	function assertComponentAndDomUpdated (){
		//check that _components is updated
		assertComponentUpdated();
		//check that domChildren is updated
		console.assert(config.length === personRendererDomChildren.length, "config and dom children have not the same length");
		config.forEach(function(value, index){
			console.assert(personRendererDomChildren[index].innerHTML === personRenderer.get("value")[value.property]+"", "config and dom have not the same value", value);
		});
	}
	function assertComponentUpdated (){
		//check that _components is updated
		console.assert(config.length === Object.keys(personRendererComponents).length);
		//check that _componentsCollection is updated
		console.assert(config.length === personRendererComponentsCollection.length);
		config.forEach(function(value, index){
			//check that the component value is the corresponding value property
			console.assert(personRendererComponentsCollection[index].get("value") === personRenderer.get("value")[value.property]);
			//and that the component is well registered (an id is retruned)
			console.assert(typeof personRenderer._getComponentId(personRendererComponentsCollection[index])==="string");
		});
	}

	config = [
		{property: "name"},
		{property: "age"},
	];
	// set a config with default constructor
	personRenderer.set("config", config);
	personRenderer.set("value", syv);
	assertComponentAndDomUpdated();


	// change a value in config
	console.assert(typeof Object.getOwnPropertyDescriptor(syv, "age").set === "function", "The binding on value property is not set");
	config.set(1, {property: "sexe"});
	assertComponentAndDomUpdated();
	//check that the binding on value property is canceled
	console.assert(Object.getOwnPropertyDescriptor(syv, "age").set === undefined, "The binding on value property is not canceled");



	// remove and insert many values in collection
	config.splice(1, 2, {property: "age"}, {property: "sexe"});
	assertComponentAndDomUpdated();

	//reverse config
	config.reverse();
	assertComponentAndDomUpdated();

	//change value
	personRenderer.set("value", aur);
	assertComponentAndDomUpdated();
	console.assert(Object.getOwnPropertyDescriptor(syv, "age").set === undefined, "The binding on value property is not canceled");
	console.assert(Object.getOwnPropertyDescriptor(syv, "name").set === undefined, "The binding on value property is not canceled");
	console.assert(Object.getOwnPropertyDescriptor(syv, "sexe").set === undefined, "The binding on value property is not canceled");

	// remove one value at the beginning of the config
	//check that the corresponding component internal binding is canceled (destroy is well done)
	var c = personRenderer._componentsCollection[0];
	config.shift();
	assertComponentAndDomUpdated();
	console.assert(Object.getOwnPropertyDescriptor(c._presenter, "value").set === undefined);

	//remove many values from the collection
	config.splice(1, 3);
	assertComponentAndDomUpdated();

	//set an empty config
	config=[];
	personRenderer.set("config", config);
	assertComponentAndDomUpdated();

	// set a new non empty config in the personRenderer
	config = [
		{property: "name"},
		{property: "age"},
	];
	personRenderer.set("config", config);
	assertComponentAndDomUpdated();



	//destroy personRenderer
	personRenderer.destroy();
	//check that the value binding is canceled
	//certainly not the best way, but I check that the setter installed by frb is well removed
	console.assert(Object.getOwnPropertyDescriptor(personRenderer._presenter, "value").set === undefined);


	// config with constructor and arguments

	Input = declare(DomComponent, {
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

	window.personRenderer = new ObjectRenderer();
	document.body.appendChild(personRenderer.render());
	personRenderer.set('inDom');
	config = [
		{property: "name", componentConstructor: Input},
		{property: "age", componentConstructor: NumberInput},
	];
	personRenderer.set("config", config);
	personRenderer.set("value", syv);

	window.personRendererComponentsCollection = personRenderer._componentsCollection;
	window.personRendererComponents = personRenderer._components;
	window.personRendererDomChildren = personRenderer.domNode.children;

	function assertComponentAndDomInputUpdated (){
		//check that _components is updated
		assertComponentUpdated();
		//check that domChildren is updated
		console.assert(config.length === personRendererDomChildren.length, "config and dom children have not the same length");
		config.forEach(function(value, index){
			console.assert(personRendererDomChildren[index].value === personRenderer.get("value")[value.property]+"", "config and dom have not the same value", value);
		});
	}

	//check that initial config is well rendered
	assertComponentAndDomInputUpdated();

	// add and remove values in config
	config.splice(1,2, {property: "age", componentConstructor: NumberInput}, {property: "sexe", componentConstructor: Input});
	assertComponentAndDomInputUpdated();

	//use nested property
	config.push({property: "address.city", componentConstructor: Input});
	console.assert(personRenderer._componentsCollection[3].domNode.value === "Choisy");
	config.splice(3,1);

	// change the value
	personRenderer.set("value", aur);
	assertComponentAndDomInputUpdated();

	//change value property
	aur.age = 35
	assertComponentAndDomInputUpdated();

	// simulate a change from user
	window.input = personRenderer._componentsCollection[0].domNode
	input.value = "Aurélie Vuilliot";
	on.emit(input, "change", {});
	assertComponentAndDomInputUpdated();
	console.assert(aur.name === "Aurélie Vuilliot");

});