/*
Velocity Channel Switch
(c) Roger Foxcroft 24th Feb 2014

This generic script increments the channel if the velocity exceeds the specified threshold. This is useful for
applying velocity switches to patches that don't normally have one. To modify the switch point change the 
VELOCITY_SWITCH value to something between 1 and 127. 
*/

var VELOCITY_SWITCH = 110;
var currentNotes = {};

function HandleMIDI(event)
{
  if (event instanceof NoteOn) {
    if (event.velocity >= VELOCITY_SWITCH) {
      event.channel++;
    }
  
    currentNotes[event.pitch] = event;
    traceAndSend(event);
  }
  else if (event instanceof NoteOff) {
    // remap the NoteOff to the original channel
    event.channel = currentNotes[event.pitch].channel;
    currentNotes[event.pitch] = null;
    traceAndSend(event);  
  }	
}

function traceAndSend(event) {
  event.trace();
  event.send();
}
