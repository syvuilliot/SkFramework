define([
	'intern!object',	'intern/chai!assert',
	"../Select",
	"collections/listen/property-changes",
	"dojo/on",
	"collections/set",
	"frb/bind",
], function(
	registerSuite, assert,
	Select,
	PropertyChanges,
	on,
	Set,
	bind
){
	var syv = window.syv = {id: "syv", name: "Sylvain", age: 31, sexe: "M"};
	var aur = window.aur = {id: "aur", name: "Aurélie", age: 30, sexe:"F"};
	var ant = window.ant = {id: "ant", name: "Antonin", age: 2, sexe:"M"};
	var leo = window.leo = {id: "leo", name: "Léonie", age: 1, sexe:"F"};
	var toto = window.toto = {id: "toto"};
	var collection = window.collection = [];
	var select;

	var assertChildrenTextEqual = function(el, textList){
		var childrenTextList = [];
		for (var i = 0; i < el.children.length; i++){
			childrenTextList[i] = el.children[i].text;
		}
		assert.deepEqual(childrenTextList, textList);

	};

	registerSuite({
		beforeEach: function(){
			collection = [syv, aur, ant];
			select = new Select({
				labelProp: "name",
			});
		},
		"all args at creation": function(){
			select = window.select = new Select({
				labelProp: "name",
				options: collection,
				value: aur,
			});
			document.body.appendChild(select.domNode);

			assert.equal(select.value, aur);
			assert.equal(select.domNode.value, aur.name);
			assertChildrenTextEqual(select.domNode, collection.map(function(item){
				return item.name;
			}));
		},
		"only options at creation": function(){
			select = window.select = new Select({
				labelProp: "name",
				options: collection,
			});
			document.body.appendChild(select.domNode);

			assert.equal(select.value, undefined);
			assert.equal(select.domNode.value, "");
			assertChildrenTextEqual(select.domNode, collection.map(function(item){
				return item.name;
			}).concat(""));
		},
		"only value at creation": function(){
			select = window.select = new Select({
				labelProp: "name",
				value: aur,
			});
			document.body.appendChild(select.domNode);

			assert.equal(select.value, aur);
			assert.equal(select.domNode.value, aur.name);
			assertChildrenTextEqual(select.domNode, [aur.name]);
		},
		"no arg at creation": function(){
			var select = window.select = new Select({
				labelProp: "name",
			});
			document.body.appendChild(select.domNode);

			assert.equal(select.value, undefined);
			assert.equal(select.domNode.value, "");
			assertChildrenTextEqual(select.domNode, [""]);
		},
		"keep value undefined when changing options": function(){
			document.body.appendChild(select.domNode);
			select.options = collection;

			assert.equal(select.value, undefined);
			assert.equal(select.domNode.value, "");
			assertChildrenTextEqual(select.domNode, collection.map(function(item){
				return item.name;
			}).concat(""));
		},
		"set options before value": function(){
			document.body.appendChild(select.domNode);

			var observedValue;
			var observedCount = 0;
			PropertyChanges.addOwnPropertyChangeListener(select, "value", function(value){
				observedValue = value;
				observedCount++;
			});

			select.options = collection;
			assert.equal(observedCount, 0);

			select.value = aur;
			assert.equal(select.value, aur);
			assert.equal(select.domNode.value, aur.name);
			assert.equal(observedValue, aur);
			assert.equal(observedCount, 1);
			assertChildrenTextEqual(select.domNode, collection.map(function(item){
				return item.name;
			}));
		},
		"set value before options": function(){
			document.body.appendChild(select.domNode);

			var observedValue;
			var observedCount = 0;
			PropertyChanges.addOwnPropertyChangeListener(select, "value", function(value){
				observedValue = value;
				observedCount++;
			});

			select.value = aur;
			assert.equal(select.value, aur);
			assert.equal(select.domNode.value, aur.name);
			assert.equal(observedValue, aur);
			assert.equal(observedCount, 1);

			observedValue = undefined;
			observedCount = 0;
			select.options = collection;
			assert.equal(select.value, aur);
			assert.equal(select.domNode.value, aur.name);
			assert.equal(observedValue, undefined);
			assert.equal(observedCount, 0);
			assertChildrenTextEqual(select.domNode, collection.map(function(item){
				return item.name;
			}));
		},

		"user triggered change": function(){
			select.options = collection;

			var observedValue;
			var observedCount = 0;
			PropertyChanges.addOwnPropertyChangeListener(select, "value", function(value){
				observedValue = value;
				observedCount++;
			});

			// simulate a user change
			select.domNode.selectedIndex = 1;
			on.emit(select.domNode, "change", {
				bubbles: true,
				cancelable: true
			});

			assert.equal(select.value, aur);
			assert.equal(select.domNode.value, aur.name);
			assert.equal(observedValue, aur);
			assert.equal(observedCount, 1);
			assertChildrenTextEqual(select.domNode, collection.map(function(item){
				return item.name;
			}));
		},

		"remove the selected value from collection": function(){
			select = new Select({
				labelProp: "name",
				options: collection,
				value: aur,
			});
			document.body.appendChild(select.domNode);

			var observedValue;
			var observedCount = 0;
			PropertyChanges.addOwnPropertyChangeListener(select, "value", function(value){
				observedValue = value;
				observedCount++;
			});

			collection.delete(aur);

			assert.equal(select.value, aur);
			assert.equal(select.domNode.value, aur.name);
			assert.equal(observedValue, undefined);
			assert.equal(observedCount, 0);
			assertChildrenTextEqual(select.domNode, collection.map(function(item){
				return item.name;
			}).concat(aur.name));
		},

		"remove the selected value from collection and add other items": function(){
			select = new Select({
				labelProp: "name",
				options: collection,
				value: aur,
			});
			document.body.appendChild(select.domNode);

			collection.delete(aur);
			collection.add(leo);
			collection.delete(syv);

			assert.equal(select.value, aur);
			assert.equal(select.domNode.value, aur.name);
			assertChildrenTextEqual(select.domNode, collection.map(function(item){
				return item.name;
			}).concat(aur.name));
		},
		"remove the selected value from collection then select another one": function(){
			select = new Select({
				labelProp: "name",
				options: collection,
				value: aur,
			});
			document.body.appendChild(select.domNode);

			var observedValue;
			var observedCount = 0;
			PropertyChanges.addOwnPropertyChangeListener(select, "value", function(value){
				observedValue = value;
				observedCount++;
			});

			collection.delete(aur);
			// simulate a user change
			select.domNode.selectedIndex = 1;
			on.emit(select.domNode, "change", {
				bubbles: true,
				cancelable: true
			});

			assert.equal(select.value, ant);
			assert.equal(select.domNode.value, ant.name);
			assert.equal(observedValue, ant);
			assert.equal(observedCount, 1);
			assertChildrenTextEqual(select.domNode, collection.map(function(item){
				return item.name;
			}));
		},

	});


});