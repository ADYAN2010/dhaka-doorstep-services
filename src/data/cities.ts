// Multi-city scaffolding. Today: Dhaka. Tomorrow: Chattogram, Sylhet, Rajshahi, Khulna, ...
// Areas live under their parent city so the data model scales nationally.

export type City = {
  slug: string;
  name: string;
  country: string;
  live: boolean;        // true = booking enabled, false = waitlist
  tagline: string;
};

export const cities: City[] = [
  { slug: "dhaka",      name: "Dhaka",      country: "Bangladesh", live: true,  tagline: "Capital — full coverage across 11 neighborhoods." },
  { slug: "chattogram", name: "Chattogram", country: "Bangladesh", live: false, tagline: "Coming soon — join the waitlist." },
  { slug: "sylhet",     name: "Sylhet",     country: "Bangladesh", live: false, tagline: "Coming soon — join the waitlist." },
  { slug: "rajshahi",   name: "Rajshahi",   country: "Bangladesh", live: false, tagline: "Coming soon — join the waitlist." },
  { slug: "khulna",     name: "Khulna",     country: "Bangladesh", live: false, tagline: "Coming soon — join the waitlist." },
];

export function findCity(slug: string) {
  return cities.find((c) => c.slug === slug);
}
