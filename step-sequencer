/**
 * Simple step sequencer. Parameters:
 * seq - an array of arrays to sequence. The inner arrays play concurrently so you can step play chords
 * currentStep - used internally, if this is non-zero the sequence will start offset by that step
 * triggerNote - (optional) if present the sequence will only trigger when that note is played
 */

var PluginParameters =
{
    seq: [
        ['C3', 'E3'],
        ['D3'],
        ['E3', 'G3', 'C4'],
    ],
    currentStep: 0,
    triggerNote: 'A#2'
};

function HandleMIDI(event)
{
    if (PluginParameters.triggerNote && MIDI.noteNumber(PluginParameters.triggerNote) != event.pitch) {
        event.send();
        return;
    }

    var numberOfSteps = PluginParameters.seq.length - 1;

    if (event instanceof NoteOn) {
        for (var n = 0; n < PluginParameters.seq[PluginParameters.currentStep].length; n++) {
            newNote = new NoteOn();
            newNote.pitch = MIDI.noteNumber(PluginParameters.seq[PluginParameters.currentStep][n]);
            newNote.channel = event.channel;
            newNote.velocity = event.velocity;
            newNote.trace();
            newNote.send();
        }

        PluginParameters.currentStep++;

        if (PluginParameters.currentStep > numberOfSteps) {
            PluginParameters.currentStep = 0;
        }
    }

    if (event instanceof NoteOff) {
        var previousStep = (PluginParameters.currentStep == 0) ? numberOfSteps : PluginParameters.currentStep - 1;

        for (var n = 0; n < PluginParameters.seq[previousStep].length; n++) {
            newNote = new NoteOff();
            newNote.pitch = MIDI.noteNumber(PluginParameters.seq[previousStep][n]);
            newNote.channel = event.channel;
            newNote.velocity = event.velocity;
            newNote.trace();
            newNote.send();
        }
    }
}
