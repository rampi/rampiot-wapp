angular.module('rampiot')
.factory('RampiotMQTTClient', function(){
  var uri = 'wss://rampiot.com:3000';
  var user;
  var mqttClient = null;
  var aclUpdateTopic = null;
  var listeners = {};
  var aclUpdateListeners = null;
  var lastStatus = {};
  var readTopics = [];
  var connect = function(_user, _pass, _readTopics){
    readTopics = _readTopics;
    if( mqttClient && mqttClient.connected )return;
    if( mqtt ){
      aclUpdateTopic = "rampiot/"+_user+"/acl/update";
      mqttClient = mqtt.connect(uri, {
          clientId: _user,
          username: _user,
          password: _pass
      });
      mqttClient.on('connect', function () {
        if( mqttClient && readTopics && readTopics.length > 0 ){
          readTopics.forEach(function(topic){            
            mqttClient.subscribe(topic);            
          });
        }
      });
      mqttClient.on('message', function (topic, message) {   
          var json = JSON.parse(message);          
          if( topic === aclUpdateTopic ){            
              readTopics = json.acl.allowedReadTopics;
              mqttClient.end();
              mqttClient.connected = false;
              connect(_user, _pass, readTopics);
              if( aclUpdateListeners ){
                  aclUpdateListeners(topic, json);
              }
          }
          else if( listeners && listeners[json._id] ){
              var cBack = listeners[json._id];
              var sTopic = topic.split('\/');
              cBack(sTopic[sTopic.length-1], json.status);
          }
      });
    }else{
      throw 'Error: mqtt.js not found';
    }
  };
  return {
    connect: connect,
    confirm: function(thingId, authStatusChangeId, fireUserId, status, callback){
      var json = {"_id": thingId, "authStatusChangeId": authStatusChangeId, "status": status, "fireUserId": fireUserId};
      mqttClient.publish("rampiot/"+fireUserId+"/"+thingId+"/fire", JSON.stringify(json), function(){
          callback(status);
      });
    },
    fire: function(thingId, dbm, fireUserId, status, callback){
      if( !mqtt ){
        callback('Error: mqttClient not connected');
        return;
      }
      if( !lastStatus[thingId] ){
          lastStatus[thingId] = {
              dbm: dbm
          };
      }
      if( lastStatus[thingId].dbm !== dbm ){
          lastStatus[thingId].dbm = dbm;
      }    
      var now = new Date().getTime();
      if( !lastStatus[thingId].lastTime || now - lastStatus[thingId].lastTime > 1000*dbm ){
          lastStatus[thingId].status = angular.copy(status,{});
          lastStatus[thingId].lastTime = new Date().getTime();
          var json = {"_id": thingId, "status": status, "fireUserId": fireUserId};
          mqttClient.publish("rampiot/"+fireUserId+"/"+thingId+"/fire", JSON.stringify(json), function(){
              callback(lastStatus[thingId].status);
          });
      }else{        
          callback(lastStatus[thingId].status);
      }
    },
    close: function(){
      if( mqttClient ){
        mqttClient.end();
        mqttClient.connected = false;
      }      
    },
    addThingListener: function(thingId, cBack){
      listeners[thingId] = cBack;
    },
    setACLUpdateListener: function(cBack){
      aclUpdateListeners = cBack;
    },
    removeThingListener: function(thingId){
      delete listeners[thingId];
    }
  }; 
});