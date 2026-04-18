// Sample category / subcategory / service data for Phase 1 (static).
// In later phases this will be backed by Lovable Cloud tables.

import {
  Sparkles, Wind, Plug, Droplets, Car, Bug, Paintbrush2, Truck,
  Wrench, ShieldCheck, Scissors, Baby, GraduationCap, PartyPopper,
  Sofa, Megaphone, Code, Palette, Scale, Briefcase,
  type LucideIcon,
} from "lucide-react";

export type Service = {
  slug: string;
  name: string;
  short: string;
  startingPrice: number; // BDT
  unit?: string;
  duration?: string;
};

export type Subcategory = {
  slug: string;
  name: string;
  services: Service[];
};

export type Category = {
  slug: string;
  name: string;
  tagline: string;
  icon: LucideIcon;
  accent: string; // tailwind utility class for icon tint background
  popular?: boolean;
  subcategories: Subcategory[];
};

export const categories: Category[] = [
  {
    slug: "home-cleaning",
    name: "Home Cleaning",
    tagline: "Spotless homes by trained crews",
    icon: Sparkles,
    accent: "bg-primary/10 text-primary",
    popular: true,
    subcategories: [
      {
        slug: "deep-cleaning",
        name: "Deep Cleaning",
        services: [
          { slug: "deep-home-cleaning", name: "Deep Home Cleaning", short: "Full apartment top-to-bottom clean", startingPrice: 2499, unit: "from", duration: "4–6 hrs" },
          { slug: "sofa-cleaning", name: "Sofa Cleaning", short: "Shampoo + steam clean", startingPrice: 799, unit: "per seat", duration: "1 hr" },
          { slug: "kitchen-deep-clean", name: "Kitchen Deep Clean", short: "Oil, grease & cabinet detail", startingPrice: 1499, unit: "from", duration: "2–3 hrs" },
          { slug: "bathroom-cleaning", name: "Bathroom Cleaning", short: "Tile, fittings & sanitization", startingPrice: 599, unit: "per bath", duration: "1 hr" },
        ],
      },
      {
        slug: "office-cleaning",
        name: "Office Cleaning",
        services: [
          { slug: "office-deep-clean", name: "Office Deep Clean", short: "After-hours commercial cleaning", startingPrice: 4999, unit: "from", duration: "4+ hrs" },
        ],
      },
    ],
  },
  {
    slug: "ac-service",
    name: "AC Repair & Servicing",
    tagline: "Cool again, fast",
    icon: Wind,
    accent: "bg-chart-2/10 text-chart-2",
    popular: true,
    subcategories: [
      {
        slug: "ac-servicing",
        name: "Servicing",
        services: [
          { slug: "ac-general-service", name: "AC General Service", short: "Filter clean + gas check", startingPrice: 999, unit: "per AC", duration: "45 min" },
          { slug: "ac-master-service", name: "AC Master Service", short: "Full chemical wash", startingPrice: 1899, unit: "per AC", duration: "1.5 hrs" },
        ],
      },
      {
        slug: "ac-repair",
        name: "Repair & Install",
        services: [
          { slug: "ac-repair", name: "AC Repair", short: "Diagnose & fix any issue", startingPrice: 599, unit: "visit", duration: "1–2 hrs" },
          { slug: "ac-installation", name: "AC Installation", short: "Wall mount & piping", startingPrice: 2499, unit: "per unit", duration: "2–3 hrs" },
        ],
      },
    ],
  },
  {
    slug: "electrician",
    name: "Electrician",
    tagline: "Wiring, fittings & fixes",
    icon: Plug,
    accent: "bg-warning/15 text-warning",
    popular: true,
    subcategories: [
      {
        slug: "general-electric",
        name: "General Electric",
        services: [
          { slug: "switch-socket-fix", name: "Switch & Socket Fix", short: "Replace damaged points", startingPrice: 399, unit: "visit", duration: "30–60 min" },
          { slug: "fan-installation", name: "Ceiling Fan Install", short: "Mount + wire", startingPrice: 599, unit: "per fan", duration: "45 min" },
          { slug: "house-rewiring", name: "House Rewiring", short: "Survey + full rewire", startingPrice: 9999, unit: "from", duration: "Custom" },
        ],
      },
    ],
  },
  {
    slug: "plumbing",
    name: "Plumbing",
    tagline: "Leaks, fittings, drainage",
    icon: Droplets,
    accent: "bg-chart-2/10 text-chart-2",
    popular: true,
    subcategories: [
      {
        slug: "plumb-fix",
        name: "Repairs & Fittings",
        services: [
          { slug: "leak-repair", name: "Leak Repair", short: "Pipe & joint leak fix", startingPrice: 499, unit: "visit", duration: "1 hr" },
          { slug: "tap-installation", name: "Tap / Mixer Install", short: "Replace or install new", startingPrice: 399, unit: "per tap", duration: "30 min" },
          { slug: "drain-unclog", name: "Drain Unclogging", short: "Sink, basin or toilet", startingPrice: 699, unit: "visit", duration: "1 hr" },
        ],
      },
    ],
  },
  {
    slug: "car-wash",
    name: "Car Wash",
    tagline: "Doorstep car care",
    icon: Car,
    accent: "bg-primary/10 text-primary",
    subcategories: [{
      slug: "car-care",
      name: "Car Care",
      services: [
        { slug: "exterior-wash", name: "Exterior Wash", short: "Foam wash + dry", startingPrice: 499, unit: "per car", duration: "30 min" },
        { slug: "full-detail", name: "Full Interior + Exterior", short: "Vacuum, wax & shine", startingPrice: 1499, unit: "per car", duration: "1.5 hrs" },
      ],
    }],
  },
  {
    slug: "pest-control",
    name: "Pest Control",
    tagline: "Safe, certified treatment",
    icon: Bug,
    accent: "bg-destructive/10 text-destructive",
    subcategories: [{
      slug: "pest",
      name: "Pest Control",
      services: [
        { slug: "general-pest", name: "General Pest Control", short: "Cockroach, ant, spider", startingPrice: 1999, unit: "per home", duration: "1.5 hrs" },
        { slug: "termite-treatment", name: "Termite Treatment", short: "Wood + soil treatment", startingPrice: 4999, unit: "from", duration: "Half day" },
      ],
    }],
  },
  {
    slug: "painting",
    name: "Painting",
    tagline: "Interior & exterior",
    icon: Paintbrush2,
    accent: "bg-accent text-accent-foreground",
    subcategories: [{
      slug: "paint",
      name: "Painting",
      services: [
        { slug: "room-painting", name: "Room Painting", short: "Walls, ceiling, finish", startingPrice: 30, unit: "per sqft", duration: "1–2 days" },
        { slug: "full-home-paint", name: "Full Home Paint", short: "Survey + complete repaint", startingPrice: 19999, unit: "from", duration: "3–7 days" },
      ],
    }],
  },
  {
    slug: "movers",
    name: "Shifting & Movers",
    tagline: "House & office relocation",
    icon: Truck,
    accent: "bg-chart-2/10 text-chart-2",
    subcategories: [{
      slug: "shifting",
      name: "Shifting",
      services: [
        { slug: "home-shifting", name: "Home Shifting", short: "Pack, load, transport, unpack", startingPrice: 6999, unit: "from", duration: "Half day" },
        { slug: "office-shifting", name: "Office Shifting", short: "After-hours office move", startingPrice: 12999, unit: "from", duration: "Custom" },
      ],
    }],
  },
  {
    slug: "appliance-repair",
    name: "Appliance Repair",
    tagline: "Fridge, washer, microwave",
    icon: Wrench,
    accent: "bg-primary/10 text-primary",
    subcategories: [{
      slug: "appliance",
      name: "Appliance Repair",
      services: [
        { slug: "fridge-repair", name: "Refrigerator Repair", short: "All brands", startingPrice: 699, unit: "visit", duration: "1–2 hrs" },
        { slug: "washing-machine-repair", name: "Washing Machine Repair", short: "Front & top load", startingPrice: 699, unit: "visit", duration: "1 hr" },
        { slug: "microwave-repair", name: "Microwave Repair", short: "Diagnose + fix", startingPrice: 599, unit: "visit", duration: "1 hr" },
      ],
    }],
  },
  {
    slug: "cctv-security",
    name: "CCTV & Security",
    tagline: "Install & monitoring setup",
    icon: ShieldCheck,
    accent: "bg-success/15 text-success",
    subcategories: [{
      slug: "security",
      name: "Security",
      services: [
        { slug: "cctv-install-4cam", name: "CCTV Install (4 cam)", short: "Cameras, DVR, wiring", startingPrice: 14999, unit: "package", duration: "Half day" },
        { slug: "intercom-setup", name: "Intercom Setup", short: "Apartment intercom", startingPrice: 4999, unit: "from", duration: "Half day" },
      ],
    }],
  },
  {
    slug: "beauty-at-home",
    name: "Beauty at Home",
    tagline: "Salon experience, your home",
    icon: Scissors,
    accent: "bg-chart-5/10 text-chart-5",
    subcategories: [{
      slug: "beauty",
      name: "Beauty",
      services: [
        { slug: "haircut-female", name: "Haircut (Female)", short: "Trim + styling", startingPrice: 599, unit: "per session", duration: "45 min" },
        { slug: "facial", name: "Facial", short: "Cleanup + glow", startingPrice: 999, unit: "per session", duration: "1 hr" },
        { slug: "bridal-package", name: "Bridal Package", short: "Full bridal makeup", startingPrice: 12999, unit: "package", duration: "3 hrs" },
      ],
    }],
  },
  {
    slug: "caregiving",
    name: "Babysitting & Care",
    tagline: "Trained, verified caregivers",
    icon: Baby,
    accent: "bg-warning/15 text-warning",
    subcategories: [{
      slug: "care",
      name: "Caregiving",
      services: [
        { slug: "babysitter", name: "Babysitter", short: "Hourly child care", startingPrice: 200, unit: "per hour", duration: "Flexible" },
        { slug: "elderly-care", name: "Elderly Care Attendant", short: "Day / night shifts", startingPrice: 1200, unit: "per shift", duration: "8 / 12 hrs" },
      ],
    }],
  },
  {
    slug: "tuition",
    name: "Tuition & Coaching",
    tagline: "Verified tutors at home",
    icon: GraduationCap,
    accent: "bg-chart-2/10 text-chart-2",
    subcategories: [{
      slug: "tutor",
      name: "Home Tutor",
      services: [
        { slug: "school-tutor", name: "School Tutor", short: "Class 1–10, all subjects", startingPrice: 4000, unit: "per month", duration: "3x / week" },
        { slug: "english-spoken", name: "Spoken English", short: "Adult & student courses", startingPrice: 5000, unit: "per month", duration: "3x / week" },
      ],
    }],
  },
  {
    slug: "event-services",
    name: "Event Services",
    tagline: "Birthdays, weddings, corporate",
    icon: PartyPopper,
    accent: "bg-chart-5/10 text-chart-5",
    subcategories: [{
      slug: "events",
      name: "Events",
      services: [
        { slug: "birthday-decor", name: "Birthday Decoration", short: "Theme + setup", startingPrice: 4999, unit: "from", duration: "Same day" },
        { slug: "wedding-photo", name: "Wedding Photography", short: "Full day coverage", startingPrice: 24999, unit: "package", duration: "Full day" },
      ],
    }],
  },
  {
    slug: "interior-design",
    name: "Interior Design",
    tagline: "Smart, custom interiors",
    icon: Sofa,
    accent: "bg-primary/10 text-primary",
    subcategories: [{
      slug: "interior",
      name: "Interior",
      services: [
        { slug: "consultation", name: "Design Consultation", short: "On-site visit + plan", startingPrice: 2999, unit: "session", duration: "2 hrs" },
        { slug: "full-fitout", name: "Full Apartment Fit-out", short: "Design + build + handover", startingPrice: 350000, unit: "from", duration: "Custom" },
      ],
    }],
  },
  {
    slug: "digital-marketing",
    name: "Digital Marketing",
    tagline: "Grow online with experts",
    icon: Megaphone,
    accent: "bg-chart-2/10 text-chart-2",
    subcategories: [{
      slug: "marketing",
      name: "Marketing",
      services: [
        { slug: "social-media-mgmt", name: "Social Media Management", short: "Content + ads", startingPrice: 14999, unit: "per month", duration: "Monthly" },
        { slug: "seo-package", name: "SEO Package", short: "On-page + link building", startingPrice: 19999, unit: "per month", duration: "Monthly" },
      ],
    }],
  },
  {
    slug: "web-development",
    name: "Web Design & Dev",
    tagline: "Websites & web apps",
    icon: Code,
    accent: "bg-primary/10 text-primary",
    subcategories: [{
      slug: "web",
      name: "Web",
      services: [
        { slug: "business-website", name: "Business Website", short: "Up to 8 pages", startingPrice: 24999, unit: "project", duration: "2–4 weeks" },
        { slug: "ecommerce-site", name: "E-commerce Site", short: "Catalog + checkout", startingPrice: 59999, unit: "project", duration: "4–8 weeks" },
      ],
    }],
  },
  {
    slug: "graphic-design",
    name: "Graphic Design",
    tagline: "Brand, social, print",
    icon: Palette,
    accent: "bg-chart-5/10 text-chart-5",
    subcategories: [{
      slug: "design",
      name: "Design",
      services: [
        { slug: "logo-design", name: "Logo Design", short: "3 concepts + revisions", startingPrice: 4999, unit: "project", duration: "1 week" },
        { slug: "social-creatives", name: "Social Media Creatives", short: "10 posts / month", startingPrice: 7999, unit: "per month", duration: "Monthly" },
      ],
    }],
  },
  {
    slug: "legal-assistance",
    name: "Legal Assistance",
    tagline: "Verified lawyers & advisors",
    icon: Scale,
    accent: "bg-accent text-accent-foreground",
    subcategories: [{
      slug: "legal",
      name: "Legal",
      services: [
        { slug: "legal-consult", name: "Legal Consultation", short: "30 min advisor call", startingPrice: 1999, unit: "session", duration: "30 min" },
        { slug: "contract-drafting", name: "Contract Drafting", short: "Custom legal docs", startingPrice: 4999, unit: "from", duration: "2–5 days" },
      ],
    }],
  },
  {
    slug: "business-consultancy",
    name: "Business Consultancy",
    tagline: "Strategy, ops, finance",
    icon: Briefcase,
    accent: "bg-chart-2/10 text-chart-2",
    subcategories: [{
      slug: "consult",
      name: "Consulting",
      services: [
        { slug: "biz-strategy", name: "Business Strategy Session", short: "1-on-1 advisory", startingPrice: 4999, unit: "session", duration: "1 hr" },
        { slug: "tax-vat-help", name: "Tax & VAT Filing Help", short: "BD compliance", startingPrice: 3999, unit: "from", duration: "Custom" },
      ],
    }],
  },
];

export function findCategory(slug: string): Category | undefined {
  return categories.find((c) => c.slug === slug);
}

export function findService(
  categorySlug: string,
  serviceSlug: string
): { category: Category; subcategory: Subcategory; service: Service } | undefined {
  const category = findCategory(categorySlug);
  if (!category) return undefined;
  for (const sub of category.subcategories) {
    const service = sub.services.find((s) => s.slug === serviceSlug);
    if (service) return { category, subcategory: sub, service };
  }
  return undefined;
}

export const popularCategories = categories.filter((c) => c.popular);

export const mainGroups = [
  { name: "Home Services", slugs: ["home-cleaning", "ac-service", "electrician", "plumbing", "appliance-repair", "pest-control", "painting", "movers"] },
  { name: "Personal Services", slugs: ["beauty-at-home", "caregiving", "tuition", "car-wash"] },
  { name: "Business Services", slugs: ["digital-marketing", "web-development", "graphic-design", "business-consultancy", "legal-assistance"] },
  { name: "Lifestyle & Events", slugs: ["event-services", "interior-design", "cctv-security"] },
];
