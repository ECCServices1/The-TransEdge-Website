# Setting up Cloudflare Pages

Follow this once. It takes about five minutes. Nothing here touches
thetransedge.com, which stays on Wix until you deliberately move the DNS in the
last step, and that step is not part of this setup.

## Before you start, the thing that trips everyone up

The website lives on a branch called `claude/tte-website-redesign-0blqx1`, not
on `main`. The `main` branch contains one file, a README.

So if you point Cloudflare at `main`, the build will fail, and the error will
look alarming and say nothing useful. It is not broken. There is simply nothing
there to build yet.

**Two ways round it. Pick one.**

| | What you do | When to choose it |
|---|---|---|
| **A** | Set Cloudflare's production branch to `claude/tte-website-redesign-0blqx1` | You want a working preview now, and `main` untouched until the board approves |
| **B** | Merge pull request #1 into `main` first, then leave Cloudflare on `main` | The board has approved, or you are happy for the work to sit on `main` |

**Option A is the one to take now.** It gives you a live URL to show the board
without committing anything to `main` first.

## Cloudflare builds a Worker, not a Pages project

Cloudflare has folded Pages into Workers. Connecting a repository now creates a
**Worker**, and a Worker arrives configured with:

    Build command:   None
    Deploy command:  npx wrangler deploy

Nothing is built, so `wrangler` finds no site to publish and fails with:

    Could not detect a directory containing static files (e.g. html, css and js)

That message is accurate and unhelpful. Both causes are now handled in the
repository, so there is only one thing left to change in the dashboard.

**Fixed in `wrangler.jsonc`, nothing to do:**

- it points Cloudflare at `./dist`
- it runs `npm run build` itself, through wrangler's build hook, so the
  dashboard's empty build command no longer matters

**Still to change in the dashboard, one setting:**

| Setting | Change it to |
|---|---|
| Branch | `claude/tte-website-redesign-0blqx1` |

Then **Retry build**.

The branch is the one thing the repository cannot fix for itself. `main` holds a
single README, so `npm install` fails there before anything else runs, whatever
else is configured. Merging pull request #1 into `main` solves it just as well,
if the board has approved.

## What a good build looks like

The log runs two to three minutes. Near the end:

    41 page(s) built
    Read 544 files from the assets directory
    Uploaded ... Deployed the-transedge-website

Then Cloudflare gives you a `.workers.dev` URL. **That is the site.**

## If it still fails

| The log says | It means |
|---|---|
| `Could not detect a directory containing static files` | The build command is still empty, or still building `main` |
| `Could not read package.json` | Still on `main`. Change the branch |
| `Node version` or `engine` | Add a build variable `NODE_VERSION` set to `22`, retry |
| `Authentication error` | The build token needs redoing. Disconnect and reconnect the repository |

A failed build changes nothing and costs nothing. Retrying is safe.

## What happens from now on

Every push to the production branch rebuilds the site automatically, in about
two minutes. Every pull request also gets its own temporary preview URL, so a
change can be looked at before it is merged.

## Moving the real domain across, later

**Do not do this yet.** Two things have to be true first, both on the launch
checklist:

- the bank account details on the Give page are real (confirmed 3 September 2026)
- the old Wix address list has been waived by the client (3 September 2026); the
  route-family redirects stand as a courtesy net

When both are done, add `thetransedge.com` as a custom domain in the Pages
project and change the DNS. Keep the Wix site running for thirty days
afterwards, so nothing is lost if an address was missed.
