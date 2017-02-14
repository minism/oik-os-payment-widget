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

  makeLoop: function(audio) {
    audio.loop = true;
    audio.volume = 0;
    audio.play();
    return audio;
  }
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
    bucket.audioLoop = util.makeLoop(new Audio(bucket.loop));
  }

  // Member tuplet loops
  this.memberLoops = [];
  this.activeMemberLoop = null;
  for (var i = 1; i < 9; i++) {
    var audio = new Audio('snd/tuplet-' + i + '.mp3');
    this.memberLoops.push(audio);
  }

  // Create audio references.
  this.bucketUp = new Audio('snd/bracket_up.mp3');
  this.bucketDown = new Audio('snd/bracket_down.mp3');
  this.buyClick = new Audio('snd/buy-click.mp3');
  this.buyHover = new Audio('snd/buy-hover.mp3');
  this.membersUp = new Audio('snd/members-up.mp3');
  this.membersDown = new Audio('snd/members-down.mp3');
  this.household = util.makeLoop(new Audio('snd/household-hover.mp3'));
  this.wind = util.makeLoop(new Audio('snd/wind-loop.mp3'));
  this.secondCounter = new Audio('snd/second-counter.mp3');

  // Convo audio loops
  this.convoLoopDk = util.makeLoop(new Audio('snd/convo-loop-dk.mp3'));
  this.convoLoopEury = util.makeLoop(new Audio('snd/convo-loop-eury.mp3'));
  this.convoLoopPluto = util.makeLoop(new Audio('snd/convo-loop-pluto.mp3'));
  this.convoLoopUbu = util.makeLoop(new Audio('snd/convo-loop-ubu.mp3'));
  var convoLoops = [
    this.convoLoopDk,
    this.convoLoopEury,
    this.convoLoopPluto,
    this.convoLoopUbu,
  ];

  // Piano samples
  var numPianoSounds = 12;
  this.pianoSounds = [];
  for (var i = 1; i < numPianoSounds + 1; i++) {
    var audio = new Audio('snd/lil-piano' + i + '.mp3');
    this.pianoSounds.push(audio);
  }
  this.activePianoIndex = numPianoSounds;
};


Assets.prototype.playHousehold = function() {
  this.household.volume = 1;
};


Assets.prototype.stopHousehold = function() {
  this.household.volume = 0;
};


Assets.prototype.playMembers = function(num) {
  this.activeMemberLoop = this.memberLoops[num-1];
  this.activeMemberLoop.play();
};


Assets.prototype.playPiano = function(delta) {
  this.activePianoIndex += delta;
  if (this.activePianoIndex >= this.pianoSounds.length) {
    this.activePianoIndex = 0;
  } else if (this.activePianoIndex < 0) {
    this.activePianoIndex = this.pianoSounds.length - 1;
  }
  this.pianoSounds[this.activePianoIndex].play();
};



/** Model */

var Model = function() {
  this.income = null;
  this.moneyEarned = 0;
  this.bubbleLeftActive = false;
  this.joulesGenerated = 0;
  this.numMembers = 1;
  this.prevMouseX = null;
  this.prevMouseY = null;
  this.turbineOrientation = 0;
  this.turbineVelocity = 0;
  this.activeBucket = null;
  this.lastWork = 0;
  this.granularity = 1;
};



/** View */

var View = function(model) {
  this.model = model;

  this.body = $('body');
  this.buyButton = $('#buy-button');
  this.buyLink = $('.buy-link');
  this.household = $('.household');
  this.incomeLabel = $('.income-label');
  this.input = $('.income');
  this.joules = $('.joules');
  this.watts = $('.watts');
  this.membersContainer = $('.members-container');
  this.membersDec = $('.members-dec');
  this.membersInc = $('.members-inc');
  this.oikos = $('.oikos');
  this.overlay = $('.overlay');
  this.priceLabel = $('.price');
  this.rotor = $('.wind-turbine-rotor');
  this.ticketPriceLabel = $('.ticket-price');
  this.granularity = $('#granularity');
  this.moneyEarned = $('.money-earned');

  // Set initial slider value
  this.input.val(INITIAL_INCOME_SLIDER);
};


View.prototype.render = function() {
  var rotateCss = 'rotate(' + this.model.turbineOrientation + 'deg)';
  this.rotor.css('-ms-transform', rotateCss);
  this.rotor.css('-webkit-transform', rotateCss);
  this.rotor.css('transform', rotateCss);

  this.joules.text(util.floorTo(this.model.lastWork, 1));
  this.watts.text(util.floorTo(this.model.turbineVelocity, 1));

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
  if (income % 1 != 0) {
    income = income.toFixed(2);
  }
  this.ticketPriceLabel.text('$' + price);
  this.priceLabel.text('$' + util.addCommas(price));
  this.incomeLabel.text('$' + util.addCommas(income));
};


View.prototype.displayMoneyEarned = function() {
  this.moneyEarned.text(this.model.moneyEarned.toFixed(2));
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
  this.view.granularity.change(this.handleChangeGranularity.bind(this));
  $(document).mousemove(this.handleBodyMouseMove.bind(this));

  // Setup sound-only events.
  var self = this;
  this.view.buyButton.mouseenter(function() { self.assets.buyHover.play() });
  this.view.buyButton.click(function() { self.assets.buyClick.play() });

  // Create hover target controllers
  this.hoverControllers = [
    new HoverController($('.convo-dk'), $('.bubble-left'), this.assets.convoLoopDk),
    new HoverController($('.convo-eury'), $('.bubble-right'), this.assets.convoLoopEury),
    new HoverController($('.convo-pluto'), $('.pluto-left'), this.assets.convoLoopPluto),
    new HoverController($('.convo-ubu'), $('.pluto-right'), this.assets.convoLoopUbu),
  ];

  // Start update loop
  window.requestAnimationFrame(this.update.bind(this));
  window.setInterval(this.updateMoneyCounter.bind(this), 1000);
  this.updateIncome();
  this.assets.playMembers(this.model.numMembers);
};


Controller.prototype.update = function() {
  this.model.turbineVelocity = this.model.turbineVelocity * TURBINE_FALLOFF;
  this.model.joulesGenerated += this.model.turbineVelocity / 100;
  this.model.turbineOrientation = (this.model.turbineOrientation + this.model.turbineVelocity) % 360;

  // Update hover controllers
  for (var i = 0; i < this.hoverControllers.length; i++) {
    this.hoverControllers[i].update();
  }

  // Update wind sound based on speed
  var windPower =
    1.0 - (Math.max(OPACITY_MIN,  OPACITY_MAX - this.model.turbineVelocity / OPACITY_FALLOFF)) / OPACITY_MAX;
  this.assets.wind.volume = windPower;

  this.view.render();

  window.requestAnimationFrame(this.update.bind(this));
};


Controller.prototype.updateIncome = function() {
  var rawIncome = util.sliderToIncome(this.view.getIncome());
  if (this.model.income !== null) {
    var delta = rawIncome > this.model.income ? 1 : -1;
    this.assets.playPiano(delta);
  }
  this.model.income = Math.floor(rawIncome);
  var bucket = util.getBucketForIncome(this.model.income);
  if (bucket != this.model.activeBucket) {
    this.setBucketActive(bucket);
  }
  var price = util.getAdjustedPrice(this.model.income, bucket, this.model.numMembers);
  this.view.displayIncomeAndPrice(this.model.income / this.model.granularity, price);
};


Controller.prototype.updateMoneyCounter = function() {
  var moneyEarned =
      this.model.moneyEarned + this.model.income / (2080 * 60 * 60);
  if (this.model.moneyEarned.toFixed(2) != moneyEarned.toFixed(2)) {
    this.assets.secondCounter.play();
  }
  this.model.moneyEarned = moneyEarned;
  this.view.displayMoneyEarned();
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
    var workGenerated = (dx + dy) / TURBINE_DAMPENING;
    this.model.lastWork = workGenerated * 100;
    this.model.turbineVelocity += workGenerated;
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
  this.assets.playHousehold();
  event.target.innerText = 'ο ἶ κ ο ς';
  event.target.className = 'household oikos';
};


Controller.prototype.handleHouseholdOut = function(event) {
  this.assets.stopHousehold();
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


Controller.prototype.handleChangeGranularity = function(event) {
  switch (event.target.value) {
    case 'annual':
      this.model.granularity = 1;
      break;
    case 'daily':
      this.model.granularity = 2080 / 8;
      break;
    case 'hourly':
      this.model.granularity = 2080;
      break;
    case 'secondly':
      this.model.granularity = 2080 * 60 * 60;
      break;
    default:
      break;
  }
  this.updateIncome();
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


HoverController.prototype.update = function() {
  var value = this.bubbleTarget.css('opacity');
  this.audioLoop.volume = value;
}


/** Init */

var Application = function() {
  this.assets = new Assets();
  this.model = new Model();
  this.view = new View(this.model);
  this.controller = new Controller(this.model, this.view, this.assets);
}

$(function() { new Application() });
