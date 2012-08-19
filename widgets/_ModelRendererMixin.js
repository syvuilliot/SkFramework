define([
	"lodash/lodash",
	'dojo/_base/declare'
],
function(
	_,
	declare
) {
	return declare(null, {

		_setModelAttr: function(model) {
			this._set("model", model);
			this._bindModel();
		},
		_setModelMappingAttr: function(modelMapping){
			this._set("modelMapping", modelMapping);
			this._bindModel();
		},
		_bindModel: function(){
			if (!this._started){return;}
			this._unbindModel();
			if (this.get('model')) {
				var modelMapping = this.get("modelMapping");
				var model = this.get("model");
				_(modelMapping).forEach(function(thisProp, modelProp){
					this.set(thisProp, model.get ? model.get(modelProp) : model[modelProp]);
					if (model.watch){
						var handler = model.watch(modelProp, function(modelProp, oldValue, currentValue){
							this.set(thisProp, currentValue);
						}.bind(this));

						this.own(handler);
						this._modelWatchHandlers.push(handler);
					}
				}, this);
			}
		},
		_unbindModel: function() {
			this._modelWatchHandlers && this._modelWatchHandlers.forEach(function(handler) {
				handler.remove();
			});
			this._modelWatchHandlers = [];
		},
		startup: function(){
			this.inherited(arguments);
			this._bindModel();
		}
	});
});
