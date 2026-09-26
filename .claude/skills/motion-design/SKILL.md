---
name: motion-design
description: Principles for deciding WHETHER and HOW slides should move — purpose of each animation, restraint, timing and duration values, easing, choreography order and stagger, presenter-paced vs auto-play, consistency across a deck, and anti-patterns that make decks look cheap. Read this before choosing any transition or animation, when reviewing a deck's motion, or when the user asks to make slides "more dynamic", "more professional", "less busy" or similar.
---

# Motion design for slides

Every other motion skill tells you *how*. This one is about *whether* and *why*. Good deck
motion is mostly invisible. It directs attention, shows how two states relate, and paces
information. Bad deck motion is decoration: things spin because they can. That's the
"AI deck tell" ppt-master's own docs warn about, and it's why its default is no object
animation at all.

## The one question to ask

> **What should the audience notice, understand, or compare at this moment that they
> couldn't if everything appeared at once?**

If you can't answer it, don't animate. A slide that appears whole with a quiet fade
transition is a good default, not a failure.

Legitimate jobs for motion, and the technique that fits each:

| Job | What it does for the audience | Technique | Read |
|---|---|---|---|
| **Pace** | Reveals points in speaking order so people don't read ahead | Entrance builds, often on-click | [pptx-object-animations](../pptx-object-animations/SKILL.md) |
| **Relate** | Shows the same thing changing: bigger, re-ranked, zoomed into | Morph | [pptx-morph](../pptx-morph/SKILL.md) |
| **Direct** | Points at the one thing that matters now | A single emphasis, or dim-after | [pptx-object-animations → emphasis](../pptx-object-animations/references/recipes.md#emphasis-that-points) |
| **Orient** | Signals a new section versus a continuation | Transition choice | [pptx-transitions](../pptx-transitions/SKILL.md) |
| **Respond** | Reacts to the presenter (quiz, reveal answer) | `triggerShape` ("On click of") | [recipes → click-to-reveal](../pptx-object-animations/references/recipes.md#click-to-reveal) |
| **Show process** | Shows a state changing over time, like saving then saved | A lifecycle: enter → emphasize → exit | [recipes → lifecycle](../pptx-object-animations/references/recipes.md#lifecycle-enter-emphasize-exit) |

## Restraint budget (defaults)

- **Per deck:** one transition family, plus at most one deliberate exception such as a
  section push or a finale. Details are in
  [pptx-transitions](../pptx-transitions/SKILL.md#choosing-by-slide-relationship).
- **Per slide:** one kind of motion. Use entrance builds *or* a Morph *or* one emphasis.
  Stacking all three usually means none of them reads.
- **Entrance effects:** pick one or two families for the whole deck (for example fade for
  text and wipe for bars) and reuse them. Changing effect per slide reads as noise.
- **Emphasis:** once per slide at most, on the single point of the slide. Looping emphasis
  (`repeatCount`) is for demos and attention-grabbing kiosks, not business reviews.
- **Exit effects:** only inside a lifecycle, or to clear space for what replaces the object.
  The next slide already clears everything.

## Timing (seconds)

| Motion | Duration | Why |
|---|---|---|
| Text / card entrance (fade, rise, fly) | 0.3–0.5 | Long enough to register, short enough that the speaker isn't waiting |
| Bars and lines growing (wipe) | 0.4–0.6 | Reads as data "arriving" |
| Stagger between siblings (`after-previous`) | 0.1–0.3 of delay, or back-to-back 0.3–0.4 durations | A rhythm faster than speech; a whole list lands in about 2 s |
| Emphasis pulse or teeter | 0.4–0.6, repeat ≤ 2 | Any longer becomes an alarm |
| Morph | 0.8–1.2 | The eye needs time to track position and size together |
| Morph with large travel or zoom | 1.2–1.6 | Travel distance drives duration |
| Transition (fade/push) | 0.3–0.6 | Continuity, not a show |
| "Exciting" transition (vortex, origami…) | 1.2–2 | Only for a finale or a deliberate beat |
| Motion path | 1.5–2.5 | Paths look frantic when fast |

Keep durations consistent: the same kind of motion gets the same duration throughout
the deck.

## Choreography

1. **Follow reading order.** Top to bottom, left to right, and title before body. The title
   is usually static so the slide is legible at once, and only the content builds.
2. **Hierarchy before detail.** The headline number enters first, and the supporting cards
   follow.
3. **Group what belongs together.** One `<Animate>` block per semantic unit: a KPI card
   (label + value + delta), a bar row (label + bar + value), a table row. Never animate a
   label separately from its value.
4. **Pick the pacing mode.**
   - *Auto-play* (`after-previous`, our default) suits reading decks, kiosks, recorded
     talks, and decorative entrances.
   - *Presenter-paced* (`on-click`) suits live talks where each point gets spoken about.
     Use it for agendas, arguments, and quiz reveals. Keep one mode per slide unless a beat
     is clearly separate.
5. **Let the eye rest.** After a Morph, don't immediately fire five entrances. Let the moved
   object land, then build at most one or two supporting elements.

## Easing

- Entrances feel natural when they **decelerate** into place, and exits when they
  **accelerate** away. PowerPoint presets already ease, so add `accelerate`/`decelerate`
  only for custom feel and only on non-path effects. `path_*` presets carry their own
  easing, and adding more fails export.
- `bounceEnd` is playful and fits consumer, launch, and education decks. Avoid it in
  finance and board decks.

## Anti-patterns (and fixes)

| Smell | Fix |
|---|---|
| Every slide uses a different transition | One family, one exception |
| Everything flies in from different directions | One direction that matches reading flow (from left for lists) |
| Title animates in on every slide | Keep titles static |
| Each word or label animates separately | Animate semantic blocks |
| Emphasis on everything | One emphasis, on the slide's point |
| Long durations (> 1 s) for simple entrances | 0.3–0.5 s |
| Morph between unrelated slides | Only Morph things that are the *same object*; otherwise fade |
| Motion as the only carrier of meaning | The final state must make sense as a still (printed, PDF, thumbnails) |

## Accessibility and robustness

- The last frame of every slide must stand on its own, because decks get exported to PDF,
  thumbnailed, and printed. Our PNG previews show exactly that frame.
- Avoid flashing (`entrance_flash_once`, rapid repeats) and fast spins.
- Presenter-paced builds need a presenter. For decks that are emailed, prefer auto-play or
  no builds.

## Next

- Pick concrete effects: [pptx-object-animations](../pptx-object-animations/SKILL.md)
- Same object across slides: [pptx-morph](../pptx-morph/SKILL.md)
- Between-slide transitions: [pptx-transitions](../pptx-transitions/SKILL.md)
- Slide-type playbook with ready defaults: [references/slide-type-playbook.md](references/slide-type-playbook.md)
- The implementation workflow and verification: [animate-slides](../animate-slides/SKILL.md)
