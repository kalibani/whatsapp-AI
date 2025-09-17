import { SignedIn, SignedOut } from "@clerk/nextjs";
import { LandingPage } from "@/components/landing-page";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

export default async function HomePage() {
  const { userId } = await auth();

  if (userId) {
    redirect("/dashboard");
  }

  return (
    <>
      <SignedOut>
        <LandingPage />
      </SignedOut>
      <SignedIn>
        {/* This shouldn't render due to redirect above */}
        <div>Loading...</div>
      </SignedIn>
    </>
  );
}
