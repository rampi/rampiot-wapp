(function() {
    'use strict';

    angular
        .module('rampiot')
        .controller('RegisterController', RegisterController);

    function RegisterController($scope, $translate, $rootScope, $ionicPlatform, $state, Utils, UsersService, Countries, LocalStorage) {
      $scope.register = {};
      $scope.countries = Countries.get();
      $scope.signup = function(){            
        if( !$scope.register.userId || $scope.register.userId.length < 4 ){
          $scope.showAlert($translate.instant("alertMessages.error"), $translate.instant("alertMessages.userIdMustBe4Min"));
          return;
        }
        if( !$scope.register.password || $scope.register.password.length < 7 ){
          $scope.showAlert($translate.instant("alertMessages.error"), $translate.instant("alertMessages.passMustBe7Min"));
          return;
        }
        if( $scope.register.password !== $scope.register.cPassword ){
          $scope.showAlert($translate.instant("alertMessages.error"), $translate.instant("alertMessages.passNotMatch"));
          return;
        }
        if( !$scope.register.name || $scope.register.name.length < 2 ){
          $scope.showAlert($translate.instant("alertMessages.error"), $translate.instant("alertMessages.nameMustBe2Min"));      
          return;
        }
        if( !$scope.register.lastName || $scope.register.lastName.length < 2 ){
          $scope.showAlert($translate.instant("alertMessages.error"), $translate.instant("alertMessages.lastNameMustBe2Min"));
          return;
        }    
        if( !$scope.register.email || !Utils.validateEmail($scope.register.email) ){
          $scope.showAlert($translate.instant("alertMessages.error"), $translate.instant("alertMessages.invalidEmailFormat"));      
          return;
        }
        if( !$scope.register.phone || String($scope.register.phone).length < 5 ){
          $scope.showAlert($translate.instant("alertMessages.error"), $translate.instant("alertMessages.phoneMustBe5Min"));      
          return;
        }
        if( !$scope.register.lang ){
          $scope.showAlert($translate.instant("alertMessages.error"), $translate.instant("alertMessages.selectLanguage"));
          return;
        }
        if( !$scope.register.timezone ){
          $scope.showAlert($translate.instant("alertMessages.error"), $translate.instant("alertMessages.selectTimezone"));
          return;
        }
        $scope.showLoading();
        UsersService.signup(
          $scope.register.userId, $scope.register.password, $scope.register.name,
          $scope.register.lastName, $scope.register.email, $scope.register.phone,
          $scope.register.lang, $scope.register.country.code, parseInt($scope.register.timezone)).
          success(function(data){
            $scope.hideLoading();
            $scope.afterLogin(data, $scope.register);
          }).
          error(function(error){
            $scope.hideLoading();
            console.log(JSON.stringify(error));
            if( error.code === 1016 ){
              $scope.showAlert($translate.instant("alertMessages.error"), $translate.instant("alertMessages.userIdAlreadyExists"));          
            }
            else if( error.code === 1047 ){
              $scope.showAlert($translate.instant("alertMessages.error"), $translate.instant("alertMessages.invalidPhoneNumber"));          
            }
            else{
              $scope.showAlert($translate.instant("alertMessages.error"), $translate.instant("alertMessages.registeringError"));
            }
          });
      };
    }

})();