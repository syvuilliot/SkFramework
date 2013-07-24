define([
	'compose',
	'ksf/utils/Evented',
	'ksf/utils/Observable',
	'ksf/utils/Bindable',
	'ksf/utils/Destroyable',
	'ksf/collections/GenericList',
	'ksf/utils/IndexedSet',

], function(
	compose,
	Evented,
	Observable,
	Bindable,
	Destroyable,
	GenericList,
	IndexedSet

){
	var List = compose(
		Evented,
		Observable,
		Bindable,
		Destroyable,
		GenericList,

		function(args){
			this._store = [];
			this.length = 0;
			this._changing = 0;
		},
		{
			add: function(value, index){
				this._startChanges();
				if (isNaN(Number(index))) { index = this._store.length;} // append by default
				this._store.splice(index, 0, value);
				this._pushChanges([{type: "add", value: value, index: index}]);
				this._stopChanges();
			},
			remove: function(index){
				this._startChanges();
				var value = this._store.splice(index, 1);
				this._pushChanges([{type: "remove", value: value[0], index: index || 0}]);
				this._stopChanges();
			},
			get: function(index){
				return this._store[index];
			},
			indexOf: function(value){
				return this._store.indexOf(value);
			},
			forEach: function(){
				return this._store.forEach.apply(this._store, arguments);
			},
			map: function(){
				var mappedList = new this.constructor();
				mappedList.addEach(this._store.map.apply(this._store, arguments));
				return mappedList;
			},
			filter: function(){
				var filteredList = new this.constructor();
				filteredList.addEach(this._store.filter.apply(this._store, arguments));
				return filteredList;
			},
			reduce: function(){
				return this._store.reduce.apply(this._store, arguments);
			},
			sorted: function(compare){
				var sortedList = new this.constructor();
				sortedList.addEach(this._store.slice().sort(compare));
				return sortedList;
			},
			toArray: function(){
				return this._store.slice();
			},
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

			// same as setContentIncrementalMap but also update target
			// same as setContentIncremental but map each item from source with "mapCb" AND observe each item (if possible) to map it whenever it changes
			// this is to get the same reasult as "setContentR(source.onEach().map(source.map(mapCb)))"
			setContentIncrementalMapReactive: function(source, mapCb){
				var target = this;
				var reactToItemChange = function(item, index){
					var canceler = item && item.asReactive && item.asStream("changed")
						.map(item)
						.map(mapCb)
						.skipDuplicates()
						.onValue(function(mappedItem) {
								target.set(observers.indexOf(canceler), mappedItem);
						});
					return canceler;
				};

				this.setContent(source.map(mapCb));
				// start observing each item from source
				var observers = new List();
				observers.addEach(source.map(reactToItemChange));

				return this.updateContentR(source.asStream("changes").map(function(changes){
					// create and cancel observers when items are added/removed from source
					changes.forEach(function(change){
						if (change.type === "add"){
							observers.add(reactToItemChange(change.value, change.index), change.index);
						} else if (change.type === "remove"){
							var canceler = observers.get(change.index);
							if (typeof canceler === "function") {canceler();}
							observers.remove(change.index);
						}
					});
					return changes.map(function(change){
						return {
							type: change.type,
							index: change.index,
							value: mapCb(change.value),
						};
					});
				}));
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
	return List;
});