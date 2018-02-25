//var SERVICES_ENDPOINT = "http://localhost:8082/api/v1";
//var SERVICES_ENDPOINT = "http://localhost:8100/api";
//var SERVICES_ENDPOINT = "https://rampiot.com/api/v1";
var SERVICES_ENDPOINT = "https://api.rampiot.com/v1";
var THING_ENDPOINT = "http://192.168.4.1";
var timeout = 30000;

function _http($q, $http, req, $rootScope, $cordovaNetwork){	
    try{
        if( $rootScope && $cordovaNetwork && $cordovaNetwork.isOffline() ){
            $rootScope.offlineError();
            return;
        }
    }catch(exc){
        console.error(exc.message);
    } 
    var deferred = $q.defer();
    var promise = deferred.promise;	
    req.timeout = timeout;
    if( !req.headers ){
        req.headers = {};
    }
    if( !req.headers['Content-Type'] ){
        req.headers['Content-Type'] = 'application/json';   
    }    
	var responsePromise = $http(req);	
	responsePromise.success(function(data) {		       
      deferred.resolve(data);		       
    });
    responsePromise.error(function(data) {
        console.log(JSON.stringify(data));
        if( data !== null && $rootScope && (data.code === 401 || data.code === 403) ){
            $rootScope.sessionError();
        }
        deferred.reject(data);
    });	
	promise.success = function(fn) {
        promise.then(fn);
        return promise;
    };
    promise.error = function(fn) {        
        promise.then(null, fn);
        return promise;
    };   
    return promise;	
}

angular.module('rampiot.services', [])
.service('LocalThingService', function($q, $http) {
    return {
        info: function() {        
            return _http($q, $http, {
                method: 'GET',                
                url: THING_ENDPOINT+"/info"
            });
        },
        configure: function(ssid, password, name, userId) {
            return _http($q, $http, {                
                method: 'POST',
                headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                transformRequest: function(obj) {
                    var str = [];
                    for(var p in obj)
                    str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
                    return str.join("&");
                },
                data:{
                    ssid: ssid,
                    password: password,
                    name: name,
                    userId: userId
                },
                url: THING_ENDPOINT+"/endpoint"
            });
        }
    };
})
.service('SchemasService', function($q, $http, $rootScope, $cordovaNetwork) {
    return {
        getActionSchemas: function(token) {
            return _http($q, $http, {
                method: 'GET',
                headers: {
                    'Authorization': token 
                },
                url: SERVICES_ENDPOINT + "/schemas/action"
            }, $rootScope, $cordovaNetwork);
        }
    };
})
.service('UsersService', function($q, $http, $rootScope, $cordovaNetwork) {
    return {
        getACL: function(userId, token) {
            return _http($q, $http, {
                method: 'GET',
                headers: {
                    'Authorization': token 
                },
                url: SERVICES_ENDPOINT + "/users/"+userId+"/acl"
            }, $rootScope, $cordovaNetwork);
        },
        updateDeviceToken: function(userId, deviceToken, token) {
            return _http($q, $http, {
                method: 'POST',
                headers: {
                    'Authorization': token 
                },
                url: SERVICES_ENDPOINT + "/users/"+userId+"/device/"+deviceToken
            }, $rootScope, $cordovaNetwork);
        },
        forgotPassword: function(email) {
            return _http($q, $http, {
                method: 'GET',
                url: SERVICES_ENDPOINT + "/users/"+email+"/forgot"
            }, $rootScope, $cordovaNetwork);
        },
        login: function(userId, password) {
            console.log(SERVICES_ENDPOINT + "/users/login");
            return _http($q, $http, {
                method: 'POST',
                data:{
                    userId: userId,
                    pass: password
                },
                url: SERVICES_ENDPOINT + "/users/login"
            }, $rootScope, $cordovaNetwork);
        },
        update: function(userId, name, lastName, email, phone, lang, countryCode, token, timezone) {
            return _http($q, $http, {
                method: 'POST',
                headers: {
                    'Authorization': token 
                },
                data:{
                    name: name,
                    lastName: lastName,
                    email: email,
                    phone: phone,
                    lang: lang,
                    countryCode: countryCode,
                    timezone: timezone
                },
                url: SERVICES_ENDPOINT + "/users/"+userId+"/update"
            }, $rootScope, $cordovaNetwork);
        },
        updatePassword: function(userId, currPass, newPass, token){            
            return _http($q, $http, {
                method: 'POST',
                headers: {
                    'Authorization': token 
                },
                data:{
                    old: currPass,
                    new: newPass
                },
                url: SERVICES_ENDPOINT + "/users/"+userId+"/password"
            }, $rootScope, $cordovaNetwork);
        },
        signup: function(userId, password, name, lastName, email, phone, lang, countryCode, timezone){
            return _http($q, $http, {
                method: 'PUT',
                data:{
                    userId: userId,
                    pass: password,
                    name: name,
                    lastName: lastName,
                    email: email,
                    phone: phone,
                    lang: lang,
                    countryCode: countryCode,
                    timezone: timezone
                },
                url: SERVICES_ENDPOINT + "/users/signup"
            }, $rootScope, $cordovaNetwork);
        }
    };
})
.service('ThingsService', function($q, $http, $rootScope, $cordovaNetwork) {
    return {    
    updateProperties: function(thingId, properties, token){
        return _http($q, $http, {
            method: 'POST',
            data: properties,
            headers: {
                'Authorization': token 
            },
            url: SERVICES_ENDPOINT + "/things/"+thingId+"/properties"
        }, $rootScope, $cordovaNetwork);
    },
    getMyThingsTypes: function(userId, token) {        
        console.log(SERVICES_ENDPOINT + "/things/my/types");
        console.log(token);
        return _http($q, $http, {
            method: 'GET',
            headers: {
                'Authorization': token 
            },
            url: SERVICES_ENDPOINT + "/things/my/types"
        }, $rootScope, $cordovaNetwork);
    },
    getThingsByType: function(userId, typeId, token){        
        return _http($q, $http, {
            method: 'GET',
            headers: {
                'Authorization': token 
            },
            url: SERVICES_ENDPOINT + "/things?type="+typeId
        }, $rootScope, $cordovaNetwork);
    },
    getRules: function(userId, thingId, token){
        return _http($q, $http, {
            method: 'GET',
            headers: {
                'Authorization': token 
            },
            url: SERVICES_ENDPOINT + "/things/"+thingId+"/rules"
        }, $rootScope, $cordovaNetwork);        
    },
    getRule: function(userId, thingId, ruleId, token){
        return _http($q, $http, {
            method: 'GET',
            headers: {
                'Authorization': token 
            },
            url: SERVICES_ENDPOINT + "/things/"+thingId+"/rules/"+ruleId
        }, $rootScope, $cordovaNetwork);        
    },    
    unshare: function(userId, recEmail, thingId, token){
        return _http($q, $http, {
            method: 'DELETE',
            data:{
                recipientEmail: recEmail
            },
            headers: {
                'Authorization': token 
            },
            url: SERVICES_ENDPOINT + "/things/"+thingId+"/share"
        }, $rootScope, $cordovaNetwork);
    },
    share: function(userId, recEmail, thingId, token){
        return _http($q, $http, {
            method: 'PUT',
            data:{
                recipientEmail: recEmail
            },
            headers: {
                'Authorization': token 
            },
            url: SERVICES_ENDPOINT + "/things/"+thingId+"/share"
        }, $rootScope, $cordovaNetwork);
    },
    deleteRules: function(userId, thingId, ruleIds, token){
        return _http($q, $http, {
            method: 'DELETE',
            data:{
                ruleIds: ruleIds
            },
            headers: {
                'Authorization': token 
            },
            url: SERVICES_ENDPOINT + "/things/"+thingId+"/rules"
        }, $rootScope, $cordovaNetwork);        
    },
    getScheduled: function(userId, thingId, token){
        return _http($q, $http, {
            method: 'GET',
            headers: {
                'Authorization': token 
            },
            url: SERVICES_ENDPOINT + "/things/"+thingId+"/scheduled"
        }, $rootScope, $cordovaNetwork);
    },
    deleteScheduled: function(userId, thingId, scheduledId, token){
        return _http($q, $http, {
            method: 'DELETE',
            headers: {
                'Authorization': token 
            },
            url: SERVICES_ENDPOINT + "/things/"+thingId+"/scheduled/"+scheduledId
        }, $rootScope, $cordovaNetwork);
    },
    delete: function(userId, thingId, token){
        return _http($q, $http, {
            method: 'DELETE',            
            headers: {
                'Authorization': token 
            },
            url: SERVICES_ENDPOINT + "/things/"+thingId
        }, $rootScope, $cordovaNetwork);
    },
    getAllThings: function(userId, token){
        return _http($q, $http, {
            method: 'GET',
            headers: {
                'Authorization': token 
            },
            url: SERVICES_ENDPOINT + "/things"
        }, $rootScope, $cordovaNetwork);
    }
  };
});