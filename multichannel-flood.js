/*
Multichannel Flood
(c) Roger Foxcroft

This script takes input on channel 1 and "floods" the other channels with it up to the limit set
by MAX_CHANNEL at the top of the script. This counts for all events.
*/

var MAX_CHANNEL = 8;
var PluginParameters = [
  {name: "Channels", minValue: 1, maxValue: 16, defaultValue: 8, type: "lin", numberOfSteps: 15}];

function ParameterChanges(param, value) {
  if (param == 0) {
    MAX_CHANNEL = value;
  }
}

function HandleMIDI(event)
{
  if (event.channel == 1) {
    for (channel = 2; channel <= MAX_CHANNEL; channel++) {
      var newEvent;
      
      if (event instanceof NoteOn) newEvent = new NoteOn();
      else if (event instanceof NoteOff) newEvent = new NoteOff();
      else if (event instanceof ControlChange) newEvent = new ControlChange();
      
      newEvent.pitch = event.pitch;
      newEvent.channel = event.channel;
      newEvent.velocity = event.velocity;
      event.send();
    }
  }
}
