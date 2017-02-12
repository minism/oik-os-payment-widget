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

var INITIAL_INCOME_SLIDER = 66;

var CURVE_COEFFICIENT = 100;
var CURVE_BASE = 1.1;

var MIN_INCOME = 0;
var MAX_INCOME = 1400000;

var MIN_MEMBERS = 1;
var MAX_MEMBERS = 8;

var TURBINE_DAMPENING = 200.0;
var TURBINE_FALLOFF = 0.98;

var CONVERSATION_BUBBLE_INTERVAL = 4000;

var MEMBER_IMAGE_HTML = '<img src="img/dogface.png">';


// Pre-process all audio and attach elements to the buckets.
var audioLoops = [];
for (var i = 0; i < BUCKETS.length; i++) {
  var bucket = BUCKETS[i];
  bucket.audioLoop = new Audio(bucket.loop);
  bucket.audioLoop.loop = true;
  bucket.audioLoop.volume = 0;
  bucket.audioLoop.play();
}
var BUCKET_UP_AUDIO = new Audio('snd/bracket_up.mp3');
var BUCKET_DOWN_AUDIO = new Audio('snd/bracket_down.mp3');


// The currently active bucket, if any.
var activeBucket = null;

$(function() {
  // Preload images immediately.
  for (var i = 0; i < BUCKETS.length; i++) {
    var image = new Image();
    image.src = BUCKETS[i].background;
  }

  // Assign element references.
  var input = $('.income');
  var priceLabel = $('.price');
  var incomeLabel = $('.income-label');
  var ticketPriceLabel = $('.ticket-price');
  var membersContainer = $('.members-container');
  var membersDec = $('.members-dec');
  var membersInc = $('.members-inc');
  var bubbleLeft = $('.bubble-left');
  var bubbleRight = $('.bubble-right');
  var household = $('.household');
  var oikos = $('.oikos');
  var body = $('body');
  var rotor = $('.wind-turbine-rotor');
  var joules = $('.joules');
  var overlay = $('.overlay');

  // Basic app "model"
  var numMembers = 1;
  var bubbleLeftActive = false;
  var turbineVelocity = 0;
  var turbineOrientation = 0;
  var prevMouseX = null;
  var prevMouseY = null;
  var joulesGenerated = 0;

  // Util functions.
  var floorTo = function(value, resolution) {
    return Math.floor(value / resolution) * resolution;
  };

  var addCommas = function(value) {
    return value.toLocaleString();
  }

  // Control functions.
  var sliderToIncome = function(sliderVal) {
    if (sliderVal <= 50) {
      return MIN_INCOME;
    } else if (sliderVal >= 100) {
      return MAX_INCOME;
    }
    var absIncome = Math.pow(CURVE_BASE, sliderVal) * CURVE_COEFFICIENT - 1;
    return floorTo(absIncome, 1000);
  };

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
    return Math.round(income * bucket.percent / numMembers) / 100.0;
  };

  var updateDisplay = function(income, price) {
    ticketPriceLabel.text('$' + price);
    priceLabel.text('$' + addCommas(price));
    incomeLabel.text('$' + addCommas(income));
  };

  var setBucketActive = function(bucket) {
    var incomeIncreased = true;
    if (activeBucket) {
      activeBucket.audioLoop.volume = 0;
    }
    if (bucket) {
      if (activeBucket) {
        incomeIncreased = bucket.income >= activeBucket.income;
      }
      bucket.audioLoop.volume = 1;
      body.css('background-color', 'black');
      body.css('background-image', "url(" + bucket.background + ")"); 
    } else {
      incomeIncreased = false;
      body.css('background-color', 'white');
      body.css('background-image', '');
    }
    activeBucket = bucket;

    var bucketChangeAudio = incomeIncreased ? BUCKET_UP_AUDIO : BUCKET_DOWN_AUDIO;
    bucketChangeAudio.play();
  };

  var adjustMembers = function(delta) {
    var newMembers = numMembers + delta;
    if (newMembers < MIN_MEMBERS || newMembers > MAX_MEMBERS) {
      return;
    }
    numMembers = newMembers;
    membersContainer.empty();
    for (var i = 0; i < numMembers; i++) {
      membersContainer.append($(MEMBER_IMAGE_HTML));
    }
    updateIncome();
  };

  var updateIncome = function() {
    var rawIncome = sliderToIncome(input.val());
    income = Math.floor(rawIncome);
    var bucket = getBucketForIncome(income);
    if (bucket != activeBucket) {
      setBucketActive(bucket);
    }
    var price = getAdjustedPrice(income, bucket);
    updateDisplay(rawIncome, price);
  };

  var updateConversation = function() {
    bubbleLeftActive = !bubbleLeftActive;
    if (bubbleLeftActive) {
      bubbleLeft.css('opacity', 1);
      bubbleRight.css('opacity', 0);
    } else {
      bubbleLeft.css('opacity', 0);
      bubbleRight.css('opacity', 1);
    }
  };

  var handleHouseholdIn = function(event) {
    event.target.innerText = 'ο ἶ κ ο ς';
    event.target.className = 'household oikos';
  };

  var handleHouseholdOut = function(event) {
    event.target.innerText = 'household';
    event.target.className = 'household';
  };

  var handleBodyMouseMove = function(event) {
    if (prevMouseY && prevMouseX) {
      var dx = Math.abs(prevMouseX - event.clientX);
      var dy = Math.abs(prevMouseY - event.clientY);
      turbineVelocity += (dx + dy) / TURBINE_DAMPENING;
    }
    prevMouseX = event.clientX;
    prevMouseY = event.clientY;
  };

  // Per-frame rendering
  var render = function() {
    turbineVelocity = turbineVelocity * TURBINE_FALLOFF;
    joulesGenerated += turbineVelocity / 100;
    turbineOrientation = (turbineOrientation + turbineVelocity) % 360;
    var rotateCss = 'rotate(' + turbineOrientation + 'deg)';
    rotor.css('-ms-transform', rotateCss);
    rotor.css('-webkit-transform', rotateCss);
    rotor.css('transform', rotateCss);

    joules.text(floorTo(turbineVelocity, 1));

    var opacity = Math.max(0,  0.6 - turbineVelocity / 100);
    overlay.css('opacity', opacity);

    window.requestAnimationFrame(render);
  }

  // Setup events.
  input.on('input', function(event) { updateIncome(); });
  membersDec.click(function(event) { adjustMembers(-1) });
  membersInc.click(function(event) { adjustMembers(1) });
  household.mouseenter(handleHouseholdIn);
  household.mouseout(handleHouseholdOut);
  $(document).mousemove(handleBodyMouseMove);
  setInterval(updateConversation, CONVERSATION_BUBBLE_INTERVAL);

  // Set initial slider value
  input.val(INITIAL_INCOME_SLIDER);
  updateIncome();

  window.requestAnimationFrame(render);
});