angular.module('rampiot')
.factory('Utils', function(){
  var dayOfWeek = [
      {id: 0, name:'monday', checked: true},
      {id: 1, name:'tuesday', checked: true},
      {id: 2, name:'wednesday', checked: true},
      {id: 3, name:'thursday', checked: true},
      {id: 4, name:'friday', checked: true},
      {id: 5, name:'saturday', checked: true},
      {id: 6, name:'sunday', checked: true}
  ];
  return {
    validateEmail: function(email) {
        var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(email);
    },
    getDaysOfWeek: function(){
      return dayOfWeek;
    }
  };    
});