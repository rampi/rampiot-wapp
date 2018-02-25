(function() {
    'use strict';

    angular
        .module('rampiot')
        .controller('StepsController', StepsController);

    function StepsController($scope, $translate, $ionicPlatform, $state, $stateParams, ThingsService, LocalThingService) {
        $scope.SSID = "";
        var inv = {};
        var DEFAULT_TEXT = $translate.instant('thingRegistration.step1.header');
        var CONNECTED_TEXT = $translate.instant('thingRegistration.step1.connected');
        $scope.thing = $stateParams.thing ? $stateParams.thing : {};
        $scope.currentMessage = "";  
        $scope.thingConnected = false;
        $scope.nextStep = function(){
            $scope.showLoading();
            LocalThingService.info().
            success(function(data){
            $scope.hideLoading();            
            if( data && data._id ){        
                $scope.thingConnected = true;
                $state.go("step2", {thing: data});
            }             
            }).
            error(function(error){
            $scope.hideLoading();
            console.log(JSON.stringify(error));
            });    
        };
        $scope.signupThing = function(){            
            if( $scope.thing.ssid && $scope.thing.ssid.length < 3 && 
                $scope.thing.password && $scope.thing.password.length < 4 && 
                $scope.thing.name && $scope.thing.name.length < 3 && 
                $scope.Profile.userId ){
                $scope.showAlert($translate.instant("alertMessages.alert"), $translate.instant("alertMessages.missingData"));
                return;
            }
            $scope.showLoading();
            LocalThingService.configure($scope.thing.ssid, $scope.thing.password, $scope.thing.name, $scope.Profile.userId).
            success(function(data){
                $scope.hideLoading();
                $state.go('dash');
                swal.setDefaults({
                    showCancelButton: false,
                    animation: true,
                    progressSteps: ['1', '2']
                });
                var steps = [
                    {
                    type: 'success',            
                    title: $translate.instant("alertMessages.success"),
                    text: $translate.instant("thingRegistration.step3.header"),
                    confirmButtonText: $translate.instant("common.buttons.next")+' &rarr;'
                    },
                    {
                    type: 'warning',
                    title: $translate.instant("alertMessages.success"),
                    text: $translate.instant("thingRegistration.step3.subHeader"),
                    confirmButtonText: $translate.instant("common.buttons.close"),
                    }
                ];
                swal.queue(steps).then(function (result) {          
                    swal.resetDefaults();
                }, function () {
                    swal.resetDefaults();
                });
            }).
            error(function(error){
                $scope.hideLoading();
                $scope.showAlert($translate.instant("alertMessages.error"), $translate.instant("alertMessages.failSave"));
                console.log(JSON.stringify(error));
            });
        };
        if( !$stateParams.step || $stateParams.step === 1 ){
            $scope.currentMessage = DEFAULT_TEXT;    
            var wifiListener = function(){
            var networkState = navigator.connection.type;
            if( networkState === "wifi" ){
                WifiWizard.getCurrentSSID(function(ssid){
                ssid = ssid.replace(/\"/g, '');
                $scope.SSID = ssid;          
                if( $scope.SSID.indexOf("RAMPIOT") === 0 ){                       
                    if( !$scope.thingConnected ){
                    $scope.currentMessage = CONNECTED_TEXT.replace('$SSID', $scope.SSID);
                    $scope.thingConnected = true;
                    try{
                        $scope.$apply();
                    }catch(exc){}
                    }
                }else{            
                    $scope.currentMessage = DEFAULT_TEXT;
                    $scope.thingConnected = false;
                    try{
                    $scope.$apply();
                    }catch(exc){}
                }
                }, function(e){
                console.log(e);
                });
            }else{        
                $scope.currentMessage = DEFAULT_TEXT;
                $scope.thingConnected = false;
                try{
                $scope.$apply();
                }catch(exc){}
            }
            };    
        }
        $scope.$on('$ionicView.afterEnter', function(){
            if( !$stateParams.step || $stateParams.step === 1 ){
                wifiListener();
                inv = setInterval(wifiListener, 3000);
            }
        });
        $scope.$on('$ionicView.leave', function(){
            if( !$stateParams.step || $stateParams.step === 1 ){
                clearInterval(inv);
            }
        });
    }

})();