angular.module('rampiot', 
[
  'ionic', 'ionic.cloud', 'ngCordova', 'rampiot.services',
  'ionic-toast', 'ion-floating-menu', 'pascalprecht.translate',
  'schemaForm'
])
.run(function(
  $ionicPlatform, $rootScope, $state, $translate, $ionicConfig, 
  $ionicPopup, $ionicHistory, $ionicPush, $ionicLoading, 
  RampiotMQTTClient, LocalStorage, ThingsService, UsersService, Utils) {
  $ionicPlatform.ready(function() {
    if(window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      cordova.plugins.Keyboard.disableScroll(true);
    }
    if( window.cordova && cordova && cordova.plugins.backgroundMode ){
      cordova.plugins.backgroundMode.setDefaults({ title: 'Rampiot', text: $translate.instant('common.others.foregroundServiceMSG')});
      cordova.plugins.backgroundMode.enable();
      cordova.plugins.backgroundMode.ondeactivate = function() {};
    }
    if(window.StatusBar) {
      StatusBar.styleDefault();
    }
    $ionicConfig.backButton.previousTitleText(false).text('');
    $rootScope.Profile = {};    
    $rootScope.CURRENT_SCHEMA = {};    
    $rootScope.onProfileUpdate = function(){
      if( cordova.plugins.backgroundMode ){
        cordova.plugins.backgroundMode.setDefaults({ title: 'Rampiot', text: $translate.instant('common.others.foregroundServiceMSG')});
      }
    };
    $ionicPlatform.registerBackButtonAction(function(event){
      if($state.current.name === 'dash'){
        event.preventDefault();
      }else{
        $ionicHistory.goBack();
      }
    }, 100);    
    $rootScope.logout = function(){
      $rootScope.Profile = {};
      LocalStorage.clear();
      $state.go('login');
      RampiotMQTTClient.close();
      if( $rootScope.onLogout ){
        $rootScope.onLogout();
      }
    };
    $rootScope.aclUpdateTimeoutId = -1;
    $rootScope.$on('$cordovaNetwork:online', function(event, networkState){     
      if( $rootScope.aclUpdateTimeoutId != -1 ){
        clearTimeout($rootScope.aclUpdateTimeoutId);  
      }
      if( $rootScope.Profile ){
        $rootScope.aclUpdateTimeoutId = setTimeout(function(){          
          $rootScope.showLoading();
          UsersService.getACL($rootScope.Profile.userId, $rootScope.Profile.token).
          success(function(data){
            $rootScope.hideLoading();
            $rootScope.aclUpdateTimeoutId = -1;
            console.log("Reconnecting with updated ACLs");
            console.log(JSON.stringify(data.acl));
            RampiotMQTTClient.close();
            RampiotMQTTClient.connect($rootScope.Profile.userId, $rootScope.Profile.password, data.acl.allowedReadTopics);
          }).
          error(function(error){
            $rootScope.hideLoading();
            $rootScope.aclUpdateTimeoutId = -1;
            console.log(error);
          });
        }, 3000);
      }      
    });
    $rootScope.offlineError = function(){
      $rootScope.hideLoading();
      $rootScope.showAlert($translate.instant("alertMessages.error"), $translate.instant("alertMessages.offlineError"));
    };
    $rootScope.sessionError = function(){
      $rootScope.logout();
      $rootScope.showAlert($translate.instant("alertMessages.error"), $translate.instant("alertMessages.sessionError"));
    };
    $rootScope.profile = function(){
      $state.go('profile');
    };
    $rootScope.loadMyThings = function(callback){
      ThingsService.getMyThingsTypes($rootScope.Profile.userId, $rootScope.Profile.token).
      success(function(data){
        $rootScope.hideLoading();
        callback(null, data);
      }).
      error(function(error){                
        $rootScope.hideLoading();
        callback(error);        
      });
    };
    $rootScope.showAuth = function(profile, callback){      
      if( FingerprintAuth ){
        var encryptConfig = {
            clientId: "rampiot",
            username: "rampiot",
            password: "rampiot"
        };        
        var isAvailable = function(){
          FingerprintAuth.encrypt(encryptConfig, 
            function(result) {
              callback(null, {
                fingerprint: result.withFingerprint,
                pin: result.withBackup
              });          
            }, 
            function(error) {
              if (error === FingerprintAuth.ERRORS.FINGERPRINT_CANCELLED) {
                callback("AUTH_CANCELED");
              } else {
                callback(error);
              }
          });
        };
        FingerprintAuth.isAvailable(isAvailable, function(e,r){
          callback("NOT_AVAILABLE");
        });
      }      
    };
    $rootScope.afterLogin = function(data, profile){            
      $rootScope.Profile = data.profile;
      $rootScope.Profile.token = data.token;
      $rootScope.Profile.password = profile.password;      
      $rootScope.Profile.preferences.timezone = String($rootScope.Profile.preferences.timezone);
      LocalStorage.put('profile', JSON.stringify($rootScope.Profile));
      $translate.use( $rootScope.Profile.preferences.lang );
      RampiotMQTTClient.connect(profile.userId, profile.password, data.acl.allowedReadTopics);
      RampiotMQTTClient.setACLUpdateListener(function(topic, json){
        if( json.action === 'signup' || 
        (json.action === 'delete' && json.extra.isOwner === false) || 
        json.action === 'share' ){
          $rootScope.showLoading();
          $rootScope.loadMyThings(function(e,r){
            $rootScope.hideLoading();
            console.log(JSON.stringify(r));
            if( !e ){
              $rootScope.Profile.myTypes = r.myTypes;
              if( $rootScope.handleACLUpdate ){
                $rootScope.handleACLUpdate(json);
              }
            }else{
              console.log(e);
            }
          });
        }
      });      
      $rootScope.translateMyThigTypes = function(){
        $rootScope.Profile.myTypes.forEach(function(type){
          type.name = $translate.instant("common.thingTypes."+type._id);
        });
      };
      $rootScope.registerPush();
      $rootScope.loadMyThings(function(e,r){
        if( !e ){
          $rootScope.Profile.myTypes = r.myTypes;
          $rootScope.translateMyThigTypes();
        }else{
          console.log(JSON.stringify(e));
        }
        $state.go('dash');
      });
    };
    $rootScope.hideSplash = function(){
      if( navigator && navigator.splashscreen ){
        navigator.splashscreen.hide();
      }
    };
    $rootScope.showLoading = function(msg){
      $ionicLoading.show({
        template: '<ion-spinner icon="lines" class="spinner-calm"/>'        
      });
    };
    $rootScope.showAlert = function(title, msg){      
      swal(title, msg, title == $translate.instant("alertMessages.error") ? 'error' : 'info');
    };
    $rootScope.showSuccess = function(title, msg){      
      swal(title, msg, 'success');
    };
    $rootScope.showThingConnSteps = function(){
      $state.go("step1");
    };    
    $rootScope.$on('cloud:push:notification', function(event, data) {
        if( $rootScope.handleNotification ){
          $rootScope.handleNotification(data);
        }        
    });
    var register = function(cBack){
      var pushToken = LocalStorage.get('pushToken');
      var profile = LocalStorage.get('profile');
      if( pushToken && profile ){
          profile = JSON.parse(profile);          
          UsersService.updateDeviceToken(profile.userId, pushToken, profile.token).
          success(function(resp){   
            console.log("ZZ: "+JSON.stringify(resp));
            cBack();
          }).
          error(function(error){
            console.log("EE: "+JSON.stringify(error));
            cBack(error);            
          });
      }
    };
    $rootScope.showPushNotification = function(title, message){
      swal({
        titleText: title,
        text: message,
        imageUrl: 'img/logo.png',
        imageWidth: 90,
        imageHeight: 90,
        confirmButtonText: $translate.instant("common.buttons.close")
      });
    };
    $rootScope.showFloatingButton = false;
    $rootScope.registerPush = function(){      
      $ionicPush.register().then(function(t) {
        LocalStorage.put('pushToken', t.token);
        register(function(error){
          if( error ){
              var intId = setInterval(function(){
              register(function(error){
                if(!error){
                  clearInterval(intId);
                }
              });
              }, 4000);
          }
        });
        return $ionicPush.saveToken(t);
      });
    };
    $rootScope.unregisterPush = function(){      
      $ionicPush.unregister();
    };
    $rootScope.hideLoading = function(){
      $ionicLoading.hide();
    };
    $rootScope.showInputDialog = function($scope, title, subTitle, callback, type){
      var myPopup = $ionicPopup.show({
      template: '<input type="'+(type?type:'text')+'" ng-model="data.input">',
      title: title,
      subTitle: subTitle,
      scope: $scope,
      buttons: [
        { text: $translate.instant("common.buttons.cancel") },
        {
          text: '<b>'+$translate.instant("common.buttons.ok")+'</b>',
          type: 'button-positive',
          onTap: function(e) {
            if (!$scope.data.input) {              
              e.preventDefault();
            } else {
              callback();
              return $scope.data.input;
            }
          }
        }
      ]
    });
  };       
    $rootScope.showConfirm = function(message, callback){
      swal({
        title: $translate.instant("alertMessages.confirm"),
        text: message,
        type: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: $translate.instant("common.buttons.ok"),
        cancelButtonText: $translate.instant("common.buttons.cancel"),
        confirmButtonClass: 'btn btn-success',
        cancelButtonClass: 'btn btn-danger',
        buttonsStyling: true
      }).then(function () {
        callback();
      });
    }; 
    $rootScope.cancel = function(){
      $state.go("dash");
    };        
    $rootScope.schemaPropsTranslator = function(typeId, key){      
      var langKey = "thingInfo."+typeId+".schema."+key;
      var sText = $translate.instant(langKey);
      if( sText === langKey ){
        var langCommKey = "thingInfo.common."+key;
        var sCommText = $translate.instant(langCommKey);
        if( langCommKey !== sCommText )return sCommText;
        var enumKey = "thingInfo."+typeId+".enum."+key;        
        var enumText = $translate.instant(enumKey);        
        return enumKey === enumText ? key : enumText;
      }
      return sText;
    };      
  });
})

.config(function($stateProvider, $urlRouterProvider, $ionicConfigProvider, $ionicCloudProvider, $translateProvider) {
  $ionicCloudProvider.init({
    "debug": true,
    "dev_push": false,
    "core": {
      "app_id": "2d87ac80"
    },
    "push": {
      "sender_id": "208674318608",
      "pluginConfig": {
        "ios": {
          "badge": true,
          "sound": true
        },
        "android": {
          "iconColor": "#343434"
        }
      }
    }    
  });  
  $translateProvider.useStaticFilesLoader({
    'prefix': 'i18n/',
    'suffix': '.json'
  });
  $translateProvider.preferredLanguage('en');
  $translateProvider.useSanitizeValueStrategy(null);
  $stateProvider
  .state('login', {
      url: '/login',    
      cache: false,  
      templateUrl: 'templates/login.html',
      controller: 'LoginController'
  })
  .state('profile', {
      url: '/profile',    
      cache: false,  
      templateUrl: 'templates/profile.html',
      controller: 'ProfileController'
  })
  .state('forgot', {
      url: '/forgot',    
      cache: false,  
      templateUrl: 'templates/forgot-password.html',
      controller: 'ForgotController'
  })
  .state('register', {
      url: '/register',    
      cache: false,  
      templateUrl: 'templates/register.html',
      controller: 'RegisterController'
  })  
  .state('share', {
    url: '/share',    
    cache: false,
    templateUrl: 'templates/share.html?t='+new Date().getTime(),
    controller: 'ShareController',
    params:{
      thing: null
    }
  })
  .state('step1', {
      url: '/step1',    
      cache: false,  
      templateUrl: 'templates/thing-connection-steps/step1.html',
      controller: 'StepsController'
  })  
  .state('step2', {
      url: '/step2',      
      cache: false,
      params:{
        thing: null
      },
      templateUrl: 'templates/thing-connection-steps/step2.html',
      controller: 'StepsController'
  })  
  .state('dash', {
      url: '/dash',
      cache: false,
      params: {
        aclUpdate: null,
        forceRefresh: false
      },     
      templateUrl: 'templates/dashboard.html',
      controller: 'DashController'
  })  
  .state('thing-properties', {
    url: '/properties',
    cache: false,
    params: {
      thing: null
    },     
    templateUrl: 'templates/properties.html',
    controller: 'PropertiesController'
  })
  .state('types-list', {
    url: '/things/type/:_id',
    cache: false,
    params: {
      _id: null,
      things: null
    },
    templateUrl: 'templates/things-list.html',
    controller: 'ThingTypesListController'  
  })  
  .state('scheduleds-list', {
    url: '/things/:id/scheduleds',
    templateUrl: 'templates/scheduleds.html',
    cache: false,
    params:{
      thing: null,
      scheduleds: null
    },
    controller: 'ScheduledListController'  
  })  
  .state('rules-list', {
    url: '/things/:id/rules',
    templateUrl: 'templates/rules.html',
    cache: false,
    params:{
      thing: null,      
      rules: null
    },
    controller: 'RulesListController'  
  });
  $urlRouterProvider.otherwise('login');
});