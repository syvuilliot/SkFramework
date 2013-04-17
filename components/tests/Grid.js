define([
	'teststack!object',	'teststack/chai!assert',
	"../Grid",
	"frb/bind",
	"ksf/utils/frb-dom",
], function(
	registerSuite, assert,
	Grid,
	bind
){

	var grid = window.grid = new Grid({
	});
	document.body.appendChild(grid.domNode);

	var syv = window.syv = {name: "Sylvain", age: 31, sexe: "M"};
	var aur = window.aur = {name: "Aurélie", age: 30, sexe:"F"};
	var ant = window.ant = {name: "Antonin", age: 2, sexe:"M"};
	var leo = window.leo = {name: "Léonie", age: 0, sexe:"F"};
	var collection = window.collection = [syv, aur, ant];


	grid.value = collection;

	var DivRenderer = function(prop){
		var cancel;
		return {
			create: function(item){
				var cmp = document.createElement("input");
				cancel = bind(cmp, "value", {
					"<->": prop,
					source: item,
				});
				return cmp;
			},
			destroy: function(){
				cancel();
			},
			place: function(input, td){
				td.appendChild(input);
			},
			unplace: function(input, td){
				td.removeChild(input);
			},
		};
	};
	var DeleteButton = function(collection){
		var cb;
		return {
			create: function(item, itemRef){
				var button = document.createElement("button");
				button.innerHTML = "X";
				cb = function(){
					collection.splice(itemRef.index, 1);
				};
				button.addEventListener("click", cb);
				return button;
			},
			destroy: function (button) {
				button.removeEventListener("click", cb);
			},
			place: function(el, td){
				td.appendChild(el);
			},
			unplace: function(el, td){
				td.removeChild(el);
			},
		};
	};
	var MoveButton = function(collection, direction){
		var cb;
		return {
			create: function(item, itemRef){
				var button = document.createElement("button");
				button.innerHTML = (direction === 1 ? "v" : "^");
				cb = function(){
					var index = itemRef.index;
					collection.splice(index, 1);
					collection.splice(index+direction, 0, item);
				};
				button.addEventListener("click", cb);
				return button;
			},
			destroy: function (button) {
				button.removeEventListener("click", cb);
			},
			place: function(el, td){
				td.appendChild(el);
			},
			unplace: function(el, td){
				td.removeChild(el);
			},
		};
	};
	var ActionButtons = function(collection){
		var del = DeleteButton(collection);
		var up = MoveButton(collection, -1);
		var down = MoveButton(collection, 1);
		return {
			create: function(item, itemRef){
				return [
					del.create(item, itemRef),
					up.create(item, itemRef),
					down.create(item, itemRef),
				];
			},
			destroy: function (buttons) {
				del.destroy(buttons[0]);
				up.destroy(buttons[1]);
				down.destroy(buttons[2]);
			},
			place: function(buttons, td){
				buttons.forEach(td.appendChild, td);
			},
			unplace: function(buttons, td){
				buttons.forEach(td.removeChild, td);
			},
		};
	};

	var config = window.config = [
		{title: "Nom", renderer: DivRenderer("name")},
		{title: "Sexe", renderer: DivRenderer("sexe")},
		{title: "Actions", renderer: ActionButtons(collection)},
	];
	grid.config = config;

	// add column
	// config.push({label: "Age", property: "age"});

	// add row
	collection.push(leo);

	// sort collection
	// collection.reverse();

	// sort columns
	// config.reverse();

	// select via a click

	// select programatically

});