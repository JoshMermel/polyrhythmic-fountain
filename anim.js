// validation
//   throws aren't closer together than dwell?
//   no throw larger than period.
// make dwell a percent instead of a constant?
// make colors a hash of the pattern so it's random but consistant?

var radius = 10;
var dwell = 10;
var dwell_distance = 4;
var pace = 1; 
var keyframe_count = 0;

// Fisher-Yates shuffles an array
function shuffle(array) {
  var m = array.length, t, i;
  while (m) {
    i = Math.floor(Math.random() * m--);
    t = array[m];
    array[m] = array[i];
    array[i] = t;
  }
  return array;
}

// Generates a random int in the range [min, max]
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

var palette=[ "#000000", "#1CE6FF", "#FF34FF", "#FF4A46", "#008941", "#006FA6",
  "#A30059", "#7A4900", "#0000A6", "#B79762", "#004D43", "#997D87", "#5A0007",
  "#809693", "#1B4400", "#4FC601", "#3B5DFF", "#4A3B53", "#FF2F80", "#61615A",
  "#BA0900", "#6B7900", "#00C2A0", "#B903AA", "#D16100", "#000035", "#7B4F4B",
  "#A1C299", "#300018", "#0AA6D8", "#013349", "#00846F", "#372101", "#FFB500",
  "#A079BF", "#CC0744", "#C0B9B2", "#001E09", "#00489C", "#6F0062", "#0CBD66",
  "#456D75", "#B77B68", "#7A87A1", "#788D66", "#885578", "#FF8A9A", "#D157A0",
  "#BEC459", "#456648", "#0086ED", "#886F4C", "#34362D", "#B4A8BD", "#00A6AA",
  "#452C2C", "#636375", "#A3C8C9", "#FF913F", "#938A81", "#575329", "#B05B6F",
  "#3B9700", "#04F757", "#C8A1A1", "#1E6E00", "#7900D7", "#A77500", "#6367A9",
  "#A05837", "#6B002C", "#772600", "#D790FF", "#9B9700", "#549E79", "#201625",
  "#72418F", "#BC23FF", "#99ADC0", "#3A2465", "#922329", "#5B4534", "#404E55",
  "#0089A3", "#CB7E98", "#A4E804", "#324E72", "#6A3A4C"]

function recolorRandomly() {
  let local_palette = shuffle(palette);
  for (let i = 0; i < lballs.length; i++) {
      lballs[i].color = local_palette[i % local_palette.length];
  }
  for (let i = 0; i < rballs.length; i++) {
      rballs[i].color = local_palette[(i + lballs.length) % local_palette.length];
  }
}

// returns up and down times when the current is x
function upDown(x, arr, period) {
  let ret = {};
  let up_idx = -1;
  // TODO(jmerm): convert to binary search lol
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] < x) {
      up_idx = i;
    } else {
      break;
    }
  }

  if (up_idx === -1) {
    ret.up_time = arr[arr.length - 1] - period;
    ret.down_time = arr[0];
  } else if (up_idx === arr.length - 1) {
    ret.up_time = arr[up_idx];
    ret.down_time = arr[0] + period;
  } else {
    ret.up_time = arr[up_idx];
    ret.down_time = arr[up_idx + 1];
  }

  return ret;
}

function maxTime(seq, period) {
  let copy = Array.from(seq);
  copy.push(copy[0] + period)
  copy.push(copy[1] + period)
  let diff = -1;
  for (let i = 0; i < copy.length - 2; i++) {
    if (copy[i + 2] - copy[i] > diff) {
      diff = copy[i + 2]- copy[i];
    }
  }
  return diff;
}

// landing times is a sorted array 
function Ball(toss_x, catch_x, landing_times, period, max) {
  this.toss_x = toss_x;
  this.catch_x = catch_x;
  this.x = 0;
  this.y = 0;
  this.landing_times = landing_times;
  this.period = period;
  this.max = max;
  // default to be set later.
  this.color = 0;
  this.updatePosition = function(keyframe_count) {
    keyframe_count %= period;
    let {up_time, down_time} = upDown(keyframe_count, this.landing_times, this.period);

//    if (down_time - keyframe_count > dwell) {
//      // toss
//      let progress = (keyframe_count - up_time) / (down_time - up_time - dwell);
//      this.x = this.toss_x + ((this.catch_x - this.toss_x) * progress);
//      this.y = (this.x - this.toss_x) * (this.x - this.catch_x) * (down_time - up_time) * (down_time - up_time) / 5;
//      this.y /= (this.max * this.max);
//    } else {
//      // dwell
//      let progress = (keyframe_count + dwell - down_time) / (dwell);
//      this.x = this.catch_x - ((this.catch_x - this.toss_x) * progress);
//      this.y = -1 * (this.x - this.toss_x) * (this.x - this.catch_x) / 100;
//    }
    let progress = (keyframe_count - up_time) / (down_time - up_time);
    if (progress < 0.9) {
      // toss
      progress /= 0.9;
      this.x = this.toss_x + ((this.catch_x - this.toss_x) * progress);
      this.y = (this.x - this.toss_x) * (this.x - this.catch_x) * (down_time - up_time) * (down_time - up_time) / 5;
      this.y /= (this.max * this.max);
    } else {
      // dwell
      progress -= 0.9;
      progress /= 0.1;
      this.x = this.catch_x - ((this.catch_x - this.toss_x) * progress);
      this.y = -1 * (this.x - this.toss_x) * (this.x - this.catch_x) / 100;
    }
    
    this.y += 550

  };
  this.drawSelf = function(ctx) {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, radius, 0, 2 * Math.PI);
    ctx.fill();
  };
}

var lballs = [];
var rballs = [];
function StartAnimation() {
  window.requestAnimationFrame(draw);
}

function clearButtonColor() {
  for (let i = 1; i <= 6; i++) {
    for (let j = 1; j <= 6; j++) {
      if (i !== j) {
        document.getElementById(i + "/" + j).removeAttribute("style");
      }
    }
  }
}

// Draws balls to the canvas when time = timestamp.
var last_draw_time = 0;
function draw(timestamp) {
  var delta = timestamp - last_draw_time;
  last_draw_time = timestamp;
  // on a 60fps screen, each frame should happen about every 16ms.
  keyframe_count += delta * pace / 16;
  var ctx = document.getElementById('canvas').getContext('2d');
  ctx.clearRect(0,0,canvas.width,canvas.height); 
  
  for (let ball of lballs) {
    ball.updatePosition(keyframe_count);
    ball.drawSelf(ctx);
  }
  for (let ball of rballs) {
    ball.updatePosition(keyframe_count);
    ball.drawSelf(ctx);
  }

  window.requestAnimationFrame(draw);
}

// TODO(jmerm) parametrize number of balls
function makeBalls(landing_times, period, toss_x, catch_x, max) {
  // first dupe the landing times so it's divisible by the number of balls
  let b1 = []
  let b2 = []
  let old_length = landing_times.length;
  for (let i = 0; i < old_length; i++) {
    landing_times.push(landing_times[i] + period);
  }
  for (let i = 0; i < landing_times.length; i+=2) {
    b1.push(landing_times[i]);
    b2.push(landing_times[i+1]);
  }
  return [new Ball(toss_x, catch_x, b1, 2 * period, max), new Ball(toss_x, catch_x, b2, 2 * period, max)];
}

function randomSeq(dwell, period) {
  let ret = [];
  ret.push(randInt(0, Math.min(period, 40)));
  while (ret[ret.length - 1] < period) {
    let tmp = ret[ret.length - 1] + dwell;
    tmp = randInt(tmp, tmp + 120);
    if (tmp < period) {
      ret.push(tmp);
    } else {
      return ret;
    }
  }
}

function toLandingTimes(str) {
  let landing_times = [];
  for (let time of str.split(",")) {
    landing_times.push(+time);
  }
  return landing_times;
}

function update_lballs(landing_times, period, max) {
  lballs = makeBalls(landing_times, period, 125, 25, max);
}
function update_rballs(landing_times, period, max) {
  rballs = makeBalls(landing_times, period, 225, 325, max);
}

// return an error if it's bad or empty string if it's good.
function validateLandingTimes(str) {
  let last = -1;
  for (let split of str.split(",")) {
    let tmp = +split;
    if (isNaN(tmp)) {
      return "failed to parse " + split + " as a number";
    } else if (tmp < 0) {
      return "times must be greater than 0";
    } else if (tmp < last) {
      return "times must be monotonically increasing";
    }
    last = tmp;
  }
  return "";
}

function doRandomArhythmically() {
  let period = randInt(100, 400);
  let lseq = randomSeq(dwell * 3, period);
  let rseq = randomSeq(dwell * 3, period);

  document.getElementById("left").value = lseq.join(",");
  document.getElementById("right").value = rseq.join(",");
  document.getElementById("period").value = period;

  let max = Math.max(maxTime(lseq, period), maxTime(rseq, period));

  update_lballs(lseq, period, max)
  update_rballs(rseq, period, max);
  recolorRandomly();
  clearButtonColor();
}

function doRandomNicely() {
  let l = randInt(2,6);
  let r = randInt(2,5);
  if (r >= l) {
    r += 1;
  }
  doRatio(l, r);
}

function doRatio(l, r) {
  let period = l * r * 10;
  while (period < 120) {
    period += l * r * 10;
  }
  let lseq = [];
  for (let i = 0; i < l; i++) {
    lseq.push(period * i / l)
  }
  let rseq = [];
  for (let i = 0; i < r; i++) {
    rseq.push(period * i / r)
  }

  document.getElementById("left").value = lseq.join(",");
  document.getElementById("right").value = rseq.join(",");
  document.getElementById("period").value = period;

  let max = Math.max(maxTime(lseq, period), maxTime(rseq, period));

  update_lballs(lseq, period, max)
  update_rballs(rseq, period, max);
  recolorRandomly();
  clearButtonColor();
  document.getElementById(l + "/" + r).setAttribute("style", "background-color:#86b3b1")
}

// TODO(jmerm): verify max throw is less than period
function updateAnimation(llanding_times_str, rlanding_times_str, period) {
  let err = validateLandingTimes(llanding_times_str);
  if (err !== "") {
    // TODO(jmerm): do something with this error
    console.log(err);
    return;
  }
  err = validateLandingTimes(rlanding_times_str);
  if (err !== "") {
    // TODO(jmerm): do something with this error
    console.log(err);
    return;
  }

  if (isNaN(period)) {
    // TODO(jmerm): do something with this error
    console.log("err");
    return;
  }
  if (period <= 0) {
    // TODO(jmerm): do something with this error
    console.log("err");
    return;
  }

  // update animations
  let lseq = toLandingTimes(llanding_times_str);
  let rseq = toLandingTimes(rlanding_times_str);
  let max = Math.max(maxTime(lseq, period), maxTime(rseq, period));
  update_lballs(lseq, period, max);
  update_rballs(rseq, period, max);
  recolorRandomly();
  clearButtonColor();
}
