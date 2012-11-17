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
		// try to save all local changes to the server
		save: function(){
			//récupérer tous les objets "_updated" du store local
			localStore.query({_updated: true}).forEach(function(localObject){
				//si l'objet n'a pas de numéro de révision, tenter de le créer sur le serveur
				if(localObject.etag === undefined){
					remoteStore.put(localObject).then(function(object){
						//lorsque la création s'est bien passée, le mettre à jour en local avec la réponse du serveur
						//TODO: garder la même instance en mémoire plutôt que d'en créer une autre
						localStore.put(object);
					},
					function(error){
						console.log("Error during object creation on remote store", error);
					});
				//si l'objet a un numéro de révision en local (c'est à dire qu'il existe ou a existé sur le serveur)
				} else {
					remoteStore.get(localObject.id).then(function(remoteObject){
						//si le numéro de révision du serveur concorde (il n'a pas changé sur le serveur), tenter de le mettre à jour le serveur
						if (localObject.etag === remoteObject.etag){
							var objectToStore = lang.clone(localObject);
							delete objectToStore.etag;
							delete objectToStore._updated;
							remoteStore.put(objectToStore).then(function(object){
								//lorsque la mise à jour s'est bien passée sur le serveur, le mettre à jour en local avec la réponse du serveur
								//TODO: garder la même instance en mémoire plutôt que d'en créer une autre
								localStore.put(object);
							}, function(error){
								console.log("Error during object update on remote store", error);
							});
						//sinon c'est qu'il a été modifié sur le serveur également, il y a un conflit
						} else {
							console.log("Conflict between local object", localObject, "and remote object", remoteObject);
						}
					}, function(error){
						//TODO : si l'erreur indique que l'objet n'existe plus sur le serveur, indiquer un conflit
					});
				}
			});
			
			//récupérer tous les objets "_removed" du store local et demander leur suppression sur le serveur
			localStore.query({_removed: true}).forEach(function(localObject){
				remoteStore.get(localObject.id).then(function(remoteObject){
					// si les numéros de révision concordent, tenter de le supprimer sur le serveur
					if (localObject.etag == remoteObject.etag){
						remoteStore.remove(localObject.id).then(function(){
							// lorsque la suppression sur le serveur s'est bien passée, le supprimer en local
							localStore.remove(localObject.id);
						}, function(error){
							console.log("Error during object remove on remote store", error);
						});
					// sinon il y a un conflit
					} else {
						console.log("Conflict detected between local object", localObject, "and remote object", remoteObject);
					}
				}, function(error){
					//TODO : si l'erreur indique que l'objet n'existe plus sur le serveur, le supprimer en local
				});
			});
		},
		// save local changes then refresh the local collection with data from the server
		sync: function(query){
			this.save();
			var remainingLocalObjects = localStore.query().slice();

			//récupérer tous les objets du serveur et mettre à jour le store local
			remoteStore.query(query).forEach(function(remoteObject){
				var localObject = localStore.get(remoteObject.id);
				// si l'objet n'existe pas en local, le créer
				if (localObject === undefined){
					localStore.put(object);
				// sinon
				} else {
					// enlever l'objet de la liste des objets non traités
					remainingLocalObjects.splice(remainingLocalObjects.indexOf(localObject), 1);
					// si les numéros de révision sont différents
						// s'il n'y a pas de conflit, mettre à jour l'objet local
						// sinon... que faut-il faire pour premettre la résolution de conflit ? stocker l'objet distant dans un store à part ? ou inversement, stocker l'objet local à part et le remplacer par l'objet distant dans le store local ? ou faut-il que l'instance de modèle puisse stocker ces 2 versions et exposer des méthodes de résolution de conflits
					if () {

					}
					// si les numéros de révision sont identiques, normalement il n'y a rien à faire
					if () {
						
					}
				}
			});

			//supprimer tous les objets locaux non inclus dans la réponse du serveur
			remainingLocalObjects.forEach(function(object){
				localStore.remove(object.id);
			});
						
			//at the end, log as done
			console.log("data sync done");
		}
	});
};
return Sync;
});
