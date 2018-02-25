(function() {
    'use strict';

    angular
        .module('rampiot')
        .controller('RulesListController', RulesListController);

    function RulesListController($scope, $rootScope, $translate, $state, $stateParams, ThingsService) {
        if( !$stateParams.thing ){
            $state.go("dash");
            return;
        }
        $scope.thing = $stateParams.thing;
        $scope.title = $scope.thing.name;
        $scope.rules = $stateParams.rules;        
        $scope.delete = function(index, ruleId){
          var doDelete = function(){
            $scope.showLoading();      
            ThingsService.deleteRules($scope.Profile.userId, $scope.thing._id, [ruleId], $scope.Profile.token).
            success(function(data){
              $scope.hideLoading();
              $scope.rules.splice(index,1);
            }).
            error(function(error){
              console.log("ERR: "+JSON.stringify(error));
              $scope.hideLoading();
            });
          };
          $scope.showConfirm($translate.instant("alertMessages.areYouSure"), doDelete);
        };        
    }

})();