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
| **S6** | **Done.** `S6-afterwards.jpg`, supplied as "Buffett_Queue.jpg" | Hospitality rather than performance, lit by the room rather than the stage, and the only frame where a stranger could picture themselves. On What to Expect |
| **S8** | **Done.** `S8-serving.jpg`, supplied as "S8_Buffet_Queue.jpg" | Hands mid-serve, square, on Life at TTE under Serving |
| **S10** | Congregation standing in prayer, mission statement and the tagline on the wall behind | Several generations in one frame, and the identity is legible without a caption |
| **S7** | **Done.** `S7-senior-pastors.jpg`, supplied as "Our senior pastors.jpg" | The agreed shot: both Senior Pastors together, at the lectern, environmental. Landscape 3:2, because a portrait crop would have to choose between them |
| **S7a/b** | **Done.** `S7-michaels.jpg` and `S7-osas.jpg` | One portrait each, beside each biography on Our Pastors. Keyed by name in the page rather than by array position, so reordering the pastors cannot swap their faces. S7a replaced in August 2026 with the client-supplied `Dr_Michaels_(august2026).jpg` from the Drive August folder, graded with the standard recipe |
| **S11** | **Done.** `S11-together.jpg`, supplied as "Team.jpg" | On Who We Are, which had no photograph at all and is the page a stranger lands on to find out who we are |
| **S12** | **Done.** `S12-pastors.png`, cut out from `S7-senior-pastors.jpg` | On Watch and Listen, by the client's instruction of August 2026: the Senior Pastors, background removed, standing on the page's own ground with a token-drawn wash behind them. The lectern, a cup and a screen-seam sliver were erased from the cutout; the base dissolves through a static CSS mask so the crop line never shows |

**Reassigned:** `S12-worship.jpg` (supplied as "Singer_worship.jpg") held this
slot first and is kept in the repository unused. It remains the strongest
worship frame in the set and should get a home when a slot suits it.

**Deliberately unused:** `Ps Osas Michaels.jpg`. Despite the name it is a
second solo frame of Pastor Osas, and `S7-osas.jpg` is better framed. A site
does not need two portraits of the same person, and using it to fill a slot
would be padding rather than choosing.

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

**Still missing**, and these are the ones the New Here pages run on: S1 the wide
congregation shot (named in Drive, too large to transfer so far), S2 the
recording setup, S3 the entrance from the street, S4 the welcome desk, S5 the
EdgeKids room, S9 the empty room in morning light, S10 the congregation in
prayer.

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
