# Photographs

Drop files here and they appear on the site. Nothing else has to change: the
layout already holds the space at the right aspect ratio, so adding a photograph
shifts nothing and costs no layout stability.

## Naming

    S1-welcome.jpg      the shot list reference, then a word or two

The reference must match a row in `docs/photography-shot-list.md`. That is what
ties a file on disk to a decision about what the picture is for.

## Then, in the page

    import welcome from '../assets/photos/S1-welcome.jpg';

    <Photo
      ref="S1"
      src={welcome}
      alt="The congregation mid-gathering, seen from the back of the room."
      brief="Wide shot of the room mid-gathering."
      ratio="3 / 4"
    />

`alt` is required whenever `src` is set, and the build fails without it. Describe
the scene rather than the shot: "the congregation talking after a gathering",
not "photograph of church". An empty alt is rejected rather than treated as
decorative, because a photograph of this congregation is never decorative.

## Before any photograph of a person goes in

Section 17, and this is not paperwork for its own sake:

- consent recorded for every identifiable adult
- consent recorded from a parent or guardian for every identifiable child
- the consent register kept **outside this repository**, because it holds
  personal information about children and this repository is public

Withdrawal has to work. If someone asks for a photograph to come down, it comes
down, and the file is deleted here rather than merely unlinked.

## Format and size

Commit the largest version you have, up to about 3000px on the long edge. The
build produces AVIF and WebP at four widths from whatever you commit, so there
is no need to resize by hand and every reason not to: a downscaled original
cannot be recovered.

Do not commit anything over about 8MB. If the camera file is larger, export a
quality-90 JPEG at 3000px first.
