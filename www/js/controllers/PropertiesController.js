(function() {
    'use strict';

    angular
        .module('rampiot')
        .controller('PropertiesController', PropertiesController);

    function PropertiesController($scope, $translate, $rootScope, ionicToast, $state, $stateParams, ThingsService){
        var thing = $stateParams.thing;
        var thingType = thing.type; 
        $scope.schema =  thingType.propertiesSchema;        
        $scope.model = thing.properties ? thing.properties : {};
        $scope.form = [
            "*",
            {
                type: "submit",
                style: "button-block button-dark",
                title: $translate.instant("common.buttons.save")
            }
        ];
        $scope.onSubmit = function(form){
            $scope.showLoading();
            ThingsService.updateProperties(thing._id, $scope.model, $scope.Profile.token).
            success(function(data){
                $scope.hideLoading();
                $state.go('dash');
                ionicToast.show($translate.instant("alertMessages.successSave"), 'bottom', false, 5000);
            }).
            error(function(error){
                console.log(JSON.stringify(error));
                $scope.hideLoading();
                $scope.showAlert($translate.instant("alertMessages.error"), $translate.instant("alertMessages.updatePropertiesError"));
            });
        };
    }

})();