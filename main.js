var BUCKETS = [
  {
    income: 20000,
    percent: 0.01,
    background: 'img/bg/0.tif',
    loop: 'snd/loop1.wav',
  },
  {
    income: 35000,
    percent: 0.02,
    background: 'img/bg/1.tif',
    loop: 'snd/loop2.wav',
  },
  {
    income: 60000,
    percent: 0.03,
    background: 'img/bg/2.tif',
    loop: 'snd/loop3.wav',
  },
  {
    income: 100000,
    percent: 0.05,
    background: 'img/bg/3.tif',
    loop: 'snd/loop4.wav',
  },
  {
    income: 180000,
    percent: 0.07,
    background: 'img/bg/4.tif',
    loop: 'snd/loop5.wav',
  },
  {
    income: 270000,
    percent: 0.1,
    background: 'img/bg/5.tif',
    loop: 'snd/loop6.wav',
  },
  {
    income: 500000,
    percent: 0.5,
    background: 'img/bg/6.tif',
    loop: 'snd/loop7.wav',
  },
  {
    income: 1000000,
    percent: 1,
    background: 'img/bg/7.tif',
    loop: 'snd/loop8.wav',
  },
];


// Pre-process all audio and attach elements to the buckets.
var audioLoops = [];
for (var i = 0; i < BUCKETS.length; i++) {
  var bucket = BUCKETS[i];
  var audio = new Audio(bucket.loop);
  audio.loop = true;
  bucket.audioLoop = audio;
}


$(function() {
  var income = $('.income');
  var price = $('.price');
  var ticketPrice = $('.ticket-price');

  var getBucketForIncome = function(income) {
    targetBucket = null;
    for (var i = 0; i < BUCKETS.length; i++) {
      var bucket = BUCKETS[i];
      if (income < bucket.income) {
        break;
      }
      targetBucket = bucket;
    }
    return targetBucket;
  };

  var getAdjustedPrice = function(income, bucket) {
    return Math.round(income * bucket.percent) / 100.0;
  };

  var displayPrice = function(amount) {
    price.text('$' + amount);
    ticketPrice.text('$' + amount);
  };

  income.keyup(function(event) {
    // TODO: Add error handling to non-numerical input.
    var income = parseInt(event.target.value);
    var bucket = getBucketForIncome(income);
    var price = bucket ? getAdjustedPrice(income, bucket) : 0;
    displayPrice(price);
  });
});