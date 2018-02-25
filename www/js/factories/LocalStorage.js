angular.module('rampiot')
.factory('LocalStorage', function(){
  return {
    put: function(key, value){
      window.localStorage.setItem(key, value);
    },
    get: function(key){
      return window.localStorage.getItem(key);
    },
    clear: function(){
      window.localStorage.clear();
    },
    remove: function(key){
      window.localStorage.removeItem(key);
    }
  };    
});