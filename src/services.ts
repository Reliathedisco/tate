export interface Service {
  name: string
  url: string
  packageNames: string[]
  statusPage: string
}

export const SERVICES: Record<string, Service> = {
  stripe: {
    name: "Stripe",
    url: "https://status.stripe.com/api/v2/status.json",
    packageNames: ["stripe"],
    statusPage: "status.stripe.com"
  },
  supabase: {
    name: "Supabase",
    url: "https://status.supabase.com/api/v2/status.json",
    packageNames: ["@supabase/supabase-js", "@supabase/ssr"],
    statusPage: "status.supabase.com"
  },
  clerk: {
    name: "Clerk",
    url: "https://clerkstatus.com/api/v2/status.json",
    packageNames: ["@clerk/nextjs", "@clerk/clerk-sdk-node", "@clerk/backend"],
    statusPage: "clerkstatus.com"
  },
  vercel: {
    name: "Vercel",
    url: "https://www.vercel-status.com/api/v2/status.json",
    packageNames: ["vercel"],
    statusPage: "vercel-status.com"
  },
  openai: {
    name: "OpenAI",
    url: "https://status.openai.com/api/v2/status.json",
    packageNames: ["openai"],
    statusPage: "status.openai.com"
  },
  resend: {
    name: "Resend",
    url: "https://resendstatus.com/api/v2/status.json",
    packageNames: ["resend"],
    statusPage: "resendstatus.com"
  },
  github: {
    name: "GitHub",
    url: "https://www.githubstatus.com/api/v2/status.json",
    packageNames: [],
    statusPage: "githubstatus.com"
  }
}
