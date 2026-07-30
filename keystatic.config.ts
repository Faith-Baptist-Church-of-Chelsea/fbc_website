// Keystatic admin panel configuration.
//
// Keystatic is a git-based CMS: everything edited at /keystatic is written
// to the same files under content/ that you can also edit by hand, so the
// two editing paths can never drift apart.
//
// storage "local" = edits write straight to files on the machine running
// the site. That works when Steven runs `npm run dev` on his own computer.
// For volunteers to edit through the DEPLOYED site, this must be switched
// to GitHub storage (kind: "github") — see the README section "Letting
// volunteers edit content" for the one-time setup that requires.
import { config, fields, singleton, collection } from "@keystatic/core";

/**
 * Where images pasted INTO a rich-text field (event description, staff bio,
 * announcement) are stored.
 *
 * Keystatic's default is a folder beside the .mdx file under content/, which
 * nothing serves over HTTP — so those images silently 404 on the live site.
 * Putting them under public/ with a matching publicPath means the markdown
 * records a real URL (/images/content/photo.png) that the site can serve.
 *
 * Every rich-text field shares ONE folder on purpose: components/RichText.tsx
 * imports from that exact path to read each image's real dimensions, and the
 * bundler needs a single static prefix to do that.
 *
 * Filenames are slugified because volunteers upload things like
 * "David Brown.png", and spaces have to be percent-encoded in every URL.
 */
const contentImages = {
  directory: "public/images/content",
  publicPath: "/images/content/",
  transformFilename: (filename: string) => {
    const dot = filename.lastIndexOf(".");
    const base = dot === -1 ? filename : filename.slice(0, dot);
    const ext = dot === -1 ? "" : filename.slice(dot).toLowerCase();
    const slug =
      base
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || "image";
    return slug + ext;
  },
};

export default config({
  // GitHub storage: /keystatic works in ANY browser on the deployed site —
  // volunteers log in with GitHub, edits (including image uploads) become
  // commits, and Vercel redeploys. Requires one-time GitHub App setup (the
  // wizard appears at /keystatic in dev once NEXT_PUBLIC_KEYSTATIC_MODE=github
  // is set); until then, or without the env var, it falls back to local mode.
  storage:
    process.env.NEXT_PUBLIC_KEYSTATIC_MODE === "github"
      ? { kind: "github", repo: "Faith-Baptist-Church-of-Chelsea/fbc_website" }
      : { kind: "local" },

  ui: {
    brand: { name: "Faith Baptist Church" },
  },

  singletons: {
    // Edits content/site.json — service times, address, contact info, links.
    site: singleton({
      label: "Church Info (times, address, links)",
      path: "content/site",
      format: { data: "json" },
      schema: {
        name: fields.text({ label: "Church name" }),
        tagline: fields.text({ label: "Tagline" }),
        address: fields.object(
          {
            street: fields.text({ label: "Street" }),
            city: fields.text({ label: "City" }),
            state: fields.text({ label: "State" }),
            zip: fields.text({ label: "ZIP" }),
            directionsNote: fields.text({
              label: "Directions note",
              description: "e.g. \"I-94 Exit 156\"",
            }),
            mapsUrl: fields.url({ label: "Google Maps link" }),
          },
          { label: "Address" }
        ),
        phone: fields.text({ label: "Phone" }),
        emails: fields.object(
          {
            pastor: fields.text({ label: "Pastor" }),
            assistantPastor: fields.text({ label: "Assistant pastor" }),
            office: fields.text({ label: "Office" }),
          },
          { label: "Email addresses" }
        ),
        formRecipients: fields.array(fields.text({ label: "Email address" }), {
          label: "Form recipients",
          description:
            "Who receives contact & prayer form submissions. Add or remove staff freely — no code changes needed.",
          itemLabel: (props) => props.value,
        }),
        officeHours: fields.array(
          fields.object({
            days: fields.text({ label: "Day(s)" }),
            hours: fields.text({ label: "Hours" }),
          }),
          {
            label: "Office hours",
            itemLabel: (props) =>
              `${props.fields.days.value}: ${props.fields.hours.value}`,
          }
        ),
        services: fields.array(
          fields.object({
            name: fields.text({ label: "Service name" }),
            day: fields.text({ label: "Day" }),
            time: fields.text({ label: "Time" }),
          }),
          {
            label: "Service times",
            itemLabel: (props) =>
              `${props.fields.day.value} ${props.fields.time.value} — ${props.fields.name.value}`,
          }
        ),
        googlePlaceId: fields.text({
          label: "Google Place ID",
          description: "Technical ID for pulling Google reviews — leave alone",
        }),
        social: fields.object(
          {
            facebook: fields.url({ label: "Facebook" }),
            instagram: fields.url({ label: "Instagram" }),
            youtube: fields.url({ label: "YouTube" }),
            youtubeChannelId: fields.text({
              label: "YouTube channel ID",
              description: "Technical ID used for video embeds — don't change unless the channel changes",
            }),
          },
          { label: "Social links" }
        ),
        links: fields.object(
          {
            churchCenter: fields.url({ label: "Church Center" }),
            giving: fields.url({
              label: "Giving page",
              description:
                "Where the Give button sends people (currently ChurchTrac)",
            }),
            givingEmbed: fields.url({
              label: "Giving embed URL",
              description: "The ChurchTrac embed form URL shown on /give",
            }),
            missionaries: fields.url({ label: "Missionaries list" }),
            unashamedRegistration: fields.url({
              label: "Unashamed conference registration",
            }),
            appStoreChurchCenter: fields.url({ label: "App Store (Church Center)" }),
            googlePlayChurchCenter: fields.url({ label: "Google Play (Church Center)" }),
          },
          { label: "Important links" }
        ),
      },
    }),
  },

  collections: {
    // Build-your-own pages → content/pages/*.yaml, rendered at /<page-name>.
    // Each page = hero + a stack of sections (text, photos, buttons, video)
    // that volunteers arrange in the editor, GoDaddy-builder style. Pages
    // built in code (About, Plan Your Visit, …) always win if a name
    // collides — this collection can't overwrite them.
    pages: collection({
      label: "Pages",
      path: "content/pages/*",
      slugField: "title",
      format: { data: "yaml" },
      schema: {
        title: fields.slug({
          name: {
            label: "Page name",
            description:
              "Also sets the web address. If it matches a built-in page (About, Events, Give…), the built-in page wins.",
          },
        }),
        eyebrow: fields.text({
          label: "Small line above the title",
          description: "Optional — e.g. \"To every nation\"",
        }),
        intro: fields.text({
          label: "Intro sentence(s) under the title",
          multiline: true,
        }),
        menu: fields.select({
          label: "Show in the site menu?",
          options: [
            { label: "Not in the menu (share the link directly)", value: "none" },
            { label: "Ministries dropdown", value: "ministries" },
            { label: "Footer links", value: "footer" },
          ],
          defaultValue: "none",
        }),
        menuOrder: fields.integer({
          label: "Menu position",
          description: "Lower numbers appear first among custom pages",
          defaultValue: 99,
        }),
        sections: fields.blocks(
          {
            text: {
              label: "Text",
              itemLabel: (props) =>
                `Text${props.fields.heading.value ? `: ${props.fields.heading.value}` : ""}`,
              schema: fields.object({
                heading: fields.text({ label: "Heading (optional)" }),
                body: fields.mdx.inline({
                  label: "Text",
                  options: { image: contentImages },
                }),
              }),
            },
            imageText: {
              label: "Photo beside text",
              itemLabel: (props) =>
                `Photo + text${props.fields.heading.value ? `: ${props.fields.heading.value}` : ""}`,
              schema: fields.object({
                heading: fields.text({ label: "Heading (optional)" }),
                body: fields.mdx.inline({
                  label: "Text",
                  options: { image: contentImages },
                }),
                image: fields.image({
                  label: "Photo",
                  directory: "public/images/pages",
                  publicPath: "/images/pages/",
                }),
                imageSide: fields.select({
                  label: "Photo on which side?",
                  options: [
                    { label: "Right", value: "right" },
                    { label: "Left", value: "left" },
                  ],
                  defaultValue: "right",
                }),
              }),
            },
            image: {
              label: "Photo",
              itemLabel: (props) => `Photo${props.fields.caption.value ? `: ${props.fields.caption.value}` : ""}`,
              schema: fields.object({
                image: fields.image({
                  label: "Photo",
                  directory: "public/images/pages",
                  publicPath: "/images/pages/",
                }),
                caption: fields.text({ label: "Caption (optional)" }),
              }),
            },
            buttons: {
              label: "Buttons",
              itemLabel: (props) =>
                `Buttons: ${props.fields.buttons.elements.map((b) => b.fields.label.value).join(", ") || "(empty)"}`,
              schema: fields.object({
                buttons: fields.array(
                  fields.object({
                    label: fields.text({ label: "Button text" }),
                    link: fields.text({
                      label: "Where it goes",
                      description:
                        "A full web address (https://…) or a page on this site (/contact)",
                    }),
                    style: fields.select({
                      label: "Style",
                      options: [
                        { label: "Solid blue (main action)", value: "primary" },
                        { label: "Outlined (secondary)", value: "secondary" },
                      ],
                      defaultValue: "primary",
                    }),
                  }),
                  {
                    label: "Buttons",
                    itemLabel: (props) => props.fields.label.value || "Button",
                  }
                ),
              }),
            },
            video: {
              label: "YouTube video",
              itemLabel: () => "YouTube video",
              schema: fields.object({
                url: fields.text({
                  label: "YouTube link",
                  description: "Paste the video's address, e.g. https://youtube.com/watch?v=…",
                }),
              }),
            },
          },
          { label: "Page sections" }
        ),
        nextStep: fields.object(
          {
            title: fields.text({
              label: "Heading",
              description: "Leave blank for the standard \"Plan Your Visit\" ending",
            }),
            text: fields.text({ label: "Sentence under it", multiline: true }),
            primaryLabel: fields.text({ label: "Main button text" }),
            primaryLink: fields.text({ label: "Main button link" }),
            secondaryLabel: fields.text({ label: "Second button text (optional)" }),
            secondaryLink: fields.text({ label: "Second button link" }),
          },
          {
            label: "Bottom call-to-action",
            description: "The dark closing section every page ends with",
          }
        ),
      },
    }),

    // Upcoming events → content/events/*.mdx + a graphic each.
    // These drive the homepage carousel and the Events page.
    events: collection({
      label: "Events",
      path: "content/events/*",
      slugField: "title",
      format: { contentField: "description" },
      schema: {
        title: fields.slug({ name: { label: "Event name" } }),
        date: fields.date({ label: "Date", validation: { isRequired: true } }),
        time: fields.text({
          label: "Time (as shown)",
          description: "e.g. \"6:30 PM\" or \"8:00 AM – 12:30 PM\" — leave blank for all-day",
        }),
        showUntil: fields.date({
          label: "End date (multi-day events)",
          description: "Optional — shows a date range like Sep 11 – 13 and keeps the event visible through this date.",
        }),
        location: fields.text({
          label: "Location",
          description: "Only needed when it's not at the church",
        }),
        image: fields.image({
          label: "Event graphic",
          directory: "public/images/events",
          publicPath: "/images/events/",
        }),
        signupLink: fields.url({
          label: "Sign-up link (optional)",
          description: "A registration or sign-up URL, if the event has one",
        }),
        // Images dropped into the description must land somewhere the site
        // can actually serve them. Without this, Keystatic writes them next
        // to the .mdx file under content/, which is never served over HTTP —
        // the editor preview looks right but the live page shows a broken
        // image. publicPath is what gets written into the markdown.
        description: fields.mdx({
          label: "About the event",
          options: { image: contentImages },
        }),
      },
    }),

    // Staff and ministry leader bios → content/staff/*.md + a photo each.
    staff: collection({
      label: "Staff & Leaders",
      path: "content/staff/*",
      slugField: "name",
      format: { contentField: "bio" },
      schema: {
        name: fields.slug({ name: { label: "Name" } }),
        role: fields.text({ label: "Role / title" }),
        order: fields.integer({
          label: "Display order",
          description: "Lower numbers appear first on the About page",
          defaultValue: 99,
        }),
        photo: fields.image({
          label: "Photo",
          directory: "public/images/staff",
          publicPath: "/images/staff/",
        }),
        bio: fields.mdx({
          label: "Bio",
          options: { image: contentImages },
        }),
      },
    }),

    // Rotating homepage testimonials → content/testimonials/*.mdx
    testimonials: collection({
      label: "Testimonials",
      path: "content/testimonials/*",
      slugField: "name",
      format: { contentField: "quote" },
      schema: {
        name: fields.slug({ name: { label: "Name (as shown, e.g. 'Sarah M.')" } }),
        detail: fields.text({
          label: "One-line context",
          description: "e.g. 'Visiting since 2021' or 'Google review'",
        }),
        quote: fields.mdx({ label: "The quote" }),
      },
    }),

    // Short homepage announcements → content/announcements/*.md
    announcements: collection({
      label: "Announcements",
      path: "content/announcements/*",
      slugField: "title",
      format: { contentField: "body" },
      schema: {
        title: fields.slug({ name: { label: "Title" } }),
        expires: fields.date({
          label: "Show until",
          description: "The announcement disappears from the site after this date",
        }),
        link: fields.url({
          label: "Link (optional)",
          description: "Where clicking the announcement goes (e.g. a registration page)",
        }),
        body: fields.mdx({
          label: "Details",
          options: { image: contentImages },
        }),
      },
    }),
  },
});
