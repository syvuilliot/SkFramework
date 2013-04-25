define([
	'teststack!object',	'teststack/chai!assert',
	"../Grid",
	"frb/bind",
	"frb/observe",
	"collections/sorted-array",
	"ksf/utils/frb-dom",
], function(
	registerSuite, assert,
	Grid,
	bind,
	observe,
	SortedArray
){
	// create css rules
	var css = document.createElement("style");
	css.type = "text/css";
	document.head.appendChild(css);
	css.sheet.insertRule('.active { background-color: red; }', css.sheet.cssRules.length);
	css.sheet.insertRule('.selected { background-color: blue; }', css.sheet.cssRules.length);


	var syv = window.syv = {name: "Sylvain", age: 31, sexe: "M"};
	var aur = window.aur = {name: "Aurélie", age: 30, sexe:"F"};
	var ant = window.ant = {name: "Antonin", age: 2, sexe:"M"};
	var leo = window.leo = {name: "Léonie", age: 1, sexe:"F"};
	var collection = window.collection = [syv, aur, ant];

	var grid = window.grid = new Grid({});
	document.body.appendChild(grid.domNode);

	grid.value = collection;

	var InputRenderer = function(prop){
		return {
			create: function(item){
				var cmp = document.createElement("input");
				cmp.destroy = bind(cmp, "value", {
					"<->": prop,
					source: item,
				});
				return cmp;
			},
			destroy: function(item, cmp){
				cmp.destroy();
			},
		};
	};

	var columns = window.columns = [{
		header: "Nom",
		body: {
			factory : InputRenderer("name"),
		}
	}, {
		header: "Age",
		body: {
			factory : InputRenderer("age"),
		}
	}];

	grid.columns = columns;

	// add column
	columns.push({header: "Sexe", body: {
		factory: InputRenderer("sexe"),
	}});

	// add row
	collection.push(leo);

	// sort collection
	// collection.reverse();

	// sort columns
	// config.reverse();

	// select via a click

	// select programatically

	// observe activeItem
	observe(grid, "activeItem", function(item){
		console.log("active item changed to", item.name);
	});
	observe(grid, "activeItemIndex", function(index){
		console.log("active item index changed to", index);
	});

});