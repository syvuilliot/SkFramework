define([
	'compose',
	'ksf/collections/List',
	'ksf/utils/IndexedSet',

], function(
	compose,
	List,
	IndexedSet

){
	var OrderableSet = compose(
		List,
		{
			// don't allow adding the same value twice
			add: function(value, index){
				if (this.has(value)){
					throw "A value cannot be added twice";
				} else {
					List.prototype.add.apply(this, arguments);
				}
			},

			// same as setContentIncremental but map each item from source with "mapFunction"
			// and destroy the result of "mapFunction" when the corresponding item is removed from source
			setContentIncrementalMap: function(source, mapFunction){
				this.setContent(source.map(mapFunction));
				return this.updateContentR(source.asStream("changes").map(function(changes){

					// keep a temporary cache of mapFunction results to reuse them instead of always creating new results
					// this is useful when the result of mapFunction is a domComponent for example, so that we don't destroy it when the corresponding item is only moved
					var mappedValues = new IndexedSet();

					return changes.map(function(change, i){
						var mappedValue;
						if (change.type === "remove"){
							mappedValue = this.get(change.index);
							mappedValues.add(mappedValue, change.value);
						} else if (change.type === "add") {
							if (mappedValues.hasKey(change.value)){
								mappedValue = mappedValues.get(change.value);
								mappedValues.remove(mappedValue);
							} else {
								mappedValue = mapFunction(change.value);
							}
						}
						return {
							type: change.type,
							index: change.index,
							value: mappedValue,
						};
					}, this);
				}.bind(this)));
			},
			setContentIncrementalMapReactive: function(source, mapStream){
				var cancelers = new Map();
				var target = this;

				function processChanges (changes) {
					changes.forEach(function(change) {
						if (change.type === 'add') {
							var reactiveItem = mapStream(change.value);
							// insert in target list
							reactiveItem.take(1).onValue(function(value) {
								target.set(change.index, value);
							});
							// observe changes on source item
							cancelers.add(reactiveItem.changes().onValue(function(value) {
								target.updateContent([{
									type: 'remove',
									index: source.indexOf(change.value)
								}, {
									type: 'add',
									index: source.indexOf(change.value),
									value: value
								}]);
							}), change.value);
						} else if (change.type === "remove") {
							// cancel observation of source item
							cancelers.get(change.value)();
							cancelers.remove(change.value);
							target.remove(change.index);
						}
					});
				}

				// clear current items
				processChanges(this.map(function(item, index) {
					return {
						type: 'remove',
						index: index,
						value: item
					};
				}));
				// initialize
				processChanges(source.map(function(item, index) {
					return {
						type: 'add',
						index: index,
						value: item
					};
				}));

				source.asStream("changes").onValue(processChanges);
			},
			setContentIncrementalFilter: function(source, filterCb){
					var pass, i;
					var target = this;
					var reactToItemChange = function(item, index){
							var canceler = item && item.asReactive && item.asStream("changed").onValue(function(){
									var sourceIndex = observers.indexOf(canceler);
									var passed = filterResult.get(sourceIndex);
									var pass = filterCb(item);
									if (pass !== passed){
											filterResult.set(sourceIndex, pass);
											if (pass){
													target.add(item, sourceToTargetIndex(sourceIndex));
											} else {
													target.remove(sourceToTargetIndex(sourceIndex));
											}
									}
							});
							return canceler;
					};

					var filterResult = new List();
					filterResult.addEach(source.map(filterCb));
					var sourceToTargetIndex = function(sourceIndex){
							var targetIndex = 0;
							for (i = 0; i < sourceIndex; i++){
									if (filterResult.get(i)){targetIndex++;}
							}
							return targetIndex;
					};

					this.setContent(source.filter(filterCb));
					// start observing each item from source
					var observers = new List();
					observers.addEach(source.map(reactToItemChange));

					return source.asStream("changes").onValue(function(changes){
							target._startChanges();
							changes.forEach(function(change){
									if (change.type === "add"){
										pass = filterCb(change.value);
											filterResult.add(pass, change.index);
											if (pass){
													target.add(change.value, sourceToTargetIndex(change.index));
											}
											// start observing item
											observers.add(reactToItemChange(change.value, change.index), change.index);
									} else if (change.type === "remove"){
											pass = filterResult.get(change.index);
											if (pass){
													target.remove(sourceToTargetIndex(change.index));
											}
											filterResult.remove(change.index);
											// stop observing item
											var canceler = observers.get(change.index);
											if (typeof canceler === "function") {canceler();}
											observers.remove(change.index);

									}
							});
							target._stopChanges();
					});
			},

		}
	);

	return OrderableSet;
});