define([
	"lodash/lodash",
], function(_){
	
	return function(source, target, mapping){
		var handlers = [];
		//propagation logic
		var propagate = function(source, sourceProp, target, targetProp){
			var sourceValue = source.get(sourceProp);
			var targetValue = target.get(targetProp);
			// if (targetValue !== sourceValue){
				target.set(targetProp, sourceValue);
			// }
		};
		_(mapping).forEach(function(targetProp, sourceProp){
			var sourceWatchHandler, targetWatchHandler;
			//initial source to target propagation
			propagate(source, sourceProp, target, targetProp);
			var sourceStopPropagation = false;
			var targetStopPropagation = false;
			//source to target propagation on source change
			handlers.push(source.watch(sourceProp, function(){
				if (!sourceStopPropagation){
					targetStopPropagation = true;
					propagate(source, sourceProp, target, targetProp);
				} else {
					sourceStopPropagation = false;
				}
			}));
			//target to source propagation on target change
			handlers.push(target.watch(targetProp, function(prop, old, current){
				if (!targetStopPropagation){
					sourceStopPropagation = true;
					propagate(target, targetProp, source, sourceProp);
				} else {
					targetStopPropagation = false;
				}
			}));
		});
		return {
			remove: function(){
				handlers.forEach(function(handler){
					handler.remove();
				});
			},
		};
	};

});