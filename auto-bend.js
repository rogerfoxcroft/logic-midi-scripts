/*
This simple script will automatically bend a note up while it's held. This was programmed for an
auto timp bend (once I'd mapped PB for Timpani+) but I guess may have other uses.
*/

var MAX_BEND = 8191;
var MIN_BEND = -8192;
var activeBends = {};

var PluginParameters = [
  {
    name: "Direction",
    type: "menu",
    valueStrings: ["Bend Up", "Bend Down"],
    defaultValue: 0
  },
  {
    name: "Bend duration (ms)",
    type: "lin",
    minValue: 10,
    maxValue: 2000,
    numberOfSteps: 199,
    defaultValue: 800
  }
];

function HandleMIDI(evt)
{
  if (evt instanceof NoteOn) {
    activeBends[evt.channel] = {
      pitch: evt.pitch,
      startTime: Date.now(),
      lastValue: null
    };
    sendPitchBend(evt.channel, 0);
  }
  else if (evt instanceof NoteOff) {
    var activeBend = activeBends[evt.channel];
    if (activeBend != null && activeBend.pitch === evt.pitch) {
      delete activeBends[evt.channel];
      sendPitchBend(evt.channel, 0);
    }
  }
  
  evt.send();
}

function ProcessMIDI()
{
  var direction = GetParameter("Direction");
  var durationMs = GetParameter("Bend duration (ms)");
  var now = Date.now();

  for (var channel in activeBends) {
    var activeBend = activeBends[channel];
    var elapsedMs = now - activeBend.startTime;
    var progress = Math.min(1, elapsedMs / durationMs);
    var bendValue = direction === 0
      ? Math.round(progress * MAX_BEND)
      : Math.round(progress * MIN_BEND);

    if (bendValue !== activeBend.lastValue) {
      sendPitchBend(parseInt(channel, 10), bendValue);
      activeBend.lastValue = bendValue;
    }
  }
}

function sendPitchBend(channel, value)
{
  var pb = new PitchBend();
  pb.channel = channel;
  pb.value = value;
  pb.send();
}
