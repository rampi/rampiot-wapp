(function() {
    'use strict';
  
  angular
      .module('rampiot')
      .controller('ForgotController', ForgotController);

  function ForgotController($scope, $translate, $rootScope, $ionicPlatform, $state, Utils, UsersService) {
    $scope.forgot = {};
    $scope.send = function(){
      if( Utils.validateEmail($scope.forgot.email) ){
        $scope.showLoading();
        UsersService.forgotPassword($scope.forgot.email).
        success(function(resp){
          $scope.hideLoading();
          $scope.showAlert($translate.instant("alertMessages.info"), $translate.instant("alertMessages.newPasswordSentToEmail"));
          $state.go('login');
        }).
        error(function(error){
          $scope.hideLoading();
          if( error.code === 404 ){
            $scope.showAlert($translate.instant("alertMessages.error"), $translate.instant("alertMessages.emailNotFound"));          
          }else{
            $scope.showAlert($translate.instant("alertMessages.error"), $translate.instant("alertMessages.errorSendingPass"));
          }
        });
      }else{
        $scope.showAlert($translate.instant("alertMessages.error"), $translate.instant("alertMessages.invalidEmailFormat"));      
      }
    };
  }

})();