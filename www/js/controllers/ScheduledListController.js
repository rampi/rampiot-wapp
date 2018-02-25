(function() {
    'use strict';

    angular
        .module('rampiot')
        .controller('ScheduledListController', ScheduledListController);

    function ScheduledListController($scope, $translate, $state, $stateParams, ThingsService){
      $scope.thing = $stateParams.thing;
      $scope.scheduleds = $stateParams.scheduleds;
      $scope._new = function(){
        $state.go('scheduled-new', {thing: $scope.thing});
      };
      $scope.delete = function(index, scheduledId){
          var doDelete = function(){
            $scope.showLoading();
            ThingsService.deleteScheduled($scope.Profile.userId, $scope.thing._id, scheduledId, $scope.Profile.token).
            success(function(data){
              $scope.hideLoading();
              $scope.scheduleds.splice(index,1);
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