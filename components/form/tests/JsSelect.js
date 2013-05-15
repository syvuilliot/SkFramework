define([
	'intern!object',	'intern/chai!assert',
	"../JsSelect",
	"collections/listen/property-changes",
	"dojo/on",
], function(
	registerSuite, assert,
	Select,
	PropertyChanges,
	on
){
	var syv = window.syv = {id: "syv", name: "Sylvain", age: 31, sexe: "M"};
	var aur = window.aur = {id: "aur", name: "Aurélie", age: 30, sexe:"F"};
	var ant = window.ant = {id: "ant", name: "Antonin", age: 2, sexe:"M"};
	var leo = window.leo = {id: "leo", name: "Léonie", age: 1, sexe:"F"};
	var toto = window.toto = {id: "toto"};
	var collection = window.collection = [];

	registerSuite({
		beforeEach: function(){
			collection = [syv, aur, ant];
		},
		"all args at creation": function(){

			var select = window.select = new Select({
				labelProp: "name",
				options: collection,
				value: aur,
			});
			document.body.appendChild(select.domNode);

			assert.equal(select.value, aur);
			assert.equal(select.domNode.value, aur.name);
		},
		"no args at creation": function(){
			var select = window.select = new Select({
				labelProp: "name",
			});
			document.body.appendChild(select.domNode);

			var observerCalled = false;
			PropertyChanges.addOwnPropertyChangeListener(select, "value", function(value){
				assert.equal(value, aur);
				observerCalled = true;

			});

			select.options = collection;
			select.value = aur;

			assert.equal(select.value, aur);
			assert.equal(select.domNode.value, aur.name);
			assert(observerCalled);
		},

		"keep value undefined when changing options": function(){
			var select = window.select = new Select({
				labelProp: "name",
			});
			document.body.appendChild(select.domNode);
			select.options = collection;

			assert.equal(select.value, undefined);
			assert.equal(select.domNode.value, "");
		},

		"keep value selected when changing options": function(){
			var select = window.select = new Select({
				labelProp: "name",
			});
			document.body.appendChild(select.domNode);
			select.options = collection;
			select.value = aur;
			select.options = [leo, ant, aur];

			assert.equal(select.value, aur);
			assert.equal(select.domNode.value, aur.name);
		},

		"user triggered change": function(){
			var select = window.select = new Select({
				labelProp: "name",
			});
			document.body.appendChild(select.domNode);
			select.options = collection;

			assert.equal(select.value, undefined);
			assert.equal(select.domNode.value, "");

			var observerCalled = false;
			PropertyChanges.addOwnPropertyChangeListener(select, "value", function(value){
				assert.equal(value, aur);
				observerCalled = true;
			});

			select.domNode.selectedIndex = 1;
			on.emit(select.domNode, "change", {
				bubbles: true,
				cancelable: true
			});

			assert.equal(select.value, aur);
			assert.equal(select.domNode.value, aur.name);
		},

	});


});