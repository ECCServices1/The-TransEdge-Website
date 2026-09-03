/**
 * Where the EdgedIn Network lives off this site.
 *
 * Supplied by the client on 3 September 2026. Two addresses were tidied on
 * the way in and nothing else was touched: the Apple Podcasts link arrived on
 * the Danish storefront (/dk/ with ?l=da) and is set to the Australian one,
 * which resolves the same show id; the Spotify link carried a personal share
 * token (?si=) that identifies whoever copied it, and that is dropped.
 *
 * The radio address is a live audio stream, not a page, so it is played with
 * a native <audio> element rather than linked to. The site's Content Security
 * Policy allows media from any https origin; nothing else about the policy
 * had to change for it.
 */
export const EDGEDIN = {
  podcast: {
    name: 'The Transformation Edge with Ps Michaels',
    platforms: [
      {
        name: 'Apple Podcasts',
        href: 'https://podcasts.apple.com/au/podcast/the-transformation-edge-with-ps-michaels/id1466920676',
      },
      { name: 'Spotify', href: 'https://open.spotify.com/show/6VukrLyQua7OiI3rqyXFCE' },
      { name: 'SoundCloud', href: 'https://soundcloud.com/198876991-298484646' },
    ],
  },
  radio: {
    name: 'EdgedIn Radio',
    stream: 'https://s99.radiolize.com:8040/radio.mp3',
  },
  youtube: {
    name: 'YouTube',
    href: 'https://www.youtube.com/@thetransedge',
  },
  socials: [
    { name: 'Instagram', href: 'https://www.instagram.com/thetransedge/' },
    { name: 'Facebook', href: 'https://www.facebook.com/theTransEdge' },
  ],
};

/** The footer's follow list: the socials and the channel, in that order. */
export const FOLLOW = [...EDGEDIN.socials, EDGEDIN.youtube];
