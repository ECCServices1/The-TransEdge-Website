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
| **S7** | The senior pastors, together, environmental rather than studio | Pastoral team | Portrait 4:5 |
| **S8** | Hands, mid-serve. Setup, catering, car park, anything practical | Serve teams | Square 1:1 |
| **S9** | The room empty, before anyone arrives, in morning light | Home or 404 | Landscape 21:9 |
| **S10** | Congregation talking after a gathering, several groups in frame, nobody posed and nobody centred | Our community | Landscape 16:9 |

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
