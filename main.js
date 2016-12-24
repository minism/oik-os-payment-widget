var BUCKETS = [
  {
    income: 20000,
    percent: 0.01,
    background: 'img/bg/0.jpg',
    loop: 'snd/loops/loop1.mp3',
  },
  {
    income: 35000,
    percent: 0.02,
    background: 'img/bg/1.jpg',
    loop: 'snd/loops/loop2.mp3',
  },
  {
    income: 60000,
    percent: 0.03,
    background: 'img/bg/2.jpg',
    loop: 'snd/loops/loop3.mp3',
  },
  {
    income: 100000,
    percent: 0.05,
    background: 'img/bg/3.jpg',
    loop: 'snd/loops/loop4.mp3',
  },
  {
    income: 180000,
    percent: 0.07,
    background: 'img/bg/4.jpg',
    loop: 'snd/loops/loop5.mp3',
  },
  {
    income: 270000,
    percent: 0.1,
    background: 'img/bg/5.jpg',
    loop: 'snd/loops/loop6.mp3',
  },
  {
    income: 500000,
    percent: 0.5,
    background: 'img/bg/6.jpg',
    loop: 'snd/loops/loop7.mp3',
  },
  {
    income: 1000000,
    percent: 1,
    background: 'img/bg/7.jpg',
    loop: 'snd/loops/loop8.mp3',
  },
];


// Pre-process all audio and attach elements to the buckets.
var audioLoops = [];
for (var i = 0; i < BUCKETS.length; i++) {
  var bucket = BUCKETS[i];
  bucket.audioLoop = new Audio(bucket.loop);
  bucket.audioLoop.loop = true;
  bucket.audioLoop.volume = 0;
  bucket.audioLoop.play();
}


// The currently active bucket, if any.
var activeBucket = null;


$(function() {
  var income = $('.income');
  var price = $('.price');
  var ticketPrice = $('.ticket-price');
  var body = $('body');

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
    if (!bucket) {
      return 0;
    }
    return Math.round(income * bucket.percent) / 100.0;
  };

  var displayPrice = function(amount) {
    price.text('$' + amount);
    ticketPrice.text('$' + amount);
  };

  var setBucketActive = function(bucket) {
    if (activeBucket) {
      activeBucket.audioLoop.volume = 0;
    }
    if (bucket) {
      bucket.audioLoop.volume = 1;
      body.css('background-image', "url(" + bucket.background + ")"); 
    } else {
      body.css('background-image', "");
    }
    activeBucket = bucket;
  };

  income.keyup(function(event) {
    // TODO: Add error handling to non-numerical input.
    var income = parseInt(event.target.value);
    var bucket = getBucketForIncome(income);
    setBucketActive(bucket);
    var price = getAdjustedPrice(income, bucket);
    displayPrice(price);
  });
});