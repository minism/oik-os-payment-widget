var PRICE_BUCKETS = [
  {
    income: 20000,
    percent: 0.01,
    background: "img/bg/0.tif",
  },
  {
    income: 35000,
    percent: 0.02,
    background: "img/bg/1.tif",
  },
  {
    income: 60000,
    percent: 0.03,
    background: "img/bg/2.tif",
  },
  {
    income: 100000,
    percent: 0.05,
    background: "img/bg/3.tif",
  },
  {
    income: 180000,
    percent: 0.07,
    background: "img/bg/4.tif",
  },
  {
    income: 270000,
    percent: 0.1,
    background: "img/bg/5.tif",
  },
  {
    income: 500000,
    percent: 0.5,
    background: "img/bg/6.tif",
  },
  {
    income: 1000000,
    percent: 1,
    background: "img/bg/7.tif",
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