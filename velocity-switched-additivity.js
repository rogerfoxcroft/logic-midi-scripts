/*
Velocity Switched Additivity
(c) 2014 Roger Foxcroft

This script allows for the layering of more sounds based on velocity. Set the velocity for each channel
and then notes will be duplicated on more channels as the velocity increases. This allows, for instance,
a string base with brass layered on if played loud enough, with timps if you really smack the keys.
*/

var currentNotes = {};

var VELOCITY_SWITCHES = {};

VELOCITY_SWITCHES[0] = 0;
VELOCITY_SWITCHES[1] = 60;
VELOCITY_SWITCHES[2] = 80;
VELOCITY_SWITCHES[3] = 100;

function HandleMIDI(event)
{
  if (event instanceof NoteOn) {
    // for this plugin to work the incoming channel needs to be channel 1
    event.channel = 1;
  
    // Look to see if a velocity has been triggered
    for (v = VELOCITY_SWITCHES.length - 1; v >= 0; v--) {
      if (event.velocity > VELOCITY_SWITCHES[v]) {
        // Need to play the note on this channel
        newNote = new NoteOn;
        newNote.pitch = event.pitch;
        newNote.velocity = event.velocity;
        currentNotes[event.channel * event.pitch] = newNote;
        traceAndSend(newNote);        
      }
    }
  }
  else if (event instanceof NoteOff) {
    // remap and copy the NoteOff to the original channels
    event.channel = currentNotes[event.pitch].channel;
    
    // Look for a NoteOff on each channel
    for (ch = 1; ch < 16; ch++) {
      if ([ch * event.pitch] != null) {
        noteOff = new NoteOff;
        noteOff.channel = ch;
        noteOff.pitch = event.pitch;
        currentNotes[ch * event.pitch] = null;
        traceAndSend(noteOff);
      }
    }
  }	
  else {
    traceAndSend(event);  
  }	
}

function traceAndSend(event) {
  event.trace();
  event.send();
}
