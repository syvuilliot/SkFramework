define([
	'teststack!object',
	'teststack/chai!assert',
	'../binding',
], function(
	registerSuite,
	assert,
	binding
) {

	registerSuite({
		name : "reactiveMapping",
		"basic": function(){
			function assertSynced(){
				source.forEach(function(value, index){
					assert(target.values[index] === value+"bis");
				});
			}

			var source = ["a", "b", "c"];
			var target = window.target = {
				values: [],
				add: function(value, index){
					this.values.splice(index, 0, value+"bis");
				},
				remove: function(value, index){
					var mappedValue = this.values.splice(index, 1);
					assert(mappedValue[0] === value+"bis");
				},
			};
			var handler = new binding.ReactiveMapping(source, target);
			assertSynced();
			source.push("d");
			assertSynced();
			source.pop();
			assertSynced();
			source.splice(1, 2, "f", "g");
			assertSynced();
			source.clear();
			assertSynced();
			handler.remove();
			source.push("e");
			assert(source.length === target.values.length + 1);
		},
		"source property path": function(){
			function assertSynced(){
				source.collectionWrapper.collection.forEach(function(value, index){
					assert(target.values[index] === value+"bis");
				});
			}

			var source = {
				collectionWrapper: {
					collection : ["a", "b", "c"]
				}
			};
			var target = window.target = {
				values: [],
				add: function(value, index){
					this.values.splice(index, 0, value+"bis");
				},
				remove: function(value, index){
					this.values.splice(index, 1);
				},
			};
			var handler = new binding.ReactiveMapping(source, target, {
				sourceProp: "collectionWrapper.collection",
			});
			assertSynced();
			source.collectionWrapper = {
				collection: ["un"],
			};
			assertSynced();
			source.collectionWrapper.collection = [];
			assert.equal(target.values.length, 0);
		},
		"other method names": function(){
			function assertSynced(){
				source.forEach(function(value, index){
					assert(target.values[index] === value+"bis");
				});
			}

			var source = ["a", "b", "c"];
			var target = window.target = {
				values: [],
				addValue: function(value, index){
					this.values.splice(index, 0, value+"bis");
				},
				removeValue: function(value, index){
					this.values.splice(index, 1);
				},
			};
			var handler = new binding.ReactiveMapping(source, target, {
				addMethod: "addValue",
				removeMethod: "removeValue",
			});
			assertSynced();
			source.push("d");
			assertSynced();
			source.pop();
			assertSynced();
		},
		"row argument": function(){
			function assertSynced(){
				source.forEach(function(value, index){
					var mappedValue = target.mapped[index];
					assert(mappedValue.value === value);
					assert(mappedValue.index === index);
				});
			}

			var source = ["a", "b", "c"];
			var target = window.target = {
				mapped: [],
				add: function(value, index, row){
					this.mapped.splice(index, 0, row);
				},
				remove: function(value, index, row){
					this.mapped.splice(index, 1);
				},
			};
			var handler = new binding.ReactiveMapping(source, target);
			assertSynced();
			source.push("d");
			assertSynced();
			source.pop();
			assertSynced();
			source.splice(1, 2, "f", "g");
			assertSynced();
			source.clear();
			assertSynced();
			handler.remove();
			source.push("e");
			assert(source.length === target.mapped.length + 1);
		}

	});

});