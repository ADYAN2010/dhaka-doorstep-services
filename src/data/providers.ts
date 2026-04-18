export type Provider = {
  slug: string;
  name: string;                 // Person/team name
  businessName?: string;        // Optional brand name
  type: "individual" | "agency";
  categorySlug: string;
  categoryName: string;
  rating: number;
  reviews: number;
  jobsCompleted: number;
  responseTime: string;
  yearsExperience: number;
  areas: string[];              // area slugs
  verified: boolean;
  topRated?: boolean;
  bio: string;
  pricing: string;
  initials: string;
  services?: string[];          // services offered (display labels)
  gallery?: string[];           // image URLs (placeholders ok)
  availability?: { day: string; hours: string }[];
  languages?: string[];
  ratingBreakdown?: { stars: 5 | 4 | 3 | 2 | 1; count: number }[];
};

const defaultAvailability = [
  { day: "Mon", hours: "8:00 AM – 8:00 PM" },
  { day: "Tue", hours: "8:00 AM – 8:00 PM" },
  { day: "Wed", hours: "8:00 AM – 8:00 PM" },
  { day: "Thu", hours: "8:00 AM – 8:00 PM" },
  { day: "Fri", hours: "10:00 AM – 6:00 PM" },
  { day: "Sat", hours: "9:00 AM – 8:00 PM" },
  { day: "Sun", hours: "Closed" },
];

const galleryPool = [
  "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&auto=format&fit=crop&q=70",
  "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&auto=format&fit=crop&q=70",
  "https://images.unsplash.com/photo-1581578017093-cd30fce4eeb7?w=800&auto=format&fit=crop&q=70",
  "https://images.unsplash.com/photo-1507089947368-19c1da9775ae?w=800&auto=format&fit=crop&q=70",
  "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&auto=format&fit=crop&q=70",
  "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&auto=format&fit=crop&q=70",
];

function breakdown(rating: number, total: number) {
  // Bias higher ratings near the avg
  const fives = Math.round(total * (rating >= 4.8 ? 0.78 : rating >= 4.5 ? 0.6 : 0.45));
  const fours = Math.round(total * 0.18);
  const threes = Math.round(total * 0.05);
  const twos = Math.round(total * 0.02);
  const ones = Math.max(0, total - fives - fours - threes - twos);
  return [
    { stars: 5 as const, count: fives },
    { stars: 4 as const, count: fours },
    { stars: 3 as const, count: threes },
    { stars: 2 as const, count: twos },
    { stars: 1 as const, count: ones },
  ];
}

const base = (p: Omit<Provider, "availability" | "ratingBreakdown" | "gallery">): Provider => ({
  ...p,
  availability: defaultAvailability,
  ratingBreakdown: breakdown(p.rating, p.reviews),
  gallery: galleryPool,
});

export const providers: Provider[] = [
  base({
    slug: "shadhin-home-care", name: "Shadhin Home Care", businessName: "Shadhin Home Care Ltd.", type: "agency",
    categorySlug: "home-cleaning", categoryName: "Home Cleaning",
    rating: 4.9, reviews: 412, jobsCompleted: 1820, responseTime: "< 30 min", yearsExperience: 6,
    areas: ["dhanmondi", "mohammadpur", "farmgate"], verified: true, topRated: true,
    bio: "Trained 24-person crew, eco-friendly chemicals, satisfaction guaranteed. Specialists in apartment deep cleaning across central Dhaka.",
    pricing: "From ৳2,499 / job", initials: "SH",
    services: ["Deep Home Cleaning", "Sofa Cleaning", "Kitchen Deep Clean", "Bathroom Cleaning", "Office Cleaning"],
    languages: ["Bangla", "English"],
  }),
  base({
    slug: "cool-tech-bd", name: "Cool Tech BD", businessName: "Cool Tech Bangladesh", type: "agency",
    categorySlug: "ac-service", categoryName: "AC Servicing",
    rating: 4.8, reviews: 631, jobsCompleted: 3200, responseTime: "< 1 hr", yearsExperience: 9,
    areas: ["gulshan", "banani", "uttara", "bashundhara"], verified: true, topRated: true,
    bio: "All-brand AC service & repair. Same-day visits, transparent quotes, 90-day workmanship warranty.",
    pricing: "From ৳999 / AC", initials: "CT",
    services: ["AC General Service", "AC Master Service", "AC Repair", "Gas Refill", "AC Installation"],
    languages: ["Bangla", "English", "Hindi"],
  }),
  base({
    slug: "rashed-electric", name: "Rashed Hossain", type: "individual",
    categorySlug: "electrician", categoryName: "Electrician",
    rating: 4.9, reviews: 287, jobsCompleted: 940, responseTime: "< 45 min", yearsExperience: 12,
    areas: ["mirpur", "mohammadpur", "farmgate"], verified: true,
    bio: "Licensed electrician with 12 years of residential & light-commercial experience. Punctual, neat, fully tooled.",
    pricing: "From ৳399 / visit", initials: "RH",
    services: ["Wiring & Rewiring", "Switchboard Repair", "Light & Fan Install", "Inverter Setup"],
    languages: ["Bangla"],
  }),
  base({
    slug: "dhaka-plumb-pros", name: "Dhaka Plumb Pros", businessName: "Dhaka Plumbing Pros", type: "agency",
    categorySlug: "plumbing", categoryName: "Plumbing",
    rating: 4.7, reviews: 198, jobsCompleted: 720, responseTime: "< 1 hr", yearsExperience: 7,
    areas: ["dhanmondi", "gulshan", "banani"], verified: true,
    bio: "Emergency leak fix, full bathroom plumbing, water tank cleaning. 7-day rework guarantee.",
    pricing: "From ৳499 / visit", initials: "DP",
    services: ["Leak Repair", "Bathroom Plumbing", "Tank Cleaning", "Pipe Replacement"],
    languages: ["Bangla"],
  }),
  base({
    slug: "shine-auto-care", name: "Shine Auto Care", businessName: "Shine Auto Care BD", type: "agency",
    categorySlug: "car-wash", categoryName: "Car Wash",
    rating: 4.8, reviews: 514, jobsCompleted: 2100, responseTime: "Same day", yearsExperience: 5,
    areas: ["gulshan", "banani", "uttara", "bashundhara"], verified: true, topRated: true,
    bio: "Doorstep wash, detailing & ceramic coating. Premium products, gentle on paint.",
    pricing: "From ৳499 / car", initials: "SA",
    services: ["Doorstep Wash", "Interior Detailing", "Ceramic Coating", "Polishing"],
    languages: ["Bangla", "English"],
  }),
  base({
    slug: "safehome-pest", name: "SafeHome Pest Control", businessName: "SafeHome Services", type: "agency",
    categorySlug: "pest-control", categoryName: "Pest Control",
    rating: 4.9, reviews: 322, jobsCompleted: 1100, responseTime: "< 2 hrs", yearsExperience: 8,
    areas: ["dhanmondi", "mirpur", "uttara", "mohammadpur"], verified: true,
    bio: "Govt-approved chemicals, child & pet safe. 6-month service guarantee on most treatments.",
    pricing: "From ৳1,999 / home", initials: "SP",
    services: ["General Pest Control", "Cockroach Treatment", "Termite Control", "Bedbug Removal"],
    languages: ["Bangla"],
  }),
  base({
    slug: "color-craft-painters", name: "Color Craft Painters", businessName: "Color Craft Painting Co.", type: "agency",
    categorySlug: "painting", categoryName: "Painting",
    rating: 4.7, reviews: 156, jobsCompleted: 480, responseTime: "< 1 day", yearsExperience: 10,
    areas: ["dhanmondi", "gulshan", "uttara", "mirpur"], verified: true,
    bio: "Berger & Asian Paints certified team. Free shade consultation and surface prep included.",
    pricing: "From ৳30 / sqft", initials: "CC",
    services: ["Interior Painting", "Exterior Painting", "Texture & Wallpaper", "Wood Polish"],
    languages: ["Bangla", "English"],
  }),
  base({
    slug: "swift-movers", name: "Swift Movers BD", businessName: "Swift Movers Bangladesh", type: "agency",
    categorySlug: "movers", categoryName: "Shifting",
    rating: 4.8, reviews: 244, jobsCompleted: 690, responseTime: "Next day", yearsExperience: 6,
    areas: ["uttara", "gulshan", "bashundhara", "mirpur"], verified: true,
    bio: "Insured packing, careful loading, same-day relocation within Dhaka. No hidden fees.",
    pricing: "From ৳6,999 / move", initials: "SM",
    services: ["Home Shifting", "Office Shifting", "Packing Service", "Item Storage"],
    languages: ["Bangla", "English"],
  }),
  base({
    slug: "fixit-appliance", name: "FixIt Appliance", businessName: "FixIt Appliance Care", type: "agency",
    categorySlug: "appliance-repair", categoryName: "Appliance Repair",
    rating: 4.8, reviews: 378, jobsCompleted: 1450, responseTime: "< 2 hrs", yearsExperience: 11,
    areas: ["dhanmondi", "mohammadpur", "farmgate", "old-dhaka"], verified: true, topRated: true,
    bio: "Fridge, washing machine, microwave, oven — all brands. 30-day warranty on repairs.",
    pricing: "From ৳599 / visit", initials: "FI",
    services: ["Fridge Repair", "Washing Machine Repair", "Microwave Repair", "Oven Repair"],
    languages: ["Bangla", "English"],
  }),
  base({
    slug: "secure-vision-cctv", name: "Secure Vision CCTV", businessName: "Secure Vision Systems", type: "agency",
    categorySlug: "cctv-security", categoryName: "CCTV & Security",
    rating: 4.9, reviews: 142, jobsCompleted: 320, responseTime: "< 1 day", yearsExperience: 8,
    areas: ["gulshan", "banani", "bashundhara", "uttara"], verified: true,
    bio: "Hikvision & Dahua certified installer. Cabling, DVR, mobile app setup, 1-year warranty.",
    pricing: "From ৳14,999 / 4-cam", initials: "SV",
    services: ["CCTV Installation", "DVR Setup", "Mobile App Setup", "Maintenance Contract"],
    languages: ["Bangla", "English"],
  }),
  base({
    slug: "glow-beauty-home", name: "Glow Beauty at Home", businessName: "Glow Beauty Studio", type: "agency",
    categorySlug: "beauty-at-home", categoryName: "Beauty",
    rating: 4.9, reviews: 587, jobsCompleted: 2400, responseTime: "Same day", yearsExperience: 5,
    areas: ["dhanmondi", "gulshan", "banani", "uttara"], verified: true, topRated: true,
    bio: "Female-only beautician team. Hygiene-certified tools, branded products, on-time arrival.",
    pricing: "From ৳599 / session", initials: "GB",
    services: ["Facial", "Manicure & Pedicure", "Hair Spa", "Bridal Package"],
    languages: ["Bangla", "English"],
  }),
  base({
    slug: "code-craft-studio", name: "CodeCraft Studio", businessName: "CodeCraft Digital", type: "agency",
    categorySlug: "web-development", categoryName: "Web Development",
    rating: 4.9, reviews: 88, jobsCompleted: 130, responseTime: "< 1 day", yearsExperience: 7,
    areas: ["gulshan", "banani", "dhanmondi"], verified: true,
    bio: "Modern websites, e-commerce and SaaS dashboards. React, Next.js, TanStack Start specialists.",
    pricing: "From ৳24,999 / project", initials: "CC",
    services: ["Website Design", "E-commerce Build", "SaaS Dashboard", "SEO Setup"],
    languages: ["English", "Bangla"],
  }),
  base({
    slug: "nazmul-tutoring", name: "Nazmul Karim", type: "individual",
    categorySlug: "tuition", categoryName: "Tuition",
    rating: 4.8, reviews: 64, jobsCompleted: 180, responseTime: "< 4 hrs", yearsExperience: 9,
    areas: ["mirpur", "mohammadpur", "dhanmondi"], verified: true,
    bio: "BUET graduate. Math & Physics tutor for HSC and admission test prep. Patient, structured, results-driven.",
    pricing: "From ৳800 / session", initials: "NK",
    services: ["HSC Math", "HSC Physics", "Admission Coaching"],
    languages: ["Bangla", "English"],
  }),
  base({
    slug: "happy-events-bd", name: "Happy Events BD", businessName: "Happy Events Bangladesh", type: "agency",
    categorySlug: "event-services", categoryName: "Event Services",
    rating: 4.7, reviews: 73, jobsCompleted: 95, responseTime: "< 1 day", yearsExperience: 4,
    areas: ["gulshan", "banani", "uttara"], verified: true,
    bio: "Birthdays, mehendi, corporate events. Decor, photography, sound — full turnkey production.",
    pricing: "From ৳14,999 / event", initials: "HE",
    services: ["Birthday Decor", "Mehendi Setup", "Corporate Event", "Photo & Video"],
    languages: ["Bangla", "English"],
  }),
  base({
    slug: "noor-caregivers", name: "Noor Care Services", businessName: "Noor Caregivers", type: "agency",
    categorySlug: "caregiving", categoryName: "Caregiving",
    rating: 4.9, reviews: 51, jobsCompleted: 140, responseTime: "< 6 hrs", yearsExperience: 5,
    areas: ["dhanmondi", "gulshan", "mohammadpur"], verified: true,
    bio: "Trained caregivers for elderly and post-surgery support. Day shifts, night shifts, live-in options.",
    pricing: "From ৳1,499 / day", initials: "NC",
    services: ["Elderly Care", "Post-Surgery Care", "Night Shift", "Live-in Care"],
    languages: ["Bangla"],
  }),
  base({
    slug: "pixel-perfect-design", name: "Pixel Perfect Design", businessName: "Pixel Perfect Studio", type: "agency",
    categorySlug: "graphic-design", categoryName: "Graphic Design",
    rating: 4.7, reviews: 112, jobsCompleted: 360, responseTime: "< 12 hrs", yearsExperience: 6,
    areas: ["gulshan", "banani", "dhanmondi", "uttara"], verified: true,
    bio: "Brand identity, social media kits, packaging design. Fast turnaround, unlimited revisions.",
    pricing: "From ৳3,999 / brief", initials: "PP",
    services: ["Logo Design", "Social Media Kit", "Packaging", "Brand Guidelines"],
    languages: ["English", "Bangla"],
  }),
];

export function findProvider(slug: string) {
  return providers.find((p) => p.slug === slug);
}

export const featuredProviders = providers.filter((p) => p.topRated);
