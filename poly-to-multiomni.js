/*
Polyphony to Multi-Monophony
(c) 2014 Roger Foxcroft

This script automatically splits chords incrementally across MIDI channels. Essentially every time
a polyphonous note is played the next available channel is selected and used for that note. This does
mean a little careful playing is required, as playing legato can mean using more channels than intended,
but does mean you can, with a little care, and some slight arpeggiation you can play a wind trio on
one part, in one hand.

There is also an optional MAX_CHANNELS variable, which will limit the number of channels that are used. Once
MAX_CHANNELS notes are being held all subsequent notes will be played using the same channel specified in
MAX_CHANNELS. This defaults to 3, which means that your first note is channel 1, your second is channel 2 and all
other notes in a chord will be channel 3.
*/

var currentNotes = {};
var currentChannels = {};
var MAX_CHANNEL = 3;

function HandleMIDI(event)
{
  if (event instanceof NoteOn) {
    // Use the next free channel
    for (channel = 1; channel <= MAX_CHANNEL; channel++) {
      if (currentChannels[channel] == null) {
        // Found one
        event.channel = channel;
        currentChannels[channel] = event;
        break;
      }
    }
    
    if (channel > MAX_CHANNEL) {
      // Didn't find a free channel, so reuse the top channel, just to make sure we get something played
      event.channel = MAX_CHANNEL;
    }
    
    currentNotes[event.pitch] = event;
  }
  else if (event instanceof NoteOff) {
    // Clear record of this pitch being used, and use the original channel for the NoteOff
    if (currentNotes[event.pitch] != null) {
      event.channel = currentNotes[event.pitch].channel;
      currentNotes[event.pitch] = null;

      // Clear record of this channel being used
      currentChannels[event.channel] = null;    
    }
  }
	
	event.trace();
	event.send();
}
