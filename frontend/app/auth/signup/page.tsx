// frontend/app/auth/signup/page.tsx
import type { Metadata } from "next"
import SignupClient from "./signup-client"

export const metadata: Metadata = {
  title: "Sign Up",
  description: "Create a new Event Scheduler account",
  robots: {
    index: true,
    follow: true,
  },
}

export default function SignupPage() {
  return <SignupClient />
}
