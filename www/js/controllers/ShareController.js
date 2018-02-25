(function() {
    'use strict';

    angular
        .module('rampiot')
        .controller('ShareController', ShareController);

    function ShareController($scope, $translate, $rootScope, $ionicPlatform, $state, $stateParams, ThingsService) {
      $scope.thing = $stateParams.thing;
      $scope.data = {};
      $scope.cancel = function(index, recEmail, userId, thingId){
        var doUnshare = function(){
          $scope.showLoading();
          ThingsService.unshare($scope.Profile.userId, recEmail, thingId, $scope.Profile.token).
          success(function(data){
            $scope.hideLoading();
            $scope.thing.users.splice(index, 1);
            $state.go('dash');
            $scope.showAlert($translate.instant("alertMessages.info"), $translate.instant("alertMessages.thingUnsharedOk"));
          }).
          error(function(error){
            console.log(JSON.stringify(error));
            $scope.hideLoading();
            $scope.showAlert($translate.instant("alertMessages.error"), $translate.instant("alertMessages.errorUnsharingThing"));
          });
        };
        $scope.showConfirm($translate.instant("alertMessages.areYouSure"), doUnshare);
      };
      $scope.share = function(thingId){
        $scope.showInputDialog($scope, $translate.instant("alertMessages.emailTitle"), $translate.instant("alertMessages.emailToShareThing"), function(){
          if( $scope.data.input ){        
            $scope.showLoading();
            ThingsService.share($scope.Profile.userId, $scope.data.input, thingId, $scope.Profile.token).
            success(function(data){
              $scope.hideLoading();
              $state.go('dash');
              $scope.showAlert($translate.instant("alertMessages.info"), $translate.instant("alertMessages.thingSharedOk"));
            }).
            error(function(error){
              console.log(JSON.stringify(error));
              $scope.hideLoading();
              if( error.code === 404 ){
                $scope.showAlert($translate.instant("alertMessages.error"), $translate.instant("alertMessages.emailNotFound"));
              }
              else if( error.code === 1022 ){
                $scope.showAlert($translate.instant("alertMessages.error"), $translate.instant("alertMessages.emailNotFound"));
                $scope.showAlert($translate.instant("alertMessages.error"), $translate.instant("alertMessages.thingAlreadyShared"));
              }
              else{
                $scope.showAlert($translate.instant("alertMessages.error"), $translate.instant("alertMessages.errorSharingThing"));
              }          
            });
          }
        }, "email");
      };
    }

})();