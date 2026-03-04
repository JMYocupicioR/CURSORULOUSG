import { redirect } from "next/navigation"

// Stripe checkout is temporarily disabled. Redirect to the free registration page.
export default function CheckoutPage() {
  redirect("/register")
}
