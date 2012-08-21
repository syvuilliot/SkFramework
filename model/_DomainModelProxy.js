define([
	'lodash/lodash',
	'dojo/_base/declare',
	'./_Base'
],
function(
	_,
	declare,
	Base
) {
	return declare([Base], {
		domainModel: null,
		
		constructor: function(params) {
			//for each function that exists on domainModel (owned and inherited) but not on this, proxy it
			_(this.domainModel).forIn(function(value, prop){
				if (prop[0] != '_' && typeof value === "function"){
					if (this[prop] === undefined) {
						this[prop] = function() {
							return value.apply(this.domainModel, arguments);
						};
					}
				}
			}, this);
		},
		set: function(attr) {
			//when setting a prop that is not defined on this, set it on this.domainModel instead
			var setter = this[this._getAttrNames(attr).s];
			if (typeof attr === "object" || this[attr] !== undefined || setter) {
				return this.inherited(arguments);
			}
			else {
				return this.domainModel.set.apply(this.domainModel, arguments);
			}
		},
		get: function(attr) {
			//when getting a prop that is not defined on this, get it on this.domainModel instead
			var getter = this[this._getAttrNames(attr).g];
			if (this[attr] !== undefined || getter) {
				return this.inherited(arguments);
			}
			else {
				return this.domainModel.get.apply(this.domainModel, arguments);
			}
		},
		watch: function(attr){
			//when watching a prop that is not defined on this, watch it on this.domainModel instead
			var setter = this[this._getAttrNames(attr).s];
			if (this[attr] !== undefined || setter) {
				return this.inherited(arguments);
			}
			else {
				return this.domainModel.watch.apply(this.domainModel, arguments);
			}
		},

	});
});
