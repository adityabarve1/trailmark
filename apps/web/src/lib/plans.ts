/** Plan catalogue shown on the landing page. Display only: billing (Razorpay) is not wired up yet. */
export interface Plan {
  id: "free" | "pro";
  name: string;
  tagline: string;
  monthly: number; // INR per month, 0 = free
  yearly: number;  // INR per year, billed once
  features: string[];
  cta: string;
  highlight?: boolean;
}

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    tagline: "Everything you need to follow one plan.",
    monthly: 0,
    yearly: 0,
    features: ["Build your own roadmap, up to 30 days long", "Daily tracker, streaks and heatmap", "Weekly reviews", "Bring your own AI key", "Web and mobile apps"],
    cta: "Start free",
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "For learners running several goals at once.",
    monthly: 199,
    yearly: 1999,
    features: ["Unlimited roadmaps of any length, up to 2 years", "Practice log with 7 and 30 day revision reminders", "Export and backup of all your data", "Priority support", "Early access to new features"],
    cta: "Get Pro",
    highlight: true,
  },
];

export const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
