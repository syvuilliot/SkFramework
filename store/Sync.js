define(["dojo/_base/lang","dojo/_base/Deferred"
],function(lang, Deferred) {
var Sync = function(localStore, remoteStore, options){
	options = options || {};
	return lang.delegate(localStore, {
		localStore: localStore,
		remoteStore: remoteStore,
		
		put: function(object, directives){
			currentObject = localStore.get(object.id);
			if (currentObject && currentObject.etag){
				object.etag = currentObject.etag;
			}
			object._updated = true;
			return localStore.put(object, directives);
		},
		remove: function(id, directives){
			object = localStore.get(id);
			if (object.etag){
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
		sync: function(query){
			//supprimer tous les objets locaux non modifiés
			localStore.query({_updated: undefined, _removed: undefined}).forEach(function(object){
				localStore.remove(object.id);
			});

			//récupérer tous les objets "_updated" du store local
			localStore.query({_updated: true}).forEach(function(localObject){
				//si l'objet n'a pas de numéro de révision, tenter de le créer sur le serveur
				if(localObject.etag === undefined){
					remoteStore.put(object).then(function(object){
						//lorsque la création s'est bien passée, le supprimer en local
						localStore.remove(object);
					},
					function(error){
						console.log("Error during object creation on remote store", error);
					});
				//si l'objet a un numéro de révision en local (c'est à dire qu'il existe ou a existé sur le serveur)
				//si le numéro de révision du serveur concorde (il n'a pas changé sur le serveur), tenter de le mettre à jour le serveur
				} else {
					remoteStore.get(localObject.id).then(function(remoteObject){
						if (localObject.etag === remoteObject.etag){
							var objectToStore = lang.clone(localObject);
							delete objectToStore.etag;
							delete objectToStore._updated;
							remoteStore.put(objectToStore).then(function(object){
								localStore.remove(object.id);
							}, function(error){
								console.log("Error during object update on remote store", error);
							});
						} else {
							console.log("Conflict between local object", localObject, "and remote object", remoteObject);
						}
					}, function(error){
						//TODO : si l'erreur indique que l'objet n'existe plus sur le serveur, indiquer un conflit
					});
				}
			});
			
			//récupérer tous les objets "_removed" du store local
			localStore.query({_removed: true}).forEach(function(localObject){
				remoteStore.get(localObject.id).then(function(remoteObject){
					// si les numéros de révision concordent, tenter de les supprimer sur le serveur
					if (localObject.etag == remoteObject.etag){
						remoteStore.remove(localObject.id).then(function(){
							localStore.remove(localObject.id);
						}, function(error){
							console.log("Error during object remove on remote store", error);
						});
					} else {
						console.log("Conflict detected between local object", localObject, "and remote object", remoteObject);
					}
				}, function(error){
					//TODO : si l'erreur indique que l'objet n'existe plus sur le serveur, le supprimer en local
				});
			});

			//récupérer tous les objets du serveur et mettre à jour le store local
			remoteStore.query(query).forEach(function(object){
				var localObject = localStore.get(object.id);
				//si l'objet n'existe pas en local, le créer
				//sinon ne rien faire (si l'objet existe encore en local, c'est que sa mise à jour vers le serveur a échoué)
				if (localObject === undefined){
					localStore.put(object);
				}
			});
						
			//at the end, log as done
			console.log("data sync done");
		}
	});
};
return Sync;
});
