// Shop sections/collections the owner manages in the admin. A product can be
// assigned to one section (by id); the shop and home page then group those
// products under the section's title instead of the default lists.
//
// This is the starting set seeded into a brand-new database — the collab is
// here ready to fill with designs. After that, sections live in Supabase and
// are edited from Admin → Sections.
export const SEED_SECTIONS = [
  {
    id: 'weronika-collab',
    title: 'Faithfull Stickers × Weronika',
    blurb: 'A limited collab — designs by Weronika, cut and finished by Faithfull Stickers.',
    showOnHome: true,
  },
]
