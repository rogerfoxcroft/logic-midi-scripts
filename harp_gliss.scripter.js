/*
 * Harp Gliss — MainStage Scripter script
 *
 * Turns any keypress into a diatonic gliss (harp-style scale sweep).
 * Sweep direction is controlled by the "Direction" parameter — map it
 * to a Screen Control (button or two-position knob) to switch between
 * one-way and round-trip glisses per patch.
 *
 *   Direction = "One Way"
 *     Sequence of N scale notes from Start Note to End Note in the
 *     configured Key + Scale. Velocity ramps LINEARLY from Start
 *     Velocity to End Velocity across the sweep.
 *
 *   Direction = "Round Trip"
 *     Sweeps out from Start Note to End Note, then straight back to
 *     Start Note — 2N-1 events. The turnaround note (End Note) plays
 *     once at the peak; every other note plays twice. Velocity is a
 *     TRIANGULAR ramp: Start Velocity at both ends, End Velocity at
 *     the peak.
 *
 * In both directions, if End Note is below Start Note the sweep goes
 * downward first (and back up, when Round Trip). Duration ms is total
 * time from first note-on to last regardless of direction.
 *
 * A harp is diatonic — glisses follow the notes of a scale, not a
 * chromatic run. Choose Scale = "Pentatonic Major" for the classic
 * black-key ("celtic") gliss, or "Major"/"Minor" for a seven-note
 * diatonic sweep.
 *
 * The incoming note-on is ABSORBED (not passed through). Non-note
 * events (CC, pitch bend, aftertouch, program change) pass through
 * untouched. Note-offs from the trigger key are absorbed because every
 * scheduled gliss note carries its own note-off.
 *
 * Parameters (visible in Scripter's parameter panel — map any of these
 * to Screen Controls for per-patch overrides):
 *
 *   Key            — tonic of the scale (C..B)
 *   Scale          — major, natural minor, dorian, mixolydian, pentatonic
 *   Start Note     — one end of the sweep (MIDI 0-127)
 *   End Note       — the other end / peak; if lower than Start, the
 *                    sweep goes downward first
 *   Duration ms    — total time from first note-on to last (default 500)
 *   Start Velocity — velocity at the sweep's start (One Way) or at
 *                    both ends (Round Trip); default 60
 *   End Velocity   — velocity at the sweep's end (One Way) or at the
 *                    peak / turnaround (Round Trip); default 100
 *   Note Length ms — how long each note sustains
 *   Direction      — One Way | Round Trip (default One Way)
 *
 * NOTE: "Direction" is appended to the parameter list so the index of
 * every earlier parameter (Key..Note Length) stays stable — existing
 * Screen Control mappings for Knobs 1-8 in the workspace layout keep
 * working; only a new control mapped to Direction is added on top.
 */

var PluginParameters = [
    { name: "Key", type: "menu",
      valueStrings: ["C", "C#", "D", "D#", "E", "F",
                     "F#", "G", "G#", "A", "A#", "B"],
      defaultValue: 0 },
    { name: "Scale", type: "menu",
      valueStrings: ["Major", "Natural Minor", "Dorian", "Mixolydian",
                     "Pentatonic Major"],
      defaultValue: 0 },
    { name: "Start Note", type: "lin",
      minValue: 0, maxValue: 127, numberOfSteps: 127,
      defaultValue: 36 },   // C2
    { name: "End Note", type: "lin",
      minValue: 0, maxValue: 127, numberOfSteps: 127,
      defaultValue: 96 },   // C7
    { name: "Duration ms", type: "lin",
      minValue: 50, maxValue: 3000, numberOfSteps: 2950,
      defaultValue: 500, unit: "ms" },
    { name: "Start Velocity", type: "lin",
      minValue: 1, maxValue: 127, numberOfSteps: 126,
      defaultValue: 60 },
    { name: "End Velocity", type: "lin",
      minValue: 1, maxValue: 127, numberOfSteps: 126,
      defaultValue: 100 },
    { name: "Note Length ms", type: "lin",
      minValue: 20, maxValue: 3000, numberOfSteps: 2980,
      defaultValue: 400, unit: "ms" },
    { name: "Direction", type: "menu",
      valueStrings: ["One Way", "Round Trip"],
      defaultValue: 0 }
];

// Pitch-class sets (semitones from tonic) for each scale option.
var SCALES = [
    [0, 2, 4, 5, 7, 9, 11],    // Major
    [0, 2, 3, 5, 7, 8, 10],    // Natural Minor
    [0, 2, 3, 5, 7, 9, 10],    // Dorian
    [0, 2, 4, 5, 7, 9, 10],    // Mixolydian
    [0, 2, 4, 7, 9]            // Pentatonic Major
];

function scaleNotes(keyPc, scale, lo, hi) {
    // Every MIDI note in [lo, hi] that belongs to (keyPc, scale).
    var out = [];
    for (var n = lo; n <= hi; n++) {
        var pc = ((n - keyPc) % 12 + 12) % 12;
        if (scale.indexOf(pc) >= 0) out.push(n);
    }
    return out;
}

function HandleMIDI(event) {
    if (event instanceof NoteOn) {
        var keyPc  = GetParameter("Key");
        var scale  = SCALES[GetParameter("Scale")];
        var startN = Math.round(GetParameter("Start Note"));
        var endN   = Math.round(GetParameter("End Note"));
        var duration = GetParameter("Duration ms");
        var vStart = GetParameter("Start Velocity");
        var vEnd   = GetParameter("End Velocity");
        var noteLen = GetParameter("Note Length ms");
        var roundTrip = GetParameter("Direction") === 1;

        var lo = Math.min(startN, endN);
        var hi = Math.max(startN, endN);
        var ascending = endN >= startN;
        var notes = scaleNotes(keyPc, scale, lo, hi);
        if (!ascending) notes.reverse();
        if (notes.length === 0) return;   // no notes in range

        // Build the pitch sequence and matching velocity envelope.
        //
        //   One Way    — notes as-is, linear vStart → vEnd across N.
        //   Round Trip — notes + reversed-minus-peak (2N-1 events),
        //                triangular vStart → vEnd → vStart, peaking on
        //                the End Note in the middle.
        var sequence;
        var peakIndex;
        if (roundTrip) {
            sequence = notes.slice();
            for (var i = notes.length - 2; i >= 0; i--) {
                sequence.push(notes[i]);
            }
            peakIndex = notes.length - 1;
        } else {
            sequence = notes;
            peakIndex = notes.length - 1;
        }

        var totalEvents = sequence.length;
        var stepMs = duration / Math.max(totalEvents - 1, 1);

        for (var k = 0; k < totalEvents; k++) {
            // Distance-from-start (One Way) or from-nearest-end
            // (Round Trip), both normalised to 0..1 so vel interpolates
            // vStart..vEnd the same way.
            var d;
            if (peakIndex === 0) {
                d = 0;   // degenerate: only one scale note in range
            } else if (!roundTrip) {
                d = k / peakIndex;
            } else if (k <= peakIndex) {
                d = k / peakIndex;
            } else {
                d = (totalEvents - 1 - k) / peakIndex;
            }
            var vel = Math.max(1, Math.min(127,
                Math.round(vStart + (vEnd - vStart) * d)));

            var on = new NoteOn();
            on.pitch = sequence[k];
            on.velocity = vel;
            on.sendAfterMilliseconds(k * stepMs);

            var off = new NoteOff();
            off.pitch = sequence[k];
            off.velocity = 0;
            off.sendAfterMilliseconds(k * stepMs + noteLen);
        }
        // Absorb the trigger note — do NOT event.send()
    }
    else if (event instanceof NoteOff) {
        // Absorb; each scheduled gliss note has its own note-off.
    }
    else {
        // Pass CC / pitch bend / program change / etc. through.
        event.send();
    }
}
