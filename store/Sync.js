define(["dojo/_base/lang","dojo/_base/Deferred"
],function(lang, Deferred) {
var Sync = function(localStore, remoteStore, options){
	options = options || {};
	return lang.delegate(localStore, {
		localStore: localStore,
		remoteStore: remoteStore,
		
		put: function(object, directives){
			currentObject = localStore.get(object.id);
			if (currentObject && currentObject._revision){
				object._revision = currentObject._revision;
				object._updated = true;
			}
			return localStore.put(object, directives);
		},
		remove: function(id, directives){
			object = localStore.get(id);
			if (object._revision){
				object._removed = true;
				return localStore.put(object, directives);
			} else {
				return localStore.remove(id, directives);
			}
		},
		query: function(query, options){
			query._removed = undefined;
			return localStore.query(query, options);
		},
		sync: function(){
			//récupérer tous les objets du serveur et mettre à jour le store local
			remoteStore.query().forEach(function(object){
				var localObject = localStore.get(object.id);
				//si l'objet n'existe pas en local, le créer
				if (localObject === undefined){
					localStore.put(object);
				}
				//si l'objet existe en local, comparer les révisions
				else {
					// => si dirty en local, ne rien faire (traité par la suite)
					// => si révisions identiques, ne rien faire
					if (localObject._revision == object._revision){} else { 
						// => si révision différente, màj le local si non dirty, sinon il y a un conflit
						if (localObject._revision !== object._revision && localObject._updated === undefined && localObject._removed === undefined){
							localStore.put(object);
						} else {
							console.log("Conflict detected between local object", localObject, "and remote object", object);
						}
					}
				}
			});
			
			//Pour les objets n'existants plus sur le serveur (n° révision en local inexistant sur serveur), le supprimer en local... mais seulement s'il n'y a pas eu de modif en local
			//localStore.query().forEach(function(object){
				//TODO
			//});
			
			//Pour les objets locaux n'ayant pas de numéro de révision, tenter de les créer sur le serveur
			localStore.query({_revision: undefined}).forEach(function(object){
				remoteStore.put(object).then(function(object){
					localStore.put(object);
				},
				function(error){
					console.log("Error during object creation on remote store", error);
				});
			});			
			//récupérer tous les objets "_updated" du store local, si les numéro de révision concordent, tenter de les mettre à jour le serveur puis stocker localement le nouveau numéro de révision
			localStore.query({_updated: true}).forEach(function(localObject){
				remoteStore.get(localObject.id).then(function(remoteObject){
					if (localObject._revision == remoteObject._revision){
						var objectToStore = lang.clone(localObject);
						delete objectToStore._revision;
						delete objectToStore._updated;
						remoteStore.put(objectToStore).then(function(object){
							localStore.put(object);
						}, function(error){
							console.log("Error during object update on remote store", error);
						});
					} else {
						console.log("Conflict detected between local object", localObject, "and remote object", remoteObject);
					}
				});
			});
			
			//récupérer tous les objets "_removed" du store local, si les numéros de révision concordent, tenter de les supprimer sur le serveur puis les supprimer également en local
			localStore.query({_removed: true}).forEach(function(localObject){
				remoteStore.get(localObject.id).then(function(remoteObject){
					if (localObject._revision == remoteObject._revision){
						remoteStore.remove(localObject.id).then(function(object){
							localStore.remove(localObject.id);
						}, function(error){
							console.log("Error during object remove on remote store", error);
						});
					} else {
						console.log("Conflict detected between local object", localObject, "and remote object", remoteObject);
					}
				});
			});
			
			//at the end, log as done
			console.log("data sync done");
		}
	});
};
//lang.setObject("dojo.store.Cache", Cache);
return Sync;
});