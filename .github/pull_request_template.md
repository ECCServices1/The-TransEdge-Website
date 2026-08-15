## What this changes

<!-- One or two sentences. What is different after this is merged? -->

## Type of change

- [ ] Content, a weekly notice, an event or a correction
- [ ] Design system, tokens, type or components
- [ ] Build, deployment or tooling
- [ ] Translation
- [ ] Something else

## Review checklist

Tick what applies. Anything left unticked that should be ticked is a reason not
to merge, not a reason to explain in a comment.

### Copy and positioning

- [ ] Australian English
- [ ] No em-dashes in new copy
- [ ] Place is "Penrith, Sydney". Jamisontown appears only in an address block, a map, an event location or structured data
- [ ] Migrant, refugee and CALD members appear as leaders and contributors, not as needs to be met
- [ ] The vision, mission and tagline are unchanged
- [ ] No clinical or therapeutic claim is made for pastoral care
- [ ] No guilt-based or urgency-based giving copy, and no tax deductibility implied for church giving

### People and images

- [ ] No image of a person who is not part of this congregation
- [ ] Every new image has alt text
- [ ] Every new image has a recorded consent, and any image of a child has a parent or guardian consent on file
- [ ] Nothing here names a person without their agreement

### Build

- [ ] `npm run verify` passes locally
- [ ] Contrast evidence regenerated if tokens changed
- [ ] New routes added to the redirect map if they replace an old address

### Translation, if this touches a non-English locale

- [ ] Reviewed by a native speaker from the congregation
- [ ] Reviewer and date recorded in `TRANSLATION_STATUS`

## How to undo this

<!-- For a content change: revert this pull request. For anything else, say
     what else has to happen, if anything. -->

Revert this pull request. Cloudflare Pages redeploys the previous build
automatically.
