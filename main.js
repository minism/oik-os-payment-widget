var PRICE_BUCKETS = [
  {
    income: 20000,
    percent: 0.02,
  },
  {
    income: 35000,
    percent: 0.02,
  },
  {
    income: 60000,
    percent: 0.03,
  },
  {
    income: 100000,
    percent: 0.05,
  },
  {
    income: 180000,
    percent: 0.07,
  },
  {
    income: 270000,
    percent: 0.1,
  },
  {
    income: 500000,
    percent: 0.5,
  },
  {
    income: 1000000,
    percent: 1,
  },
];


$(function() {
  var income = $('.income');
  var price = $('.price');
  var ticketPrice = $('.ticket-price');

  var getPriceFromIncome = function(income) {
    var lastPercent = 0;
    for (var i = 0; i < PRICE_BUCKETS.length; i++) {
      var bucket = PRICE_BUCKETS[i];
      if (income < bucket.income) {
        break;
      }
      lastPercent = bucket.percent;
    }
    return Math.round(income * lastPercent) / 100.0;
  };

  var displayPrice = function(amount) {
    price.text('$' + amount);
    ticketPrice.text('$' + amount);
  };

  income.keyup(function(event) {
    // TODO: Add error handling to non-numerical input.
    var income = parseInt(event.target.value);
    var price = getPriceFromIncome(income);
    displayPrice(price);
  });
});