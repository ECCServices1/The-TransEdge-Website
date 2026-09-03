# Photography: shot list, consent register, pipeline

Section 17. Real photography of this congregation. No stock people.

## Why the site currently has no photographs

Every image slot on the site is reserved, at its final aspect ratio, and states
the shot it is waiting for. None is filled.

That is deliberate on two counts. Section 22 forbids stock photography of people
who are not in this congregation, and section 17 forbids publishing any image
without alt text, a credit where applicable, and a recorded consent. A
placeholder that looks like a decision is worse than an obvious gap.

Because each slot already holds its aspect ratio, dropping the real photograph
in changes no layout and costs no cumulative layout shift.

## What has been supplied

Fifteen frames from an evening event, reviewed August 2026. The assignments
below are provisional until the files are in the repository and can be cropped
and graded.

| Slot | The frame | Why |
|---|---|---|
| **S1** | Row of the congregation standing in worship, side-on, keyboard and worship leader at right, open door and daylight behind | Faces, ages and backgrounds all legible. The welcome movement's copy is "a congregation of many languages and many countries", and this is that sentence as a photograph |
| **S5** | **Done.** `S5-edgekids.jpg`, a render made at Higgsfield in September 2026 | The client's instruction: a child-friendly room with no children in it. It is an illustration, not a photograph of our room, and the alt text says so. See "Generated imagery" below |
| **S6** | **Done.** `S6-afterwards.jpg`, supplied as "Buffett_Queue.jpg" | Hospitality rather than performance, lit by the room rather than the stage, and the only frame where a stranger could picture themselves. On What to Expect |
| **S8** | **Done.** `S8-serving.jpg`, supplied as "S8_Buffet_Queue.jpg" | Hands mid-serve, square, on Life at TTE under Serving |
| **S10** | Congregation standing in prayer, mission statement and the tagline on the wall behind | Several generations in one frame, and the identity is legible without a caption |
| **S7** | **Done.** `S7-senior-pastors.jpg`, supplied as "Our senior pastors.jpg" | The agreed shot: both Senior Pastors together, at the lectern, environmental. Landscape 3:2, because a portrait crop would have to choose between them |
| **S7a/b** | **Done.** `S7-michaels.jpg` and `S7-osas.jpg` | One portrait each, beside each biography on Our Pastors. Keyed by name in the page rather than by array position, so reordering the pastors cannot swap their faces. Both replaced in September 2026 with the client's hi-res profile portraits from the Drive profile folder (`Dr Michaels_profile.jpg`, `Ps Osas_profile`, 2400×3600 daylight frames), cropped to 4:5 from the top with head room kept, graded a touch lighter than the stage frames (saturation 0.86) because daylight does not need the same taming. The same folder's `PM and PO_informal.jpg` is held back: it is a dinner-table frame with other guests identifiable behind the pastors, and section 17 has no consent for them |
| **S11** | **Done.** `S11-together.jpg`, supplied as "Team.jpg" | On Who We Are, which had no photograph at all and is the page a stranger lands on to find out who we are |
| **S12** | **Done.** `S12-pastors.png`, cut out from `S7-senior-pastors.jpg` | On Watch and Listen, by the client's instruction of August 2026: the Senior Pastors, background removed, standing on the page's own ground with a token-drawn wash behind them. The lectern, a cup and a screen-seam sliver were erased from the cutout; the base dissolves through a static CSS mask so the crop line never shows |

**Momentum 2025 is a conference set, and its unlabelled frames show guests.**
The client confirmed in September 2026 that the speakers and singers in the
IMG_66xx to IMG_78xx files are visiting ministers, not the congregation, so
none of them may be used for any slot; section 22's rule about people who are
not part of this congregation applies to them exactly. Only the files the
client named for a slot (the pastors, the team, the meal frames) are ours to
use. `S12-worship.jpg` (supplied as "Singer_worship.jpg") is kept in the
repository but is not to be placed: it is a guest worship leader.

**Deliberately unused:** `Ps Osas Michaels.jpg`. Despite the name it is a
second solo frame of Pastor Osas, and `S7-osas.jpg` is better framed. A site
does not need two portraits of the same person, and using it to fill a slot
would be padding rather than choosing.

**E1, the conference artwork.** Both supplied frames arrived in August 2026
and are in: `E1-rain-2026.jpg` (the master poster, on the home chapter, wide
screens) and `E1-rain-ministers.jpg` (the hosts-and-speakers social, on the
events card). Converted from the supplied PNGs at quality 84, not re-graded:
designed artwork keeps its own colour. The poster's facts (sessions, crusade,
ministers, venue, no registration required) live in `src/data/conference.mjs`.

**Cutouts.** The client approved replacing or removing photo backgrounds where
it presents people better. The pipeline that produced `S12-pastors.png`:
Higgsfield's background remover works through its MCP tools (import the image
from the deployed preview URL with `media_import_url`, run `remove_background`)
but its CDN is unreachable from this build environment, so results cannot come
back whole. The local route works end to end: `pip install rembg onnxruntime`
in a scratch venv (PyPI bypasses the proxy), model `isnet-general-use`, then
erase any furniture from the alpha channel with Pillow and downscale to 1600
wide. Quality on stage-lit frames is excellent because the subjects sit far
from the backdrop in tone.

**Placed in September 2026 from the Drive's phone folders** (decoded from HEIC
with pillow-heif, graded with the standard recipe):

- **S1** `S1-welcome.jpg`, from "Sunday 30/8/2026" IMG_1583: the room from the
  back rows, mid-message. A bridging frame. The brief's ideal, faces visible
  across a full room, is `S1_Congregation.jpg` in Momentum 2025, which at
  10.4MB has never transferred; a 3000px export under 7MB replaces this.
- **S2** `S2-edgedin.jpg`, from "Sunday 30/8/2026" IMG_1566: Dr Michaels with
  a microphone, smiling, square. The voice behind the network rather than the
  recording desk the brief first imagined; a person says EdgedIn faster than
  equipment does.
- **S10** `S10-room.jpg`, from "TTE_Church photos" IMG_0304: the congregation
  seated beneath the tagline and the mission on the wall, on What to Expect.
  Cropped below the lighting rig and desaturated harder than usual to tame a
  purple wash.

Frames set aside from those folders because a child or teenager appears
(IMG_1492, IMG_1575, IMG_1610) or because the setting is a retreat rather than
the church (the January 2025 JPEGs).

**Still missing**, and nothing in the Drive can supply them: S3 the entrance
from the street, S4 the welcome desk, S9 the empty room in morning light. These
need a phone on a weekday morning, not an event photographer.

## Generated imagery

One slot holds a render rather than a photograph: S5, the EdgeKids room, made
at Higgsfield (nano_banana_pro, 3:2) to the client's instruction of September
2026 that the page should show a child-friendly set-up without showing
children. The rules for it:

- It never shows a person. A room with nobody in it needs no consent and
  misrepresents nobody. A generated person would breach section 22 as surely
  as a stock photograph.
- It is not passed off as our room. The alt text calls it an illustration, and
  the page comment says what it is. When a real photograph of the EdgeKids
  space exists, it replaces the render.
- It carries no text, signage or lettering, because generated lettering is
  where these images give themselves away.
- Grade lightly (saturation 0.92). A render is already balanced; the stage
  recipe would drain colour it never had to lose.

**How a render gets in.** The build sandbox sits behind an allowlisting proxy
that admits GitHub and little else, and Higgsfield's results live on CloudFront,
so the file cannot be pulled in directly. Commit a request file under
`.github/fetch-requests/` (`url=`, `name=`, `width=` lines) and the
`fetch-asset` workflow fetches it on a GitHub runner, shrinks it to a JPEG at
the requested width and commits it under `src/assets/incoming/` on the same
branch, removing the request in the same commit. Crop, grade and place from
there, then delete the incoming copy. Two candidates were brought in this way
and the warmer, daylit one chosen.

## How photographs reach the repository

Google Drive, through the connector. Dropbox's content hosts are blocked by the
build environment's network policy and GitHub's browser upload rejects files
this size, but the Drive connector returns file contents through its own channel
rather than a URL, so the bytes arrive without touching the blocked network.

Name a file for the slot it fills, put it in the shared drive, and it can be
pulled, cropped, graded and committed without leaving the repository.

Every supplied frame is graded the same way on the way in: saturation to about
0.82 and a slight easing of contrast. The stage lighting at this venue throws
hard magenta, green and orange, and left alone it fights Deep Slate and the warm
neutrals the site is built on.

**Encoder quality is set, not defaulted.** Astro's image service encodes the
responsive set at whatever quality it is told, and told nothing it writes AVIF
at 50, which is visibly soft on faces and fabric. The client noticed in
September 2026 that the site looked softer than the files in the Drive.
Photo.astro now asks for 80 across AVIF, WebP and JPEG; measured on a 1200-wide
portrait the AVIF goes from 107KB to 264KB, and the last five points to 85 buy
bytes rather than sharpness.

**No child appears in any supplied frame.** That keeps the consent position
simple, and it leaves the EdgeKids page with no photograph of children at all. A
parent reading that page currently sees no evidence that other children are
there. Worth a shot with consent, or the page carries the reserved slot.

## The shot list

One Sunday, one volunteer photographer. Ordered by how much the site needs them.

| Ref | Shot | Where it goes | Format |
|---|---|---|---|
| **S1** | Wide, from the back of the room, mid-gathering. Faces visible, no single hero, **no empty seats**. Room at top right for the seam to cross | Home, welcome movement | Landscape 16:9 |
| **S2** | Recording setup mid-session. Hands and microphone, shallow depth, warm key light | Home, EdgedIn movement | Square 1:1 |
| **S3** | The main entrance from the street, in daylight, step-free approach visible | Find us | Landscape 16:9 |
| **S4** | The welcome desk with a volunteer, mid-conversation, badge visible | Plan your visit | Landscape 3:2 |
| **S5** | EdgeKids space, empty of children, set up and ready | EdgeKids | Landscape 3:2 |
| **S6** | Tea and coffee afterwards. Two or three people talking, not posed | What to expect | Landscape 3:2 |
| **S7** | The senior pastors, together, environmental rather than studio | Pastoral team | Landscape 3:2 |
| **S8** | Hands, mid-serve. Setup, catering, car park, anything practical | Serve teams | Square 1:1 |
| **S9** | The room empty, before anyone arrives, in morning light | Home or 404 | Landscape 21:9 |
| **S10** | Congregation talking after a gathering, several groups in frame, nobody posed and nobody centred | Our community | Landscape 16:9 |
| **S11** | Leaders and members together on stage at a celebration | Who we are | Landscape 16:9 |
| **S12** | Worship, mid-song | Watch and listen | Landscape 4:3 |

### Direction

One grade across the whole set: warm, slightly lifted shadows, no heavy contrast
and no filter. It has to sit with an ember accent and a slate anchor without
fighting either.

One crop logic: people are never cropped at a joint, and the horizon is level.

Photograph the room as it is. Do not stage a fuller room than exists, and do not
arrange people by appearance to look more diverse than the congregation is. The
congregation is genuinely many languages and many countries; photograph that
honestly and it will show.

**S5 is deliberately empty of children.** A photograph of the space needs no
consent. A photograph of children needs consent from every parent or guardian of
every identifiable child, and it is not worth the risk of getting that wrong for
a room shot.

## Consent register

Required before any image of a person is published. **This register does not
live in this repository.** It holds personal information, including about
children, and this repository is public.

Hold it wherever the child safe records are already held, with the same access
controls. Open question 4.

| Column | Notes |
|---|---|
| Image reference | Matches the shot list ref and the filename |
| Date taken | |
| Photographer | For the credit |
| People identifiable | Names, or "none identifiable" |
| Any child under 18 | Yes or no. If yes, everything below is mandatory |
| Consent given by | Parent or guardian name for a child, the person themselves otherwise |
| Consent date | |
| Consent scope | Website, social, print, or a subset |
| Withdrawal | Date, and the date the image was removed |
| Where held | Link to the signed form |

### Rules

- No image of a child is published without a recorded consent from a parent or
  guardian. No exceptions, including for a child of a staff member.
- Consent can be withdrawn at any time, and withdrawal means the image comes
  down that day, not at the next content review.
- Consent is for a scope. Consent for the website is not consent for a
  billboard.
- If the register cannot answer for an image, the image does not go up.

## Asset pipeline

Every image goes through this before it enters the repository:

1. **Strip EXIF, including location.** A photograph taken on a phone at the
   church carries the church's coordinates, and one taken at someone's home
   carries theirs. Non-negotiable.
2. **Apply the grade.** One grade for the whole set.
3. **Convert to AVIF and WebP,** with a JPEG fallback.
4. **Generate responsive sizes:** 400, 800, 1200, 1600, 2000 wide.
5. **Record alt text** at the same moment. Not later.

```bash
# EXIF first, always
exiftool -all= -overwrite_original photo.jpg

# then the responsive set
npx sharp-cli -i photo.jpg -o public/media/ resize 1600 --withoutEnlargement -f avif
npx sharp-cli -i photo.jpg -o public/media/ resize 1600 --withoutEnlargement -f webp
```

Astro's image pipeline handles `srcset` and dimensions from there, so every
`<img>` ships with explicit width and height.

## Alt text

Describe what the photograph shows, for someone who cannot see it. Not a caption
and not a keyword list.

- **Good:** "A full room during a Sunday gathering, seen from the back."
- **Bad:** "Church service" — says nothing.
- **Bad:** "TTE Penrith Sydney church multicultural community worship" — keyword
  stuffing, and it makes a screen reader unusable.

A purely decorative image takes `alt=""`. An image carrying information takes a
real description. If an image needs a long description, it probably needs a
caption that everyone can read.
