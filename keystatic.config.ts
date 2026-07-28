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

export default config({
  storage: { kind: "local" },

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
        bio: fields.mdx({ label: "Bio" }),
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
        body: fields.mdx({ label: "Details" }),
      },
    }),
  },
});
