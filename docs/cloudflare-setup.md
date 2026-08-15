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

## Creating the project

1. Sign in at **dash.cloudflare.com**.
2. In the left sidebar find **Workers & Pages**, then **Create**.
   Cloudflare has been merging Pages into Workers, so the wording moves around.
   You are looking for anything that offers **Pages** and **Connect to Git**.
3. Choose **Pages**, then **Connect to Git**.
4. Pick the repository **ECCServices1/The-TransEdge-Website**.
   If it is not listed, click the option to configure the GitHub app and grant
   it access to that repository specifically.

## The settings that matter

Cloudflare will try to guess these. Check each one.

| Setting | Value |
|---|---|
| Project name | `thetransedge` (this becomes `thetransedge.pages.dev`) |
| Production branch | `claude/tte-website-redesign-0blqx1` for option A, `main` for option B |
| Framework preset | **Astro**, or leave it as None. Either works |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | leave blank |

**Environment variables: none.** You do not need any to get a working site.
`CONNECT_API_URL` and the Turnstile keys only matter once the Connect Hub and
the contact forms are live, and the site is built to work without them.

Then **Save and Deploy**.

## What a good build looks like

The log scrolls for two to three minutes. Near the end you want:

```
41 page(s) built
Finished
Success: Assets published!
```

Then Cloudflare gives you a URL ending in `.pages.dev`. **That is the site.**
Open it. That is the preview to show the board.

## If it fails

| What the log says | What it means |
|---|---|
| `Could not read package.json` or `npm: command not found` at the very start | You are building from `main`. Change the production branch, per option A above |
| `Node version` or `engine` complaint | Add an environment variable `NODE_VERSION` set to `22`, and retry the deploy |
| `Error: Cannot find module` | The install did not finish. Retry the deploy; it is usually transient |

A failed deploy changes nothing and costs nothing. Retrying is safe.

## What happens from now on

Every push to the production branch rebuilds the site automatically, in about
two minutes. Every pull request also gets its own temporary preview URL, so a
change can be looked at before it is merged.

## Moving the real domain across, later

**Do not do this yet.** Two things have to be true first, both on the launch
checklist:

- the bank account details on the Give page are real
- every old Wix address has been listed and redirects correctly

When both are done, add `thetransedge.com` as a custom domain in the Pages
project and change the DNS. Keep the Wix site running for thirty days
afterwards, so nothing is lost if an address was missed.
