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

var MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
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
var TURBINE_FALLOFF = 0.97;
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

  zeroPad: function(num) {
    if (num < 10) { return "0" + num}
    return num.toString();
  },
};



/** Better sound class */

var Sound = function(file, loop) {
  this.audio = new Audio(file);
  this.audio.load();
  if (loop) {
    this.loop = this.audio.loop = true;
    this.audio.volume = 0;
    this.audio.play();
  }
};


Sound.prototype.play = function() {
  if (this.loop) {
    this.audio.volume = 1;
  } else {
    this.audio.currentTime = 0;
    this.audio.play();
  }
};


Sound.prototype.mute = function() {
  if (this.loop) {
    this.audio.volume = 0;
  } else {
    this.audio.pause();
  }
};


Sound.prototype.setVolume = function(volume) {
  this.audio.volume = volume;
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
    bucket.audioLoop = new Sound(bucket.loop, true);
  }

  // Member tuplet loops
  this.memberLoops = [];
  this.activeMemberLoop = null;
  for (var i = 1; i < 9; i++) {
    var audio = new Sound('snd/tuplet-' + i + '.mp3');
    this.memberLoops.push(audio);
  }

  // Create audio references.
  this.bucketUp = new Sound('snd/bracket_up.mp3');
  this.bucketDown = new Sound('snd/bracket_down.mp3');
  this.buyClick = new Sound('snd/buy-click.mp3');
  this.buyHover = new Sound('snd/buy-hover.mp3');
  this.membersUp = new Sound('snd/members-up.mp3');
  this.membersDown = new Sound('snd/members-down.mp3');
  this.household = new Sound('snd/household-hover.mp3', true);
  this.wind = new Sound('snd/wind-loop.mp3', true);
  this.secondCounter = new Sound('snd/second-counter.mp3');

  // Convo audio loops
  this.convoLoopDk = new Sound('snd/convo-loop-dk.mp3', true);
  this.convoLoopEury = new Sound('snd/convo-loop-eury.mp3', true);
  this.convoLoopPluto = new Sound('snd/convo-loop-pluto.mp3', true);
  this.convoLoopUbu = new Sound('snd/convo-loop-ubu.mp3', true);
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
    var audio = new Sound('snd/lil-piano' + i + '.mp3');
    this.pianoSounds.push(audio);
  }
  this.activePianoIndex = numPianoSounds;
};


Assets.prototype.getImages = function() {
  return $('img');
}


Assets.prototype.playHousehold = function() {
  this.household.play();
};


Assets.prototype.stopHousehold = function() {
  this.household.mute();
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
  this.price = null;
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


Model.prototype.computedPrice = function() {
  var computedPrice = this.price - this.moneyEarned;
  return Math.max(0, Math.round(computedPrice * 100) / 100);
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

  this.ticket = {
    year: $('.ticket-year'),
    month: $('.ticket-month'),
    day: $('.ticket-day'),
    date: $('.ticket-date'),
    time: $('.ticket-time'),
  };

  // Set initial slider value
  this.input.val(INITIAL_INCOME_SLIDER);

  // Set initial ticket date
  this.displayDate();
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


View.prototype.displayIncomeAndPrice = function() {
  var displayedIncome = this.model.income / this.model.granularity;
  if (displayedIncome % 1 != 0) {
    displayedIncome = displayedIncome.toFixed(2);
  }
  this.incomeLabel.text('$' + util.addCommas(displayedIncome));
  this.displayPrice();
};


View.prototype.displayPrice = function() {
  this.ticketPriceLabel.text('$' + this.model.computedPrice());
  this.priceLabel.text('$' + util.addCommas(this.model.computedPrice()));
}


View.prototype.displayMoneyEarned = function() {
  this.moneyEarned.text(this.model.moneyEarned.toFixed(2));
};


View.prototype.displayDate = function() {
  var now = new Date();
  this.ticket.day.text(now.getDay());
  this.ticket.month.text(MONTH_NAMES[now.getMonth()]);
  this.ticket.year.text(now.getFullYear());
  this.ticket.date.text(
      (now.getMonth() + 1) + '/' +
      now.getDate() + '/' +
      now.getFullYear().toString().substr(2));
  this.ticket.time.text(
      util.zeroPad(now.getHours()) + ':' +
      util.zeroPad(now.getMinutes()) + ':' +
      util.zeroPad(now.getSeconds()));
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
  window.setInterval(this.updateSeconds.bind(this), 1000);
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
  this.assets.wind.setVolume(windPower);

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
  this.model.price = price;
  this.model.moneyEarned = 0;
  this.view.displayMoneyEarned();
  this.view.displayIncomeAndPrice();
};


Controller.prototype.updateSeconds = function() {
  if (this.model.turbineVelocity < 1) {
    return;
  }
  this.view.displayDate();
  var moneyEarned =
      this.model.moneyEarned + this.model.income / (2080 * 60 * 60);
  if (this.model.moneyEarned.toFixed(2) != moneyEarned.toFixed(2)) {
    this.assets.secondCounter.play();
  }
  this.model.moneyEarned = moneyEarned;
  this.view.displayMoneyEarned();
  this.view.displayPrice();
};


Controller.prototype.setBucketActive = function(bucket) {
  var incomeIncreased = true;
  if (this.model.activeBucket) {
    this.model.activeBucket.audioLoop.mute();
  }
  if (bucket) {
    if (this.model.activeBucket) {
      incomeIncreased = bucket.income >= this.model.activeBucket.income;
    }
    bucket.audioLoop.play();
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
  var url = 'https://leafo.itch.io/x-moon/purchase?popup=1&price=' + Math.floor(this.model.computedPrice() * 100);
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
  this.audioLoop.setVolume(value);
};



/** LoadingController */

var LoadingController = function(assets) {
  this.assets = assets;
  this.images = this.assets.getImages();
  this.loadingOverlay = $('.loading-overlay');
  this.loaded = false;
  this.onLoadCallback = null;
  setTimeout(this.checkLoaded.bind(this), 10);
};


LoadingController.prototype.onLoad = function(callback) {
  if (this.loaded) {
    callback();
  } else {
    this.onLoadCallback = callback;
  }
};


LoadingController.prototype.checkLoaded = function() {
  var allComplete = true;
  for (var i =0; i < this.images.length; i++) {
    var image = this.images[i];
    if (!image.complete) {
      allComplete = false;
      break;
    }
  }
  if (allComplete) {
    this.loadingOverlay.remove();
    this.loaded = true;
    if (this.onLoadCallback) {
      this.onLoadCallback();
      this.onLoadCallback = null;
    }
  } else {
    setTimeout(this.checkLoaded.bind(this), 10);
  }
};


/** Init */

var Application = function() {
  var assets = new Assets();
  var loadingController = new LoadingController(assets);
  loadingController.onLoad(function() {
    var model = new Model();
    var view = new View(model);
    var controller = new Controller(model, view, assets);
  });
}

$(function() { new Application() });
