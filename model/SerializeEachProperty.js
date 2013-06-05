define([

], function(

){
	// delègue la sérialisation à chaque manager de propriété
	// la "sérialisation" consiste à extraire les données d'une resource dans le but de les exporter vers une source de données
	// la désérialisation consiste à mettre à jour la resource à partir d'un objet de données
	// dans le cas des relations, c'est l'occasion de transformer les objets en une référence (un id)
	// les méthodes pourraient se nommer "getData(rsc)->data" et "setData(rsc, data)"
	//
	// A retravailler : il faut pouvoir traiter plusieurs "formats" de serilisation/deserialisation, un par source de données

	var SerializeEachProperty = function(){
		this.serialize = function(rsc){
			var data = {};
			Object.keys(this.propertyManagers).forEach(function(propName){
				var propMng = this.propertyManagers[propName];
				if (propMng.serialize){
					data[propMng.serializePropName] = propMng.serialize(this.getPropValue(rsc, propName));
				}
			}.bind(this));
			return data;
		};
		this.deserialize = function(rsc, data, options){
			// TODO: on pourrait prévoir dans les options (comme dans backbone) de permettre de supprimer les propriétés qui ne sont pas dans data, ou au contraire d'ajouter celles qui sont en plus, ou d'empêcher la mise à jour de certaines
			// ici, on ne fait qu'écraser les valeurs de toutes les propriétés qui ont une méthode "deserialize" et pour lesquelles une valeur est fournie dans data
			Object.keys(this.propertyManagers).forEach(function(propName){
				var propMng = this.propertyManagers[propName];
				if (data.hasOwnProperty(propMng.serializePropName) && propMng.deserialize){
					this.setPropValue(rsc, propName, propMng.deserialize(data[propMng.serializePropName]));
				}
			}.bind(this));
		};
	};
	return SerializeEachProperty;
});