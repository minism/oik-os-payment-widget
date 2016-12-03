$(function() {
  var income = $('.income');
  var price = $('.price');

  var setPrice = function(amount) {
    price.text('$' + amount);
  };

  income.keypress(function(event) {
    // TODO: Add error handling to non-numerical input.
    var amount = parseInt(event.target.value);
    setPrice(amount / 100);
  });
});