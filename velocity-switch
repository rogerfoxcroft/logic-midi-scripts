/*
Velocity Channel Switch
(c) Roger Foxcroft 24th Feb 2014

Maps up to four velocity ranges onto MIDI channels 1-4. In additive mode, a note is sent to every
channel whose threshold is met. Otherwise, the note is sent only to the highest matching range.
*/

var currentNotes = {};

var PluginParameters = [
  {
    name: "Additive",
    type: "menu",
    valueStrings: ["Off", "On"],
    defaultValue: 0
  },
  {
    name: "Number of ranges",
    type: "lin",
    minValue: 1,
    maxValue: 4,
    numberOfSteps: 3,
    defaultValue: 2
  },
  {
    name: "Range 2 min velocity",
    type: "lin",
    minValue: 1,
    maxValue: 127,
    numberOfSteps: 126,
    defaultValue: 60,
    hidden: false
  },
  {
    name: "Range 3 min velocity",
    type: "lin",
    minValue: 1,
    maxValue: 127,
    numberOfSteps: 126,
    defaultValue: 80,
    hidden: true
  },
  {
    name: "Range 4 min velocity",
    type: "lin",
    minValue: 1,
    maxValue: 127,
    numberOfSteps: 126,
    defaultValue: 100,
    hidden: true
  }
];

function ParameterChanged(param, value)
{
  if (param === 1) {
    updateRangeVisibility(value);
  }
}

function HandleMIDI(event)
{
  if (event instanceof NoteOn) {
    var outputChannels = getOutputChannels(event.velocity);
    var noteKey = getNoteKey(event);

    currentNotes[noteKey] = currentNotes[noteKey] || [];
    currentNotes[noteKey].push(outputChannels);

    for (var i = 0; i < outputChannels.length; i++) {
      var noteOn = new NoteOn();
      noteOn.pitch = event.pitch;
      noteOn.velocity = event.velocity;
      noteOn.channel = outputChannels[i];
      traceAndSend(noteOn);
    }
    return;
  }

  if (event instanceof NoteOff) {
    var activeNotes = currentNotes[getNoteKey(event)];
    var releasedChannels = activeNotes && activeNotes.length > 0 ? activeNotes.pop() : [];

    for (var j = 0; j < releasedChannels.length; j++) {
      var noteOff = new NoteOff();
      noteOff.pitch = event.pitch;
      noteOff.velocity = event.velocity;
      noteOff.channel = releasedChannels[j];
      traceAndSend(noteOff);
    }
    return;
  }

  traceAndSend(event);
}

function getOutputChannels(velocity)
{
  var additive = GetParameter("Additive") === 1;
  var rangeCount = GetParameter("Number of ranges");
  var thresholds = getRangeThresholds(rangeCount);
  var channels = [];

  for (var i = 0; i < thresholds.length; i++) {
    if (velocity >= thresholds[i]) {
      if (additive) {
        channels.push(i + 1);
      } else {
        channels = [i + 1];
      }
    }
  }

  return channels.length > 0 ? channels : [1];
}

function getRangeThresholds(rangeCount)
{
  var thresholds = [1];

  if (rangeCount >= 2) {
    thresholds.push(Math.max(thresholds[0], GetParameter("Range 2 min velocity")));
  }
  if (rangeCount >= 3) {
    thresholds.push(Math.max(thresholds[1], GetParameter("Range 3 min velocity")));
  }
  if (rangeCount >= 4) {
    thresholds.push(Math.max(thresholds[2], GetParameter("Range 4 min velocity")));
  }

  return thresholds;
}

function getNoteKey(event)
{
  return event.channel + ":" + event.pitch;
}

function traceAndSend(event) {
  event.trace();
  event.send();
}

function updateRangeVisibility(rangeCount)
{
  PluginParameters[2].hidden = rangeCount < 2;
  PluginParameters[3].hidden = rangeCount < 3;
  PluginParameters[4].hidden = rangeCount < 4;
  UpdatePluginParameters();
}

updateRangeVisibility(GetParameter("Number of ranges"));
