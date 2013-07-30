define([
	'intern!object',
	'intern/chai!assert',
	'../Bindable',
	'../ObservableObject',
], function(
	registerSuite,
	assert,
	Bindable,
	ObservableObject
){
	var collection;
	var cbCalledCount, cb2CalledCount;
	var cancelerCalledCount, canceler2CalledCount;
	var cmp1, cmp2, cmp3;

	registerSuite({
		name: "when",
		beforeEach: function(){
			collection = new ObservableObject();
			cbCalledCount = cb2CalledCount = 0;
			cancelerCalledCount = canceler2CalledCount = 0;
			cmp1 = {name: "cmp1"};
			cmp2 = {name: "cmp2"};
			cmp3 = {name: "cmp3"};
		},
		"only one key": function(){
			collection.when("cmp1", function(c1){
				assert.equal(c1, cmp1);
				assert.equal(this, collection);
				cbCalledCount++;
				return function() {
					cancelerCalledCount++;
				};
			});
			assert.equal(cbCalledCount, 0);
			assert.equal(cancelerCalledCount, 0);

			collection.set("cmp1", cmp1);
			assert.equal(cbCalledCount, 1);
			assert.equal(cancelerCalledCount, 0);

			collection.remove("cmp1");
			assert.equal(cbCalledCount, 1);
			assert.equal(cancelerCalledCount, 1);

		},
		"two keys": function(){
			collection.when("cmp1", "cmp2", function(c1, c2){
				assert.equal(c1, cmp1);
				assert.equal(c2, cmp2);
				assert.equal(this, collection);
				cbCalledCount++;
				return function() {
					cancelerCalledCount++;
				};
			});
			assert.equal(cbCalledCount, 0);
			assert.equal(cancelerCalledCount, 0);

			collection.set("cmp1", cmp1);
			assert.equal(cbCalledCount, 0);
			assert.equal(cancelerCalledCount, 0);

			collection.set("cmp2", cmp2);
			assert.equal(cbCalledCount, 1);
			assert.equal(cancelerCalledCount, 0);

			collection.remove("cmp1");
			assert.equal(cbCalledCount, 1);
			assert.equal(cancelerCalledCount, 1);

			collection.remove("cmp2");
			assert.equal(cbCalledCount, 1);
			assert.equal(cancelerCalledCount, 1);
		},
		"canceler": function(){
			var canceler = collection.when("cmp1", "cmp2", function(c1, c2){
				cbCalledCount++;
			});
			canceler();
			collection.setEach({
				'cmp1': cmp1,
				'cmp2': cmp2,
			});
			assert.equal(cbCalledCount, 0);
		},
		"cb called only once on setEach": function() {
			collection.set("cmp1", "initCmp1");
			collection.when("cmp1", "cmp2", function(c1, c2){
				// console.log(c1, c2);
				cbCalledCount++;
			});
			collection.set('cmp2', 'intiCmp2');
			assert.equal(cbCalledCount, 1);

			collection.setEach({
				'cmp1': cmp2,
				'cmp2': cmp3,
			});
			assert.equal(cbCalledCount, 2);

		},
		"multi cb": function() {
			collection.when("cmp1", "cmp2", [
				function(c1, c2){
					cbCalledCount++;
					return function() {
						cancelerCalledCount++;
					};
				},
				function(c1, c2){
					cb2CalledCount++;
					return function() {
						canceler2CalledCount++;
					};
				},
			]);

			collection.setEach({
				'cmp1': cmp2,
				'cmp2': cmp3,
			});
			assert.equal(cbCalledCount, 1);
			assert.equal(cb2CalledCount, 1);

			collection.remove("cmp1");
			assert.equal(cancelerCalledCount, 1);
			assert.equal(canceler2CalledCount, 1);
		},
	});

});