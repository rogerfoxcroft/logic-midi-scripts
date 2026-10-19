
/*
 * Chord Retrigger - Configurable Split Point
 * For MainStage / Logic Pro Scripter
 *
 * Notes BELOW split point: retrigger held chord
 * Notes AT OR ABOVE split point: playable notes
 *
 * Default split: MIDI 40 (E1)
 */

// Build note-name dropdown (MIDI 0-127).
var noteNames = [];
var pitchNames = [
    "C", "C#", "D", "Eb", "E", "F",
    "F#", "G", "Ab", "A", "Bb", "B"
];

for (var i = 0; i < 128; i++) {
    var name = pitchNames[i % 12];
    var octave = Math.floor(i / 12) - 2;

    noteNames.push(name + octave + " (" + i + ")");
}

// MainStage Scripter interface
var PluginParameters = [
    {
        name: "Lowest Playable Note",
        type: "menu",
        valueStrings: noteNames,
        defaultValue: 40
    }
];

var splitPoint = 40;
var heldNotes = {};

function ParameterChanged(param, value) {
    if (param === 0) {
        splitPoint = value;
    }
}

function noteKey(channel, pitch) {
    return channel + ":" + pitch;
}

function retriggerChord() {
    var key, note, off, on;

    // Stop all currently held notes.
    for (key in heldNotes) {
        if (heldNotes.hasOwnProperty(key)) {
            note = heldNotes[key];

            off = new NoteOff();
            off.pitch = note.pitch;
            off.channel = note.channel;
            off.send();
        }
    }

    // Replay all currently held notes.
    for (key in heldNotes) {
        if (heldNotes.hasOwnProperty(key)) {
            note = heldNotes[key];

            on = new NoteOn();
            on.pitch = note.pitch;
            on.velocity = note.velocity;
            on.channel = note.channel;
            on.send();
        }
    }
}

function HandleMIDI(event) {

    if (event instanceof NoteOn) {

        // Treat NoteOn velocity 0 as NoteOff.
        if (event.velocity === 0) {
            if (event.pitch >= splitPoint) {
                delete heldNotes[
                    noteKey(event.channel, event.pitch)
                ];
                event.send();
            }
            return;
        }

        // Any key below split point retriggers chord.
        if (event.pitch < splitPoint) {
            retriggerChord();
            return;
        }

        // Store physically held playable notes.
        heldNotes[
            noteKey(event.channel, event.pitch)
        ] = {
            pitch: event.pitch,
            velocity: event.velocity,
            channel: event.channel
        };

        event.send();
        return;
    }

    if (event instanceof NoteOff) {

        // Trigger-key releases are ignored.
        if (event.pitch < splitPoint) {
            return;
        }

        delete heldNotes[
            noteKey(event.channel, event.pitch)
        ];

        event.send();
        return;
    }

    // Pass all other MIDI through.
    event.send();
}

function Reset() {
    heldNotes = {};
}
