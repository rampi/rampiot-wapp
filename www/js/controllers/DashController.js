(function() {    
    'use strict';

    angular
        .module('rampiot')
        .controller('DashController', DashController);

    function DashController($scope, $translate, $rootScope, ionicToast, $stateParams, $ionicPlatform, $state, ThingsService, RampiotMQTTClient) {
        $scope.items = $scope.Profile.myTypes;
        var onBackPressed = function(event){
            event.preventDefault();
            event.stopPropagation();
        };        
        if( !$scope.items || $scope.items.length === 0 ){
          $rootScope.showFloatingButton = true;
          $scope.showThingConnSteps();
          $scope.hideSplash();
          return;
        }
        $rootScope.handleACLUpdate = function(aclUpdate){
          if( aclUpdate ){
            if( aclUpdate.action === 'signup' ){                            
              ionicToast.show($translate.instant("alertMessages.newThingAdded",{"thingName": aclUpdate.thing.name}), 'middle', false, 5000);
            }else if( aclUpdate.action === 'delete' ){
              ionicToast.show($translate.instant("alertMessages.thingDeletedByOwner", {"thingName" : aclUpdate.thing.name}), 'middle', false, 5000);
            }
            $scope.items = $scope.Profile.myTypes;
            $state.go('dash');
          }
        };    
        $rootScope.handleNotification = function(data){       
          console.log(JSON.stringify(data));
          var msg = data.message;          
          if( msg.payload && msg.payload.auth ){
            $scope.showAuth($scope.Profile, function(err, auth){
              if( err ){
                switch( err ){
                  case "NOT_AVAILABLE":
                    //TODO
                  break;
                  case "AUTH_CANCELED":
                    //TODO
                  break;
                }
              }else{
                RampiotMQTTClient.confirm(
                  msg.payload._id, msg.payload.authStatusChangeId, 
                  $scope.Profile.userId, msg.payload.status, 
                  function(status){
                    console.log(JSON.stringify(status));  
                  }
                );                
              }
            });
          }else{
            $scope.showPushNotification(msg.title, msg.text);            
            try{
              $scope.$apply();
            }catch(exc){}
          }
          if( window.plugins.bringtofront ){
            window.plugins.bringtofront();
          }
        };
        $scope.doRefresh = function(){
          $scope.loadMyThings(function(err, data){
            if( !err && data ){
              $scope.Profile.myTypes = data.myTypes;
              $scope.items = $scope.Profile.myTypes;              
            }
            $scope.hideLoading();
            $scope.$broadcast('scroll.refreshComplete');
          });
        };
        $scope.viewThingsByType = function(_id){
            $scope.showLoading();
            ThingsService.getThingsByType($scope.Profile.userId, _id, $scope.Profile.token).
            success(function(data){
              $scope.hideLoading();
              $state.go("types-list", {_id: _id, things: data.things});
            }).
            error(function(error){
              $scope.hideLoading();
              console.log("ERR: "+JSON.stringify(error));
            });        
        };
        $scope.$on('$ionicView.enter', function(){
          $scope.items = $scope.Profile.myTypes;
          if( $stateParams.forceRefresh ){
            $scope.showLoading();
            $scope.doRefresh();
          }      
        });
        $scope.$on('$ionicView.afterEnter', function(){
          $rootScope.showFloatingButton = true;          
          $scope.hideSplash();
        });
    }

})();