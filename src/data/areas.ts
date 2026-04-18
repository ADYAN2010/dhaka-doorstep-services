export type Area = {
  slug: string;
  name: string;
  zone: string;
  blurb: string;
  postal: string;
};

export const areas: Area[] = [
  { slug: "dhanmondi", name: "Dhanmondi", zone: "Central Dhaka", postal: "1205", blurb: "Lakefront residential & business hub with fast same-day service availability." },
  { slug: "gulshan", name: "Gulshan", zone: "North Dhaka", postal: "1212", blurb: "Premium diplomatic zone — most providers reach within 60 minutes." },
  { slug: "banani", name: "Banani", zone: "North Dhaka", postal: "1213", blurb: "Trendy commercial-residential area with full service coverage." },
  { slug: "uttara", name: "Uttara", zone: "North Dhaka", postal: "1230", blurb: "Modern planned suburb — wide provider coverage, sectors 1–18." },
  { slug: "mirpur", name: "Mirpur", zone: "North Dhaka", postal: "1216", blurb: "From Mirpur 1 to DOHS — every block covered by verified pros." },
  { slug: "mohammadpur", name: "Mohammadpur", zone: "Central Dhaka", postal: "1207", blurb: "Dense residential area with affordable, fast professionals on standby." },
  { slug: "bashundhara", name: "Bashundhara R/A", zone: "East Dhaka", postal: "1229", blurb: "Premium residential — A to N blocks fully serviced." },
  { slug: "badda", name: "Badda", zone: "East Dhaka", postal: "1212", blurb: "From Gulshan-link to Aftabnagar, our crews cover all sub-areas." },
  { slug: "farmgate", name: "Farmgate", zone: "Central Dhaka", postal: "1215", blurb: "Central transit + commercial — quick response and same-day bookings." },
  { slug: "motijheel", name: "Motijheel", zone: "Old Dhaka", postal: "1000", blurb: "CBD coverage for offices, banks and corporate clients." },
  { slug: "old-dhaka", name: "Old Dhaka", zone: "Old Dhaka", postal: "1100", blurb: "Heritage neighborhoods served by experienced local providers." },
];

export function findArea(slug: string) {
  return areas.find((a) => a.slug === slug);
}
