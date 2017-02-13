/** Constants */

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

var OPACITY_MIN = 0;
var OPACITY_MAX = 0.6;
var OPACITY_FALLOFF = 100;
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



/** Pure functions */

var util = {
  floorTo: function(value, resolution) {
    return Math.floor(value / resolution) * resolution;
  },

  addCommas: function(value) {
    return value.toLocaleString();
  },

  sliderToIncome: function(sliderVal) {
    if (sliderVal <= 50) {
      return MIN_INCOME;
    } else if (sliderVal >= 100) {
      return MAX_INCOME;
    }
    var absIncome = Math.pow(CURVE_BASE, sliderVal) * CURVE_COEFFICIENT - 1;
    return util.floorTo(absIncome, 1000);
  },

  getBucketForIncome: function(income) {
    targetBucket = null;
    for (var i = 0; i < BUCKETS.length; i++) {
      var bucket = BUCKETS[i];
      if (income < bucket.income) {
        break;
      }
      targetBucket = bucket;
    }
    return targetBucket;
  },

  getAdjustedPrice: function(income, bucket, numMembers) {
    if (!bucket) {
      return 0;
    }
    return Math.round(income * bucket.percent / numMembers) / 100.0;
  },
};



/** Assets */

var Assets = function() {
  // Preload images immediately.
  for (var i = 0; i < BUCKETS.length; i++) {
    var image = new Image();
    image.src = BUCKETS[i].background;
  }

  // Pre-process all audio and attach elements to the buckets.
  var audioLoops = [];
  for (var i = 0; i < BUCKETS.length; i++) {
    var bucket = BUCKETS[i];
    bucket.audioLoop = new Audio(bucket.loop);
    bucket.audioLoop.loop = true;
    bucket.audioLoop.volume = 0;
    bucket.audioLoop.play();
  }

  // Member tuplet loops
  this.memberLoops = [];
  this.activeMemberLoop = null;
  for (var i = 1; i < 9; i++) {
    var audio = new Audio('snd/tuplet-' + i + '.mp3');
    audio.loop = true;
    audio.volume = 0;
    audio.play();
    this.memberLoops.push(audio);
  }

  // Create audio references.
  this.bucketUp = new Audio('snd/bracket_up.mp3');
  this.bucketDown = new Audio('snd/bracket_down.mp3');
  this.buyClick = new Audio('snd/buy-click.mp3');
  this.buyHover = new Audio('snd/buy-hover.mp3');
  this.donateClick = new Audio('snd/donate-click.mp3');
  this.donateHover = new Audio('snd/donate-hover.mp3');
  this.household = new Audio('snd/household-hover.mp3');
  this.membersUp = new Audio('snd/members-up.mp3');
  this.membersDown = new Audio('snd/members-down.mp3');

  // Wind
  this.wind = new Audio('snd/wind-loop.mp3');
  this.wind.loop = true;
  this.wind.volume = 0;
  this.wind.play();

  // Convo audio loops
  this.convoLoopDk = new Audio('snd/convo-loop-dk.mp3');
  this.convoLoopEury = new Audio('snd/convo-loop-eury.mp3');
  this.convoLoopPluto = new Audio('snd/convo-loop-pluto.mp3');
  this.convoLoopUbu = new Audio('snd/convo-loop-ubu.mp3');
};


Assets.prototype.playMembers = function(num) {
  if (this.activeMemberLoop) {
    this.activeMemberLoop.volume = 0;
  }
  this.activeMemberLoop = this.memberLoops[num-1];
  this.activeMemberLoop.volume = 1;
}



/** Model */

var Model = function() {
  this.bubbleLeftActive = false;
  this.joulesGenerated = 0;
  this.numMembers = 1;
  this.prevMouseX = null;
  this.prevMouseY = null;
  this.turbineOrientation = 0;
  this.turbineVelocity = 0;
  this.activeBucket = null;
};



/** View */

var View = function(model) {
  this.model = model;

  this.body = $('body');
  this.buyButton = $('#buy-button');
  this.donateButton = $('#donate-button');
  this.buyLink = $('.buy-link');
  this.household = $('.household');
  this.incomeLabel = $('.income-label');
  this.input = $('.income');
  this.joules = $('.joules');
  this.membersContainer = $('.members-container');
  this.membersDec = $('.members-dec');
  this.membersInc = $('.members-inc');
  this.oikos = $('.oikos');
  this.overlay = $('.overlay');
  this.priceLabel = $('.price');
  this.rotor = $('.wind-turbine-rotor');
  this.ticketPriceLabel = $('.ticket-price');

  // Set initial slider value
  this.input.val(INITIAL_INCOME_SLIDER);
};


View.prototype.render = function() {
  var rotateCss = 'rotate(' + this.model.turbineOrientation + 'deg)';
  this.rotor.css('-ms-transform', rotateCss);
  this.rotor.css('-webkit-transform', rotateCss);
  this.rotor.css('transform', rotateCss);

  this.joules.text(util.floorTo(this.model.turbineVelocity, 1));

  var opacity = Math.max(OPACITY_MIN,  OPACITY_MAX - this.model.turbineVelocity / OPACITY_FALLOFF);
  this.overlay.css('opacity', opacity);
};


View.prototype.displayBucket = function() {
  var bucket = this.model.activeBucket;
  if (bucket) {
    this.body.css('background-color', 'black');
    this.body.css('background-image', "url(" + bucket.background + ")"); 
  } else {
    this.body.css('background-color', 'white');
    this.body.css('background-image', '');
  }
};


View.prototype.displayMembers = function() {
  this.membersContainer.empty();
  for (var i = 0; i < this.model.numMembers; i++) {
    this.membersContainer.append($(MEMBER_IMAGE_HTML));
  }
}


View.prototype.displayIncomeAndPrice = function(income, price) {
  this.ticketPriceLabel.text('$' + price);
  this.priceLabel.text('$' + util.addCommas(price));
  this.incomeLabel.text('$' + util.addCommas(income));
};


View.prototype.getIncome = function() {
  return this.input.val();
};



/** Controller */

var Controller = function(model, view, assets) {
  this.model = model;
  this.view = view;
  this.assets = assets;

  // Setup events.
  this.view.input.on('input', this.updateIncome.bind(this));
  this.view.membersDec.click(this.handleAdjustMembers.bind(this, -1));
  this.view.membersInc.click(this.handleAdjustMembers.bind(this, 1));
  this.view.household.mouseenter(this.handleHouseholdIn.bind(this));
  this.view.household.mouseout(this.handleHouseholdOut.bind(this));
  this.view.buyLink.click(this.handleBuyButton.bind(this));
  $(document).mousemove(this.handleBodyMouseMove.bind(this));

  // Setup sound-only events.
  var self = this;
  this.view.buyButton.mouseenter(function() { self.assets.buyHover.play() });
  this.view.donateButton.mouseenter(function() { self.assets.donateHover.play() });
  this.view.buyButton.click(function() { self.assets.buyClick.play() });
  this.view.donateButton.click(function() { self.assets.donateClick.play() });

  // Create hover target controllers
  new HoverController($('.convo-dk'), $('.bubble-left'), this.assets.convoLoopDk);
  new HoverController($('.convo-eury'), $('.bubble-right'), this.assets.convoLoopEury);
  new HoverController($('.convo-pluto'), $('.pluto-left'), this.assets.convoLoopPluto);
  new HoverController($('.convo-ubu'), $('.pluto-right'), this.assets.convoLoopUbu);

  // Start update loop
  window.requestAnimationFrame(this.update.bind(this));
  this.updateIncome();
  this.assets.playMembers(this.model.numMembers);
};


Controller.prototype.update = function() {
  this.model.turbineVelocity = this.model.turbineVelocity * TURBINE_FALLOFF;
  this.model.joulesGenerated += this.model.turbineVelocity / 100;
  this.model.turbineOrientation = (this.model.turbineOrientation + this.model.turbineVelocity) % 360;

  // Update wind sound based on speed
  var windPower =
    1.0 - (Math.max(OPACITY_MIN,  OPACITY_MAX - this.model.turbineVelocity / OPACITY_FALLOFF)) / OPACITY_MAX;
  windPower += 0.1;
  this.assets.wind.volume = windPower;

  this.view.render();

  window.requestAnimationFrame(this.update.bind(this));
};


Controller.prototype.updateIncome = function() {
  var rawIncome = util.sliderToIncome(this.view.getIncome());
  income = Math.floor(rawIncome);
  var bucket = util.getBucketForIncome(income);
  if (bucket != this.model.activeBucket) {
    this.setBucketActive(bucket);
  }
  var price = util.getAdjustedPrice(income, bucket, this.model.numMembers);
  this.view.displayIncomeAndPrice(rawIncome, price);
};


Controller.prototype.setBucketActive = function(bucket) {
  var incomeIncreased = true;
  if (this.model.activeBucket) {
    this.model.activeBucket.audioLoop.volume = 0;
  }
  if (bucket) {
    if (this.model.activeBucket) {
      incomeIncreased = bucket.income >= this.model.activeBucket.income;
    }
    bucket.audioLoop.volume = 1;
  } else {
    incomeIncreased = false;
  }
  this.model.activeBucket = bucket;
  this.view.displayBucket();

  var bucketChangeAudio = incomeIncreased ? this.assets.bucketUp : this.assets.bucketDown;
  bucketChangeAudio.play();
};


Controller.prototype.handleBodyMouseMove = function(event) {
  if (this.model.prevMouseY && this.model.prevMouseX) {
    var dx = Math.abs(this.model.prevMouseX - event.clientX);
    var dy = Math.abs(this.model.prevMouseY - event.clientY);
    this.model.turbineVelocity += (dx + dy) / TURBINE_DAMPENING;
  }
  this.model.prevMouseX = event.clientX;
  this.model.prevMouseY = event.clientY;
};


Controller.prototype.handleAdjustMembers = function(delta) {
  if (delta > 0) {
    this.assets.membersUp.play();
  } else {
    this.assets.membersDown.play();
  }
  var newMembers = this.model.numMembers + delta;
  if (newMembers < MIN_MEMBERS || newMembers > MAX_MEMBERS) {
    return;
  }
  this.assets.playMembers(newMembers);
  this.model.numMembers = newMembers;
  this.view.displayMembers();
  this.updateIncome();
};


Controller.prototype.handleHouseholdIn = function(event) {
  this.assets.household.play();
  event.target.innerText = 'ο ἶ κ ο ς';
  event.target.className = 'household oikos';
};


Controller.prototype.handleHouseholdOut = function(event) {
  event.target.innerText = 'household';
  event.target.className = 'household';
};


Controller.prototype.handleBuyButton = function() {
  var width = 680;
  var height = 680;
  var top = (screen.height - height) / 2;
  var left = (screen.width - width) / 2;
  var params = 'scrollbars=1, resizable=no, width=' 
      + width + ', height=' + height + ', top='
      + top + ', left=' + left;
  var url = 'https://leafo.itch.io/x-moon/purchase?popup=1'
  var w = window.open(url, 'purchase', params);
  if (typeof w.focus === "function") {
    w.focus();
  }
};


/** HoverController */

var HoverController = function(hoverTarget, bubbleTarget, audioLoop) {
  this.hoverTarget = hoverTarget;
  this.bubbleTarget = bubbleTarget;
  this.audioLoop = audioLoop;
  this.hoverTarget.mouseenter(this.handleIn.bind(this));
  this.hoverTarget.mouseout(this.handleOut.bind(this));
};


HoverController.prototype.handleIn = function() {
  this.bubbleTarget.css('opacity', 1);
  this.audioLoop.play();
};


HoverController.prototype.handleOut = function() {
  this.bubbleTarget.css('opacity', 0);
};



/** Init */

var Application = function() {
  this.assets = new Assets();
  this.model = new Model();
  this.view = new View(this.model);
  this.controller = new Controller(this.model, this.view, this.assets);
}

$(function() { new Application() });
