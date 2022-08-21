const audioContext = new (window.AudioContext || window.webkitAudioContext)();
let oscList = [];
let mainGainNode = null;

const keyboard = document.querySelector(".keyboard");
const wavePicker = document.querySelector("select[name='waveform']");
const volumeControl = document.querySelector("input[name='volume']");

let noteFreq = null;
let customWaveform = null;
let sineTerms = null;
let cosineTerms = null;

const note_names = [
  ["ラ", "", "A", ""],
  ["ラ#", "シ$\\flat$", "A#", "B$\\flat$"],
  ["シ", "", "B", ""],
  ["ド", "", "C", ""],
  ["ド#", "レ$\\flat$", "C#", "D$\\flat$"],
  ["レ", "", "D", ""],
  ["レ#", "ミ$\\flat$", "D#", "E$\\flat$"],
  ["ミ", "", "E", ""],
  ["ファ", "", "F", ""],
  ["ファ#", "ソ$\\flat$", "F#", "G$\\flat$"],
  ["ソ", "", "G", ""],
  ["ソ#", "ラ$\\flat$", "G#", "A$\\flat$"]
];

setup();

// -------------------------------------------------------
// functions
// -------------------------------------------------------

function createNoteTable() {
  let noteFreq = [];
  for (let octave = 0; octave < 9; octave++) {
    noteFreq[octave] = [];
  }

  for (let n = 0; n < 88; n++) {
    const frequency = getAudioFrequency(n);

    let octave = parseInt(n / 12);
    if (n % 12 >= 3) {
      octave++;
    }

    const note_name_sharp_japanese = note_names[n % 12][0];
    noteFreq[octave][note_name_sharp_japanese] = frequency;
  }

  return noteFreq;
}

function getAudioFrequency(n) {
  return 27.5 * Math.pow(Math.pow(2, 1 / 12), n);
}

function setup() {
  noteFreq = createNoteTable();

  volumeControl.addEventListener("change", changeVolume, false);

  mainGainNode = audioContext.createGain();
  mainGainNode.connect(audioContext.destination);
  mainGainNode.gain.value = volumeControl.value;

  noteFreq.forEach(function (keys, idx) {
    const keyList = Object.entries(keys);
    const octaveElem = document.createElement("div");
    octaveElem.className = "octave";

    keyList.forEach(function (key) {
      const key_name = key[0];
      if (
        key_name === "ド" ||
        key_name === "レ" ||
        key_name === "ミ" ||
        key_name === "ファ" ||
        key_name === "ソ" ||
        key_name === "ラ" ||
        key_name === "シ"
      ) {
        octaveElem.appendChild(createKey(key_name, idx, key[1], "white-key"));
      } else {
        octaveElem.appendChild(createKey(key_name, idx, key[1], "black-key"));
      }
    });

    keyboard.appendChild(octaveElem);
  });

  document
    .querySelector("div[data-note='ファ'][data-octave='5']")
    .scrollIntoView(false);

  sineTerms = new Float32Array([0, 0, 1, 0, 1]);
  cosineTerms = new Float32Array(sineTerms.length);
  customWaveform = audioContext.createPeriodicWave(cosineTerms, sineTerms);

  for (let i = 0; i < 9; i++) {
    oscList[i] = {};
  }
}

function createKey(note, octave, freq, keyColor) {
  const keyElement = document.createElement("div");
  const labelElement = document.createElement("div");

  if (keyColor === "black-key") {
    keyElement.className = "key black-key";
  } else {
    keyElement.className = "key";
  }
  keyElement.dataset["octave"] = octave;
  keyElement.dataset["note"] = note;
  keyElement.dataset["frequency"] = freq;

  labelElement.innerHTML = note + "<sub>" + octave + "</sub>";
  keyElement.appendChild(labelElement);

  keyElement.addEventListener("mousedown", notePressed, false);
  keyElement.addEventListener("mouseup", noteReleased, false);
  keyElement.addEventListener("mouseleave", noteReleased, false);

  keyElement.addEventListener("touchstart", notePressed, false);
  keyElement.addEventListener("touchend", noteReleased, false);
  keyElement.addEventListener("touchmove", noteReleased, false);
  keyElement.addEventListener("touchcancel", noteReleased, false);

  return keyElement;
}

function playTone(freq) {
  const osc = audioContext.createOscillator();
  osc.connect(mainGainNode);

  const type = wavePicker.options[wavePicker.selectedIndex].value;

  if (type == "custom") {
    osc.setPeriodicWave(customWaveform);
  } else {
    osc.type = type;
  }

  osc.frequency.value = freq;
  osc.start();

  return osc;
}

function notePressed(event) {
  const dataset = event.target.dataset;

  if (!dataset["pressed"]) {
    const octave = +dataset["octave"];
    oscList[octave][dataset["note"]] = playTone(dataset["frequency"]);
    dataset["pressed"] = "yes";
  }
}

function noteReleased(event) {
  const dataset = event.target.dataset;

  if (dataset && dataset["pressed"]) {
    const octave = +dataset["octave"];
    oscList[octave][dataset["note"]].stop();
    delete oscList[octave][dataset["note"]];
    delete dataset["pressed"];
  }
}

function changeVolume(event) {
  mainGainNode.gain.value = volumeControl.value;
}
