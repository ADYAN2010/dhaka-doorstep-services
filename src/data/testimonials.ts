export type Testimonial = {
  name: string;
  area: string;
  service: string;
  rating: number;
  quote: string;
  initials: string;
  /** Optional avatar URL — falls back to initials gradient bubble. */
  avatar?: string;
  /** Marks the review as tied to a real completed booking (trust signal). */
  verifiedBooking?: boolean;
};

export const testimonials: Testimonial[] = [
  {
    name: "Tasnim Akter",
    area: "Dhanmondi",
    service: "Deep Home Cleaning",
    rating: 5,
    quote: "The crew arrived on time, was respectful and the apartment looked brand new. Booking took two minutes.",
    initials: "TA",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80",
    verifiedBooking: true,
  },
  {
    name: "Imran Hossain",
    area: "Gulshan",
    service: "AC Master Service",
    rating: 5,
    quote: "Diagnosed a gas leak the same day, fixed it next morning. Transparent pricing — no surprises.",
    initials: "IH",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
    verifiedBooking: true,
  },
  {
    name: "Nadia Rahman",
    area: "Uttara",
    service: "Bridal Beauty Package",
    rating: 5,
    quote: "Glow Beauty did my full bridal look at home. Professional, hygienic, exactly the look I wanted.",
    initials: "NR",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80",
    verifiedBooking: true,
  },
  {
    name: "Shafiq Ahmed",
    area: "Mirpur",
    service: "Electrician",
    rating: 5,
    quote: "Rashed bhai sorted three issues we'd ignored for months in one visit. Will book again.",
    initials: "SA",
    avatar: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=200&auto=format&fit=crop&q=80",
    verifiedBooking: true,
  },
  {
    name: "Mehnaz Karim",
    area: "Bashundhara",
    service: "Pest Control",
    rating: 4,
    quote: "Safe products, no smell, and the cockroaches are gone. Their 6-month guarantee gave me confidence.",
    initials: "MK",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&auto=format&fit=crop&q=80",
    verifiedBooking: true,
  },
  {
    name: "Rafiq Chowdhury",
    area: "Banani",
    service: "Office Shifting",
    rating: 5,
    quote: "Moved our 12-person office overnight. Nothing damaged, all set up and running by 9am.",
    initials: "RC",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80",
    verifiedBooking: true,
  },
];
