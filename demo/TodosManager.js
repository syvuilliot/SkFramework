define([
  'compose/compose',
  'collections/map',
  'collections/set',
  'collections/list',
  'collections/sorted-array',
  'ksf/utils/Evented',
  'bacon.js/Bacon',
  'ksf/utils/Destroyable',
  'ksf/utils/WithGetSet',
  'ksf/utils/Observable',
  'ksf/utils/Bindable',
  'ksf/utils/ObservableObject',
  'ksf/components/HtmlElement',
  'ksf/component/CompositeDomComponent',
  'ksf/dom/WithOrderedContent',


  'collections/shim-array',
  'collections/listen/array-changes',
], function(
    compose,
    Map,
    Set,
    List,
    SortedArray,
    Evented,
    Bacon,
    Destroyable,
    WithGetSet,
    Observable,
    Bindable,
    ObservableObject,
    HtmlElement,
    CompositeDomComponent,
    WithOrderedContentForHtmlElement
  ){




  var WithEmittingChangedForHtmlElement = function(){
    // listen to dom "change" event to emit ks standardised "changed" event
    this.get('domNode').addEventListener("change", function(){
      this._emit("changed");
    }.bind(this));
  };
  var WithEmittingSubmitForHtmlForm = function(){
    this.get('domNode').addEventListener("submit", function(ev){
      ev.preventDefault();
      this._emit("submit");
    }.bind(this));
  };
  var WithEmittingSubmitForHtmlButton = function(){
    this.get('domNode').addEventListener("click", function(ev){
      this._emit("submit");
    }.bind(this));
  };



// ------------ APP ----------------

  var Todo = compose(
    ObservableObject,
    function(args){
      this.set("text", args.text);
      this.set("done", args.done);
    },
    {
      _doneSetter: function(done){
        this._Setter('done', !!done);
      }
    }
  );
  var not = function(fun){
    return function(item){
      return !fun(item);
    };
  };
  var itemIn = function(collection){
    return function(item){
      return collection.has(item);
    };
  };

  var ReactiveSet = compose(
          Set,
          Evented,
          Observable,
          Bindable,
          function(){
              this.addRangeChangeListener(function(added, removed){
                  var addChanges = added.map(function(item){
                      return {
                          type: "add",
                          value: item,
                      };
                  });
                  var removeChanges = removed.map(function(item){
                      return {
                          type: "remove",
                          value: item,
                      };
                  });
                  var changes = removeChanges.concat(addChanges);
                  this._changesQueue = this._changesQueue ? this._changesQueue.concat(changes) : changes;
                  if (! this._changing){
                      this._emit("changes", this._changesQueue);
                      delete this._changesQueue;
                      this._emit("changed");
                  }
              });
          }, {
              watchDiff: function(startSet){
                  startSet = startSet || new Set();
                  return this.asReactive().map(".clone", 1).diff(startSet, function(oldSet, newSet){
                      // console.log("oldSet", oldSet.toArray());
                      // console.log("newSet", newSet.toArray());
                      return {
                          added: newSet.difference(oldSet),
                          removed: oldSet.difference(newSet),
                      };
                  });
              },
          }, {
              addEach: function(values){
                  this._startChanges();
                  Set.prototype.addEach.call(this, values);
                  this._stopChanges();
              },
              _startChanges: function(){
                  this._changing = true;
              },
              _stopChanges: function(){
                  this._changing = false;
                  this._emit("changes", this._changesQueue);
                  delete this._changesQueue;
                  this._emit("changed");
              },
          }
      );
  var ReactiveMap = window.ReactiveMap = compose(
          Map,
          Evented,
          Observable,
          Bindable,
          function(){
              this.addMapChangeListener(function(value, key){
                  if (! this._changing){
                      this._emit("changed");
                  }
              }.bind(this));
          }, {
              _startChanges: function(){
                  this._changing = true;
              },
              _stopChanges: function(){
                  this._changing = false;
                  this._emit("changed");
              },
          }
      );

  var ReactiveList = window.ReactiveList = compose(
    function(args){
      this._store = [];
      this.length = 0;
      this._changing = 0;
    },
    {
      _startChanges: function(){
        this._changing++;
      },
      _stopChanges: function(){
        this._changing--;
        if (! this._changing){
          this.length = this._store.length;
          this._emit("changes", this._changesQueue || []);
          delete this._changesQueue;
          this._emit("changed");
        }
      },
      _pushChanges: function(changes){
        this._changesQueue = this._changesQueue ? this._changesQueue.concat(changes) : changes;
      },
      add: function(value, index){
        this._startChanges();
        if (isNaN(Number(index))) { index = this._store.length;} // append by default
        this._store.splice(index, 0, value);
        this._pushChanges([{type: "add", value: value, index: index}]);
        this._stopChanges();
      },
      addEach: function(values, index){
        this._startChanges();
        values.forEach(function(value, key){
          this.add(value, index+key);
        }, this);
        this._stopChanges();
      },
      set: function(index, value){
        this._startChanges();
        this.remove(index);
        this.add(value, index);
        this._stopChanges();
      },
      remove: function(index){
        this._startChanges();
        var value = this._store.splice(index, 1);
        this._pushChanges([{type: "remove", value: value[0], index: index || 0}]);
        this._stopChanges();
      },
      removeEach: function(indexes){
        this._startChanges();
        indexes.forEach(this.remove, this);
        this._stopChanges();
      },
      removeRange: function(index, length){
        this._startChanges();
        for (var i = index; i < length; i++){
          this.remove(i);
        }
        this._stopChanges();
      },
      clear: function(){
        this._startChanges();
        for (var i = this.length; i > 0 ; i--){
          this.remove(0);
        }
        this._stopChanges();
      },
      // replace the current values by the new ones
      setContent: function(values){
        this._startChanges();
        this.clear();
        this.addEach(values);
        this._stopChanges();
      },
      // replace content of this every time a new collection is pushed by the stream
      setContentR: function(valuesStream){
        return this.own(this.onValue(this, "setContent"));
      },
      // apply changes to current content
      updateContent: function(changes){
        this._startChanges();
        changes.forEach(function(change){
          if (change.type === "add"){
            this.add(change.value, change.index);
          }
          if (change.type === "remove"){
            this.remove(change.index);
          }
        }, this);
        this._stopChanges();
      },
      // update content of this with changes from stream
      // store handler, to call it on destroy
      updateContentR: function(changesStream){
        return this.own(changesStream.onValue(this, "updateContent"));
      },
      // replace content of this with items from source and keep updating it incrementally
      setContentIncremental: function(source){
        this.setContent(source);
        return this.updateContentR(source.asStream("changes"));
      },
      // same as setContentIncremental but map each item from source with "mapFunction"
      // and destroy the result of "mapFunction" when the corresponding item is removed from source
      // warning: only working for list of unique values
      setContentIncrementalMap: function(source, mapFunction){
        this.setContent(source.map(mapFunction));
        return this.updateContentR(source.asStream("changes").map(function(changes){

          var mappedValues = new Map();

          return changes.map(function(change){
            if (change.type === "remove"){
              mappedValues.set(change.value, this.get(change.index));
            }
            var mappedValue = mappedValues.has(change.value) ? mappedValues.get(change.value) : mapFunction(change.value);
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
                  index: source.find(change.value)
                }, {
                  type: 'add',
                  index: source.find(change.value),
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
                target.set(observers.find(canceler), mappedItem);
            });
          return canceler;
        };

        this.setContent(source.map(mapCb));
        // start observing each item from source
        var observers = new ReactiveList();
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
                  var sourceIndex = observers.find(canceler);
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

          var filterResult = new ReactiveList();
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
          var observers = new ReactiveList();
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
      move: function(from, to){
        this._startChanges();
        var value = this.get(from);
        this.remove(from);
        this.add(value, to);
        this._stopChanges();
      },
      get: function(index){
        return this._store[index];
      },
      has: function(value){
        return this.find(value) !== -1;
      },
      find: function(value){
        return this._store.indexOf(value);
      },
      forEach: function(){
        return this._store.forEach.apply(this._store, arguments);
      },
      map: function(){
        var mappedList = new ReactiveList();
        mappedList.addEach(this._store.map.apply(this._store, arguments));
        return mappedList;
      },
      filter: function(){
        var filteredList = new ReactiveList();
        filteredList.addEach(this._store.filter.apply(this._store, arguments));
        return filteredList;
      },
      reduce: function(){
        return this._store.reduce.apply(this._store, arguments);
      },
      clone: function(){
        return this.map(function(a){
          return a;
        });
      },
      sorted: function(compare){
        var sortedList = new ReactiveList();
        sortedList.addEach(this._store.slice().sort(compare));
        return sortedList;
      },
      concat: function(list){
        var output = new ReactiveList();
        output.addEach(this);
        output.addEach(list);
        return output;
      },
      toArray: function(){
        return this._store.slice();
      },

    },
    Evented,
    Observable,
    Bindable,
    Destroyable
  );

      var reactiveList = window.reactiveList = new ReactiveList();
      reactiveList.asReactive().map(".map", function(item){
          return item.get("text");
      }).log("source list");
      reactiveList.addEach([new Todo({text:"a", done:true}), new Todo({text:"b"}), new Todo({text:"c", done:true})]);

      var reactiveListClone = window.reactiveListClone = new ReactiveList();
      reactiveListClone.asReactive().map("._store").log("reactiveListClone");
      reactiveListClone.setContentIncrementalMapReactive(reactiveList, function(item){
          return item.getR("text");
      });
/*
      var reactiveListFiltered = window.reactiveListFiltered = new ReactiveList();
      reactiveListFiltered.asReactive().map("._store.map", function(item){
          return item.get("text");
      }).log("reactiveListFiltered");
      reactiveListFiltered.setContentIncrementalFilter(reactiveList, function(item){
          return item.get("done");
      });
  */
  /*  window.sortedArray = new SortedArray([
          {text: "z"},
          {text: "a"},
          {text: "b"},
      ], function(a, b){
          return Object.equals(a.text, b.text);
      }, function(a, b){
          return Object.compare(a.text, b.text);
      });
  */
  /*
      var ReactiveOrderedList = window.ReactiveOrderedList = compose(
          function(args){
              this._store = new SortedArray(null, function(a, b){
                  return Object.equals(a.get(args.prop), b.get(args.prop));
              }, function(a, b){
                  return Object.compare(a.get(args.prop), b.get(args.prop));
              });
              this.length = 0;
              this._changing = 0;
              this._observedProp = args.prop;
              this._propObservers = new Map();
          },
          {
              _startChanges: function(){
                  this._changing++;
              },
              _stopChanges: function(){
                  this._changing--;
                  if (! this._changing){
                      this.length = this._store.length;
                      this._emit("changes", this._changesQueue || []);
                      delete this._changesQueue;
                      this._emit("changed");
                  }
              },
              _pushChanges: function(changes){
                  this._changesQueue = this._changesQueue ? this._changesQueue.concat(changes) : changes;
              },
              add: function(value){
                  this._startChanges();
                  this._store.add(value);
                  this._pushChanges([{type: "add", value: value, index: this._store.indexOf(value)}]);
                  this._stopChanges();
                  // start observing value property
                  var canceler = value.asStream("changed").
                      map(".get", this._observedProp).
                      skipDuplicates().
                      onValue(function(){
                          this._replaceValue(value);
                      }.bind(this));
                  this._propObservers.set(value, canceler);
              },
              _replaceValue: function(value){
                  var from = this.find(value);
                  this._startChanges();
                  this.remove(from);
                  this.add(value);
                  this._stopChanges();
              },
              addEach: function(values){
                  this._startChanges();
                  values.forEach(this.add, this);
                  this._stopChanges();
              },
              remove: function(index){
                  this._startChanges();
                  var value = this._store.splice(index, 1)[0];
                  this._propObservers.get(value)(); // stop listening value property changes
                  this._pushChanges([{type: "remove", value: value, index: index || 0}]);
                  this._stopChanges();
              },
              removeEach: function(indexes){
                  this._startChanges();
                  indexes.forEach(this.remove, this);
                  this._stopChanges();
              },
              removeRange: function(index, length){
                  this._startChanges();
                  for (var i = index; i < length; i++){
                      this.remove(i);
                  }
                  this._stopChanges();
              },
              clear: function(){
                  this._startChanges();
                  for (var i = this.length; i > 0 ; i--){
                      this.remove(0);
                  }
                  this._stopChanges();
              },
              // replace the current values by the new ones
              setContent: function(values){
                  this._startChanges();
                  this.clear();
                  this.addEach(values);
                  this._stopChanges();
              },
              // apply changes to current content
              updateContent: function(changes){
                  this._startChanges();
                  changes.forEach(function(change){
                      if (change.type === "add"){
                          this.add(change.value);
                      }
                      if (change.type === "remove"){
                          this.remove(this.find(change.value));
                      }
                  }, this);
                  this._stopChanges();
              },
              get: function(index){
                  return this._store[index];
              },
              has: function(value){
                  return this.find(value) !== -1;
              },
              find: function(value){
                  var index;
                  var found = this._store.some(function(item, key){
                      index = key;
                      return item === value;
                  });
                  return found ? index : -1;
              },
              forEach: function(){
                  return this._store.forEach.apply(this._store, arguments);
              },
              map: function(){
                  return this._store.map.apply(this._store, arguments);
              },
              filter: function(){
                  return this._store.filter.apply(this._store, arguments);
              },
          },
          Evented,
          Observable,
          Bindable
      );
  */
      // stream operand that create a stream that emits when source stream emits AND when the emited value emits a "changed"
      Bacon.Property.prototype.onChanged = function(){
        return this.flatMapLatest(function(value){
          return value && value.asReactive() || Bacon.constant(undefined);
        });
      };
      // stream operand that create a stream that emits when source stream emits AND when the emited value emits a "changed" AND when one of its item emits a "changed"
      Bacon.Property.prototype.onEach = function(){
        return this.onChanged()
          // on each change of "iterable" create a new stream that observes all current iterable
          .flatMapLatest(function(iterable){
            return iterable && Bacon.combineAsArray(iterable.map(function(item){
              return item.asReactive();
            }).toArray()).map(iterable) || Bacon.constant(undefined);
          });
        };

        var WithTodosForPresenter = function(args){
          this.toggleLive();

          var remainingTodo = function(todo){
            return !todo.get("done");
          };
          this.setR("remainingCount", this.getR("todos")
            .onEach()
            .map(".filter", remainingTodo)
            .map(".length")
            .skipDuplicates()
            );

          this.setR("stats", this.getR("remainingCount").combine(this.getR("todos", ".length").skipDuplicates(),
            function(remaining, total){
              return total ? remaining + " remaining todos out of " + total : "no todos";
            }
            ));

          this.todos = new ReactiveList();
          this.todos.name="unsorted";
          this.setR("sortedTodos", this.getR("todos").
            onEach().
            map(".sorted", function(a, b){
              return Object.compare(a.get("text"), b.get("text"));
            })
            );
          // demo data
          this.set("todos", [
            new Todo({text:'learn angular', done:true}),
            new Todo({text:'build an angular app', done:false}),
            new Todo({text:'faire les courses', done:true}),
            ]);


          // plusieurs options possibles pour écrire des 'computed properties'
  /*      this.setR("total", this.getR("qty").combine(this.getR("price"), function(qty, price){
              return qty && price ? qty * price : undefined;
          }));
  */
  /*      this.setR("total", Bacon.combineWith(function(qty, price){
              return qty && price ? qty * price : undefined;
          }, this.getR("qty"), this.getR("price")));
  */
  /*      this.when("qty", "price", function(qty, price){
              this.set("total", qty*price);
          });
  */
          // celles là sont juste des propositions (pas terribles) de syntaxes possibles
          // this.computeR("total", multiply, "qty", "price");
          // this.bindProp("total").to(this, ["qty", "price"], multiply);
        };
        WithTodosForPresenter.prototype = {
          _todoTextGetter: function() {
            return this._Getter('todoText') || "";
          },
          addTodo: function() {
            var todo = new Todo({text:this.get("todoText")});
            this.get("todos").add(todo);
            this.set("todoText", "");
          },
          removeTodo: function(todo){
            var todos = this.get("todos");
            todos.remove(todos.find(todo));
          },
          archive: function() {
            var todos = this.get("todos");
            var doneTodos = todos.filter(function(todo){
              return todo.get("done");
            });
            todos.deleteEach(doneTodos);
          },
          _todosSetter: function(todos){
            this.get("todos").setContent(todos);
          },
          _todosGetter: function(todos){
            return this.todos;
          },
          toggleLive: function(){
            var newState = !this.get("reactive");
            this.setEach({
              "reactive": newState,
              "liveButtonText": newState ? "Stop live" : "Start live",
            });
          },
          moveTodoDown: function(todo){
            var todos = this.get("todos");
            var todoIndex = todos.find(todo);
            todos.move(todoIndex, todoIndex === todos.length-1 ? 0 : todoIndex+1);
          },
          moveTodoUp: function(todo){
            var todos = this.get("todos");
            var todoIndex = todos.find(todo);
            todos.move(todoIndex, todoIndex === 0 ? todos.length-1 : todoIndex-1);
          },
  /*      sortTodosByText: function(){
              var sortedTodos = new ReactiveOrderedList({
                  prop: "text",
              });
              sortedTodos.setContent(this.get("todos"));
              // sortedTodos.updateContentR(this.get("todos").asStream("changes"));
              this.get("todos").asStream("changes").onValue(function(changes){
                  sortedTodos.updateContent(changes);
              });
              this.set("sortedTodos", sortedTodos);
          },
        */  };

      // mixin qui permet de réagir à la modification d'un Set de façon unitaire (ajout ou suppression d'un item à la fois)
      var WithSetObservingGenerator = function(args){
        var PROP = "value";
        var ADD_ITEM = "addItem";
        var REMOVE_ITEM = "removeItem";

        return function(){
          var oldValue;
          this.getR(PROP).flatMapLatest(function(value){
            var stream = value && value.watchDiff && value.watchDiff(oldValue) || Bacon.constant({
              removed: oldValue && oldValue.toArray && oldValue.toArray() || [],
              added: [],
            });
            oldValue = value;
            return stream;
          }).onValue(function(diff){
            diff.removed.forEach(this[REMOVE_ITEM], this);
            diff.added.forEach(this[ADD_ITEM], this);
          }.bind(this));
        };
      };


      // mixin qui permet de réagir à la modification d'un Set en une fois (ajout et suppression de plusieurs items)
      var WithSetBulkObservingGenerator = function(args){
        var PROP = "value";
        var SWAP_ITEMS = "swapItems";

        return function(){
          var oldValue;
          this.getR(PROP).flatMapLatest(function(value){
            var stream = value && value.watchDiff && value.watchDiff(oldValue) || Bacon.constant({
              removed: oldValue && oldValue.toArray && oldValue.toArray() || [],
              added: [],
            });
            oldValue = value;
            return stream;
          }).onValue(function(diff){
            this[SWAP_ITEMS](diff.added, diff.removed);
          }.bind(this));
        };
      };

      // mixin qui permet d'appeler une méthode avec une liste de changements issue des événements "changes" de la succession des objets observés sur une propriété de this
      var WithValueChangesObservingGenerator = function(args){
        var PROP = args && args.prop || "value";
        var PROCESS_CHANGES = args && args.method || "processChanges";

        return function(){
          var oldValue;
          this.getR(PROP).flatMapLatest(function(value){
            var oldItemsRemoves = oldValue && oldValue.map && oldValue.map(function(item){
              return {value: item, type: "remove", index: 0};
            }) || new ReactiveList();
            var newItemsAdds = value && value.map && value.map(function(item, index){
              return {value: item, type: "add", index: index};
            }) || new ReactiveList();
            var stream = value && value.asStream && value.asStream("changes").toProperty(oldItemsRemoves.concat(newItemsAdds)) || Bacon.constant(oldItemsRemoves);
            oldValue = value;
            return stream;
          }).onValue(function(changes){
            this[PROCESS_CHANGES](changes);
          }.bind(this));
        };
      };


      var SimpleContainer = compose(
        HtmlElement,
        WithOrderedContentForHtmlElement,
        {
          _contentSetter: function(cmps){
            WithOrderedContentForHtmlElement.prototype._contentSetter.call(this, cmps);
            this.updateRendering();
          },
        }
        );



      var ListContainer = compose(
        SimpleContainer,
        function(tag, args){
          this._factory = args.factory;
          this._cmps = new ReactiveList();
          var canceler;
          this.getR("value").onValue(function(value){
            canceler && canceler();
            if (value){
              canceler = this._cmps.setContentIncrementalMap(value, function(todo){
                return this._factory(todo);
              }.bind(this));
            }
          }.bind(this));

          this.setR("content", this._cmps.asReactive());
        },
        // WithValueChangesObservingGenerator({
        //   prop: "value",
        //   method: "_processValueChanges",
        // }),
        {
          _createComponentForItem: function(item){
            var cmp = this._factory(item);
            this._item2cmp.set(item, cmp);
          },
          _destroyComponentForItem: function(item){
            var cmp = this._item2cmp.get(item);
            this._item2cmp.delete(item);
            cmp.destroy && cmp.destroy();
          },
          _processValueChanges: function(changes){
            var cmps = this._cmps;
            var factory = this._factory;
            cmps._startChanges();
            changes.forEach(function(change){
              if (change.type === "add"){
                cmps.add(factory(change.value), change.index);
              } else if (change.type === "remove"){
                cmps.remove(change.index);
              }
            });
            cmps._stopChanges();
          },
        }, {
          destroy: function(){
            this.removeAllItems();
            HtmlElement.prototype.destroy.call();
          },
        }
        );

  var Button = compose(
    HtmlElement,
    WithEmittingSubmitForHtmlButton
    );


  var TodosManager = compose(
    CompositeDomComponent,
  /*      WithDeclarative.create({
              factories: {
                      presenter: function(){
                          return compose.create(Stateful, WithTodosForPresenter);
                      },
                      root: function(){
                          return new HtmlElement("div");
                      },
                      title: function(){
                          return new HtmlElement(
                             "h2", {
                              value: "Todos",
                          });
                      },
              },
              layouts: {
              }
          }),
  */      function(){
    var cmps = this._components;

    var presenter = window.presenter = compose.create(ObservableObject, Destroyable, WithTodosForPresenter);
    cmps.addEach({
      presenter: presenter,
    });

    cmps.factories.addEach({
      root: function(){
        return new SimpleContainer("div");
      },
      title: function(){
        return new HtmlElement(
         "h2", {
          innerHTML: "Todos",
        });
      },
      subTitle: function(){
        return new HtmlElement("span");
      },
      todoList: function(){
        return new ListContainer("ul", {
          factory: function(todo){
                              // ici on ne crée volontairement pas un composant composite qui encapsule ces sous-composants car on veut, par simplicité, que ces sous-composants appartiennent au todoManager (et pas à list).
                              // cela permet de binder directement les propriétés des composants au presenter de todoManager (comme dans l'exemple angularJS)
                              var container = new SimpleContainer("li");
                              var textDisplayer = new compose(HtmlElement, WithEmittingChangedForHtmlElement)("input");
                              var doneEditor = new compose(HtmlElement, WithEmittingChangedForHtmlElement)("input", { type: "checkbox"});
                              var deleteButton = new Button("button", { innerHTML: "X"});
                              var moveUpButton = new Button("button", { innerHTML: "^"});
                              var moveDownButton = new Button("button", { innerHTML: "v"});
                              // la question est de savoir comment les enregistrer dans le registre du todoManager... ou faut-il le déléguer à "list" ?
                              cmps.addEach([container, textDisplayer, doneEditor, moveUpButton, moveDownButton, deleteButton]);
                              container.set("content", [doneEditor, textDisplayer, moveUpButton, moveDownButton, deleteButton]);

                              // on enregistre les cancelers sur le container car on sait que c'est un destroyable et qu'il sera détruit lorsque la todo sortira de la liste
                              container.own(textDisplayer.bind("value", "<<->", todo, "text"));
                              container.own(doneEditor.bind("checked", "<<->", todo, "done"));
                              container.own(deleteButton.on("submit", function(){
                                presenter.removeTodo(todo);
                              }));
                              container.own(moveUpButton.on("submit", function(){
                                presenter.moveTodoUp(todo);
                              }));
                              container.own(moveDownButton.on("submit", function(){
                                presenter.moveTodoDown(todo);
                              }));
                              return container;
                            },
                          });
  },
  newTodoForm: function(){
                      return new compose(SimpleContainer, WithEmittingSubmitForHtmlForm)("form"); // new Form(); // TODO: create a Form component
                    },
                    newTodoText: function(){
                      return new compose(HtmlElement, WithEmittingChangedForHtmlElement)("input", { placeholder: "add new todo"});
                    },
                    addTodoButton: function(){
                      return new HtmlElement("button", { type: "submit", innerHTML: "add"});
                    },
                    liveButton: function(){
                      return new compose(HtmlElement, WithEmittingSubmitForHtmlButton)("button");
                    },
                    sortedToogle: function(){
                      return new compose(HtmlElement, WithEmittingChangedForHtmlElement)("input", { type: "checkbox"});
                    },
                    sortedToogleText: function(){
                      return new HtmlElement("span", { innerHTML: "Sort todos by name"});
                    },
                  });

              // bindings
              cmps.when("presenter", "todoList", function(presenter, list){
                return list.setR("value", presenter.getR("sorted").flatMapLatest(function(sorted){
                  return (sorted ? presenter.getR("sortedTodos") : presenter.getR("todos"));
                }));
              });
              // cmps.bindValue("presenter", "stats", "subTitle", "innerHTML");
              cmps.when("presenter", "subTitle", function(presenter, subTitle){
                return subTitle.setR("innerHTML", presenter.getR("reactive").flatMapLatest(function(reactive){
                  return reactive ? presenter.getR("stats") : Bacon.never();
                }).skipDuplicates());
              });
              cmps.syncValue("presenter", "todoText", "newTodoText", "value");
              cmps.bindEvent("newTodoForm", "submit", "presenter", "addTodo");
              cmps.bindEvent("liveButton", "submit", "presenter", "toggleLive");
              cmps.bindValue("presenter", "liveButtonText", "liveButton", "innerHTML");
              cmps.syncValue("presenter", "sorted", "sortedToogle", "checked");

              // layout
  /*          this._layout.configs.addEach({
                  default:
                      [["root"], [
                          ["title"],
                          ["subTitle"],
                          ["todoList"],
                          ["newTodoForm"], [
                              ["newTodoText"],
                              ["addTodoButton"],
                          ],
                      ]],
              });
              this._layout.set("default");
  */          // manual layout to be removed
  this.set('domNode', this._components.get("root").get('domNode'));
  cmps.get("root").set("content", [
    cmps.get("title"),
    cmps.get("subTitle"),
    cmps.get("liveButton"),
    cmps.get("sortedToogle"),
    cmps.get("sortedToogleText"),
    cmps.get("todoList"),
    cmps.get("newTodoForm"),
    ]);
  cmps.get("root").updateRendering();
  cmps.get("newTodoForm").set("content", [
    cmps.get("newTodoText"),
    cmps.get("addTodoButton"),
    ]);
  cmps.get("newTodoForm").updateRendering();

  },
  {
    _todosSetter: function(todos){
      this._components.get("presenter").set("todos", todos);
    },
    _todosGetter: function(todos){
      return this._components.get("presenter").get("todos");
    },
  }
  );


  return TodosManager;
});