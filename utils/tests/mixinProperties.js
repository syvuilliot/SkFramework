define([
	'teststack!object',
	'teststack/chai!assert',
	'../mixinProperties',
], function(
	registerSuite,
	assert,
	mixin
) {

	var target, simpleliteralObject, literalObjectWithAccessors, valueDescriptors, accessorDescriptors;
	var propDesc = Object.getOwnPropertyDescriptor;

	registerSuite({
		name : "mixinProperties",
		beforeEach : function() {
			target = {name: "toto"};
			simpleliteralObject = {age: 3, friend: "titi", cool: true, address: {city: "Choisy"}};
			literalObjectWithAccessors = {
				get job(){return "student";},
			};
			valueDescriptors = {
				dog: {
					value: "medor",
					enumerable: true,
				}
			};
			accessorDescriptors = {
				color: {
					get: function(){return "red";}
				}
			};

		},
		"simpleliteralObject": function(){
			mixin(target, simpleliteralObject);
			assert.deepEqual(propDesc(target, "age"), propDesc(simpleliteralObject, "age"));
			assert.equal(target.address.city, "Choisy");
		},
		"literalObjectWithAccessors": function(){
			mixin(target, literalObjectWithAccessors);
			assert.deepEqual(propDesc(target, "job"), propDesc(literalObjectWithAccessors, "job"));
			assert.equal(target.job, "student");
		},
		"valueDescriptors": function(){
			mixin(target, valueDescriptors);
			assert.deepEqual(propDesc(target, "dog"), {value: "medor", writable: false, enumerable: true, configurable: false});
			assert.equal(target.dog, "medor");
		},
		"accessorDescriptors": function(){
			mixin(target, accessorDescriptors);
			assert.deepEqual(propDesc(target, "color"), {
				enumerable: false,
				configurable: false,
				get: accessorDescriptors.color.get,
				set: undefined,
			});
			assert.equal(target.color, "red");
		},
		"multi sources": function(){
			mixin(target, simpleliteralObject, literalObjectWithAccessors, valueDescriptors, accessorDescriptors);
			assert.equal(target.age, 3);
			assert.equal(target.address.city, "Choisy");
			assert.equal(target.job, "student");
			assert.equal(target.dog, "medor");
			assert.equal(target.color, "red");
		},

	});

});