(function() {
    'use strict';
    
    angular
        .module('rampiot')
        .controller('ThingTypesListController', ThingTypesListController);

    function ThingTypesListController($scope, $translate, $state, $stateParams, $ionicPopover, RampiotMQTTClient, ThingsService) {      
        $scope.configVisible = true;        
        var template = 
        '<ion-popover-view class="fit">'+
        '<ion-content scroll="false">'+
          '<div class="list" ng-click="popover.hide()">'+            
            '<a class="item ion-document-text" on-tap="seeRules()">&nbsp;'+$translate.instant("thingsCommonsButton.rules")+'</a>'+
            '<a class="item ion-android-calendar" on-tap="seeScheduleds()">&nbsp;'+$translate.instant("thingsCommonsButton.scheduled")+'</a>'+
            '<a class="item ion-gear-b" ng-if="configVisible" on-tap="seeThingProperties()">&nbsp;'+$translate.instant("thingsCommonsButton.configure")+'</a>'+
          '</div>'+
        '</ion-content>'+
        '</ion-popover-view>';
        $scope.things = $stateParams.things;
        $scope.thingTypeId = $stateParams._id;
        $scope.$on('$ionicView.enter', function(){          
          $scope.things.forEach(function(thing, index){
            RampiotMQTTClient.addThingListener(thing._id, function(type, status){
              if( type === 'registry' ){
                $scope.things[index].connected = status === 'disconnected' ? false : true;
              }else{
                $scope.things[index].status = status;
              }
              $scope.$apply();
            });
          });
        });
        $scope.popover = $ionicPopover.fromTemplate(template, {
          scope: $scope
        });
        $scope.openPopover = function($event, thing) {          
          $scope.configVisible = thing.type.propertiesSchema ? true : false;
          $scope.currThing = thing;
          $scope.popover.show($event);
        };
        $scope.share = function(thing){
          console.log(JSON.stringify(thing));
          $state.go('share', {thing: thing});
        };
        $scope.isConnected = function(thing){
          return thing.connected;
        }; 
        $scope.fire = function(thing, fStatus){                    
          RampiotMQTTClient.fire(thing._id, thing.dbm, $scope.Profile.userId, fStatus ? fStatus : thing.status, function(status){
            thing.status = angular.copy(status, {});
          });
        };
        $scope.delete = function(thing, index){      
          var doDelete = function(){
            $scope.showLoading();
            ThingsService.delete($scope.Profile.userId, thing._id, $scope.Profile.token).
            success(function(data){
              for(var i=0;i<$scope.Profile.myTypes.length;i++){
                var mType = $scope.Profile.myTypes[i];
                if( mType._id === thing.type._id && mType.count > 0 ){
                  mType.count--;
                  break;
                }
              }
              $scope.things.splice(index, 1);
              $scope.hideLoading();              
              if( !$scope.things || $scope.things.length === 0 ){
                $state.go('dash', {forceRefresh: true});
              }
            }).
            error(function(error){
              console.log("ERR: "+JSON.stringify(error));
              $scope.hideLoading();
            });
          };
          $scope.showConfirm($translate.instant("alertMessages.areYouSure"), doDelete);
        };
        $scope.seeRules = function(thing){
          thing = !thing ? $scope.currThing : thing;
          $scope.showLoading();
          ThingsService.getRules($scope.Profile.userId, thing._id, $scope.Profile.token).
          success(function(data){
            $scope.hideLoading();
            $state.go("rules-list", {id: thing._id, thing: thing, rules: data.rules});
          }).
          error(function(error){
            console.log("ERR: "+JSON.stringify(error));
            $scope.hideLoading();        
            if( error.code === 404 ){
              $state.go("rules-list", {id: thing._id, thing: thing, rules: []});
            }
          });      
        };
        $scope.seeScheduleds = function(thing){
          thing = !thing ? $scope.currThing : thing;
          $scope.showLoading();
          ThingsService.getScheduled($scope.Profile.userId, thing._id, $scope.Profile.token).
          success(function(data){
            $scope.hideLoading();
            $state.go('scheduleds-list', {id: thing._id, thing: thing, scheduleds: data.scheduleds});
          }).
          error(function(error){
            console.log("ERR: "+JSON.stringify(error));
            $scope.hideLoading();
            if( error.code === 404 ){
              $state.go('scheduleds-list', {id: thing._id, thing: thing, scheduleds: []});
            }
          });      
        };
        $scope.seeThingProperties = function(thing){
          thing = thing ? thing : $scope.currThing;
          $state.go('thing-properties', {thing: thing});
        };        
    }    

})();