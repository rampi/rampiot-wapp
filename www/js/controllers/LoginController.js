(function() {    
    'use strict';

    angular.
        module('rampiot').
        controller('LoginController', LoginController);  

    function LoginController($scope, $translate, $rootScope, $ionicPlatform, $state, UsersService, ThingsService, LocalStorage) {
      $rootScope.showFloatingButton = false;
      $scope.profile = {};  
      $scope.login = function(){
        if( !$scope.profile.userId || !$scope.profile.password )return;
        $scope.profile.userId = $scope.profile.userId.toLowerCase();
        $scope.showLoading();
        UsersService.login($scope.profile.userId, $scope.profile.password).
        success(function(data){         
          $scope.afterLogin(data, $scope.profile);
        }).
        error(function(error){
          $scope.hideLoading();
          console.log("ERR: "+JSON.stringify(error));
          $scope.showAlert($translate.instant("alertMessages.error"), $translate.instant("alertMessages.errorWhileLogin"));
        });
      };
      $scope.$on('$ionicView.enter', function(){
        $ionicPlatform.ready(function() {
          var profile = LocalStorage.get('profile');
          if( profile ){
            $scope.profile = JSON.parse(profile);            
            $scope.login();
          }else{
            $scope.hideSplash();
          }
        });
      });
      $scope.register = function(){
        $state.go('register');
      };
    }
    
})();