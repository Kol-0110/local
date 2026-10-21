"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function KdsPage() {
  const router = useRouter();

  useEffect(() => {
    // Kitchen mode is omitted as per restaurant requirements.
    // Redirecting directly to the Waiter Sales App.
    router.replace("/waiter");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center p-6 text-center text-slate-500">
      <p>Redirecting to Waiter Mode...</p>
    </div>
  );
}
