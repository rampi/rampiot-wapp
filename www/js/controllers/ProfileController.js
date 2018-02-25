(function() {
    'use strict';

    angular
        .module('rampiot')
        .controller('ProfileController', ProfileController);

    function ProfileController($scope, $translate, $rootScope, ionicToast, $ionicPlatform, $ionicPopup, $state, Countries, UsersService, LocalStorage) {
      $scope.countries = Countries.get();
      $scope.data = {};
      $scope.Profile.country = Countries.getByCode($scope.Profile.countryCode);            
      var doUpdatePassword = function(){
        if( $scope.data.newPass !== $scope.data.confNewPass ){
          $scope.showAlert($translate.instant("alertMessages.error"), $translate.instant("alertMessages.passNotMatch"));      
          throw new Error('Passwords not match');
        }    
        if( !$scope.data.currentPass || $scope.data.currentPass.length < 7 || 
            !$scope.data.newPass || $scope.data.newPass.length < 7 ||
            !$scope.data.confNewPass || $scope.data.confNewPass.length < 7 ){      
          $scope.showAlert($translate.instant("alertMessages.error"), $translate.instant("alertMessages.passMustBe7Min"));
          throw new Error('Password length must be >= 7');
        }
        $scope.showLoading();
        UsersService.updatePassword($scope.Profile.userId, $scope.data.currentPass, $scope.data.newPass, $scope.Profile.token).
        success(function(data){
          $scope.hideLoading();
          $scope.logout();
          $scope.showAlert($translate.instant("alertMessages.info"), $translate.instant("alertMessages.passChanged"));      
        }).
        error(function(error){
          $scope.hideLoading();
          console.log(JSON.stringify(error));
          if( error.code === 404 ){
            $scope.showAlert($translate.instant("alertMessages.error"), $translate.instant("alertMessages.currentPassError"));
          }
          else if( error.code === 1016 ){
            $scope.showAlert($translate.instant("alertMessages.error"), $translate.instant("alertMessages.passMustBe7Min"));
          }
          else{
            $scope.showAlert($translate.instant("alertMessages.error"), $translate.instant("alertMessages.changePassError"));
          }
        });
      };  
      $scope.changePassword = function(){
        var myPopup = $ionicPopup.show({
        template: '<input placeholder="'+$translate.instant("common.others.currentPass")+'" type="password" ng-model="data.currentPass"><br/>'+
                  '<input placeholder="'+$translate.instant("common.others.newPass")+'" type="password" ng-model="data.newPass"><br/>'+
                  '<input placeholder="'+$translate.instant("common.others.retypeNewPass")+'" type="password" ng-model="data.confNewPass"><br/>',
        title: $translate.instant("alertMessages.changePassTitle"),
        subTitle: $translate.instant("alertMessages.changePassContent"),
        scope: $scope,
        buttons: [
          { text: $translate.instant("common.buttons.cancel") },
          {
            text: '<b>'+$translate.instant("common.buttons.update")+'</b>',
            type: 'button-positive',
            onTap: function(e) {          
              console.log(JSON.stringify($scope.data));
              try{
                doUpdatePassword();
              }catch(exc){
                e.preventDefault();
              }          
            }
          }
        ]
        });    
      };
      $scope.update = function(){        
        $scope.showLoading();
        UsersService.update(
          $scope.Profile.userId, $scope.Profile.name, $scope.Profile.lastName, 
          $scope.Profile.email, String($scope.Profile.phone.number), $scope.Profile.preferences.lang, 
          $scope.Profile.country.code, $scope.Profile.token, parseInt($scope.Profile.preferences.timezone)
        ).
        success(function(data){
          $scope.hideLoading();          
          LocalStorage.put('profile', JSON.stringify($scope.Profile));
          $translate.use( $scope.Profile.preferences.lang );
          $scope.onProfileUpdate();
          ionicToast.show($translate.instant("alertMessages.profileUpdatedOk"), 'bottom', false, 5000);
          $state.go('dash');
        }).
        error(function(error){
          console.log(JSON.stringify(error));
          $scope.hideLoading();
          if( error.code === 404 ){
            $scope.showAlert($translate.instant("alertMessages.error"), $translate.instant("alertMessages.userNotFound"));
          }
          else if( error.code === 1047 ){
            $scope.showAlert($translate.instant("alertMessages.error"), $translate.instant("alertMessages.invalidPhoneNumber"));
          }
          else{
            $scope.showAlert($translate.instant("alertMessages.error"), $translate.instant("alertMessages.errorUpdatingUser"));
          }      
        });
      };
    }

})();