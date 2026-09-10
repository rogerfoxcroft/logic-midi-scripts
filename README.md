# logic-midi-scripts

A collection of MIDI Scripter scripts for Logic Pro and MainStage.

These scripts are intended for Logic's `Scripter` MIDI plug-in and are aimed at practical performance and routing tasks such as channel splitting, velocity switching, pitch bends, harp glisses, and simple sequencing.

## How to use these scripts

1. Add the `Scripter` MIDI plug-in to a software instrument or external MIDI channel strip.
2. In the `Global Parameters` section, click `Open Script in Editor`.
3. Copy and paste the desired script from this repository into the editor window, overwriting anything already there.
4. Click `Run Script`.

## Script guide

### `auto-bend.js`

Automatically applies pitch bend while a note is held, then resets the bend when the note is released.

Controls:
- `Direction`: bends up or down.
- `Bend duration (ms)`: sets how long it takes to reach full bend.

Useful for patches that need a predictable automatic bend, such as timpani or synth effects.

### `harp-gliss.js`

Turns any single key press into a diatonic harp-style gliss, sweeping through the notes of a chosen scale. The trigger note itself is absorbed rather than passed through, and non-note events such as CC and pitch bend pass through untouched.

Controls:
- `Key`: tonic of the scale, `C` to `B`
- `Scale`: `Major`, `Natural Minor`, `Dorian`, `Mixolydian`, or `Pentatonic Major`
- `Start Note` and `End Note`: the two ends of the sweep; if `End Note` is lower than `Start Note` the gliss runs downwards
- `Duration ms`: total time from the first note to the last
- `Start Velocity` and `End Velocity`: velocity ramps between these across the sweep
- `Note Length ms`: how long each gliss note sustains
- `Direction`: `One Way` sweeps from start to end; `Round Trip` sweeps out to the end note and straight back, with velocity peaking at the turnaround

Choose `Pentatonic Major` for the classic black-key gliss, or `Major`/`Minor` for a seven-note diatonic sweep. Map `Direction` to a Screen Control in MainStage to switch gliss styles per patch.

### `multichannel-flood.js`

Duplicates incoming MIDI from channel 1 across multiple MIDI channels.

Controls:
- `Channels`: sets how many output channels are used.

Useful for layering multitimbral sounds or driving several MIDI channels from one performance.

### `poly-to-multiomni.js`

Splits polyphonic input across multiple MIDI channels, assigning each new held note to the next available channel.

Behavior:
- earlier notes take lower-numbered channels
- once the configured channel limit is reached, additional notes reuse the highest channel

Useful for playing separate monophonic sounds from a single keyboard part.

### `poly-to-ordered-multimono.js`

Splits chords across MIDI channels while keeping the active notes sorted by pitch, so lower notes stay on lower-numbered channels.

Controls:
- `Number of channels`
- `Start channel`

Unlike `poly-to-multiomni.js`, this script can reassign an already-sounding note to a higher channel if a new lower note is played.

### `step-sequencer.js`

A simple trigger-driven step sequencer that plays one stored step per incoming note.

Controls:
- `Trigger note`: choose a specific trigger note or `Any`
- `Step count`: number of active steps, up to 20
- `Selected step`: chooses which step to edit
- `Note 1` to `Note 4`: define up to four notes for the selected step

Each incoming `NoteOn` advances the sequence by one step. The corresponding `NoteOff` sends note-offs for the notes from the previous step.

### `velocity-switch.js`

Maps note velocity onto MIDI channels 1-4.

Controls:
- `Additive`: when enabled, higher velocities trigger all matching ranges; when disabled, only the highest matching range is used
- `Number of ranges`: from 1 to 4
- `Range 2 min velocity`
- `Range 3 min velocity`
- `Range 4 min velocity`

The range controls appear dynamically based on the selected number of ranges.

Useful for building velocity-switched or layered instruments from multichannel patches.

## Notes

- Most scripts expect to be used on a single Scripter instance per channel strip.
- Some scripts assume specific incoming channel behavior. Check the comments at the top of each script if you need to adapt them.
- If you want to customize behavior further, each script is plain JavaScript and can be edited directly in Scripter.

## Contact

If you have questions about the scripts, contact:

`roger@foxcroft.org.uk`
