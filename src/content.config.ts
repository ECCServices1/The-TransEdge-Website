/**
 * Content collections.
 *
 * Content is Markdown with front matter in the repository, which makes it
 * versioned, reviewable, portable and directly writable by an assistant, per
 * section 16. Nothing here is fetched from Connect: Connect content is read
 * through src/lib/connect.mjs and is never duplicated into the repository.
 */
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * The weekly service notice. This is the collection the Claude content pipeline
 * writes to, and the only one a machine account has commit rights to.
 *
 * Scope is deliberately narrow. Section 16 puts anything about a named person,
 * anything doctrinal, anything on the vision or mission, anything involving a
 * child, and all translated content out of scope for automated drafting.
 */
const notices = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/notices' }),
  schema: z.object({
    title: z.string().max(80),
    /** The Sunday this notice is for, as YYYY-MM-DD. */
    forDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    /** One sentence. It appears on the home canvas, so it has to earn the space. */
    summary: z.string().max(200),
    /** Set false to hold a notice back without deleting it. */
    published: z.boolean().default(false),
    /**
     * Who approved this notice. Required, because section 16 requires a human
     * merge and this is the record of it inside the content itself.
     */
    approvedBy: z.string().min(2),
  }),
});

export const collections = { notices };
