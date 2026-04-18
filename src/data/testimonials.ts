export type Testimonial = {
  name: string;
  area: string;
  service: string;
  rating: number;
  quote: string;
  initials: string;
};

export const testimonials: Testimonial[] = [
  {
    name: "Tasnim Akter",
    area: "Dhanmondi",
    service: "Deep Home Cleaning",
    rating: 5,
    quote: "The crew arrived on time, was respectful and the apartment looked brand new. Booking took two minutes.",
    initials: "TA",
  },
  {
    name: "Imran Hossain",
    area: "Gulshan",
    service: "AC Master Service",
    rating: 5,
    quote: "Diagnosed a gas leak the same day, fixed it next morning. Transparent pricing — no surprises.",
    initials: "IH",
  },
  {
    name: "Nadia Rahman",
    area: "Uttara",
    service: "Bridal Beauty Package",
    rating: 5,
    quote: "Glow Beauty did my full bridal look at home. Professional, hygienic, exactly the look I wanted.",
    initials: "NR",
  },
  {
    name: "Shafiq Ahmed",
    area: "Mirpur",
    service: "Electrician",
    rating: 5,
    quote: "Rashed bhai sorted three issues we'd ignored for months in one visit. Will book again.",
    initials: "SA",
  },
  {
    name: "Mehnaz Karim",
    area: "Bashundhara",
    service: "Pest Control",
    rating: 4,
    quote: "Safe products, no smell, and the cockroaches are gone. Their 6-month guarantee gave me confidence.",
    initials: "MK",
  },
  {
    name: "Rafiq Chowdhury",
    area: "Banani",
    service: "Office Shifting",
    rating: 5,
    quote: "Moved our 12-person office overnight. Nothing damaged, all set up and running by 9am.",
    initials: "RC",
  },
];
