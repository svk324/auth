"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";

export default function LinkCallback({
  params,
}: {
  params: { provider: string };
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleLink = async () => {
      const state = searchParams.get("state");
      const code = searchParams.get("code");
      const email = searchParams.get("email"); // Note: Email might not be directly available; adjust based on provider response

      if (!state || !code) {
        toast.error("OAuth linking failed: Invalid response");
        router.push("/account");
        return;
      }

      // Simulate fetching OAuth details (in reality, this would come from the provider callback)
      const res = await fetch("/api/account/link-oauth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: params.provider,
          providerAccountId: code, // Simplified; use actual providerAccountId from OAuth response
          email: email || "unknown@example.com", // Adjust based on actual data
          accessToken: null,
          refreshToken: null,
          expiresAt: null,
        }),
      });

      if (res.ok) {
        toast.success(`${params.provider} account linked successfully!`);
        router.push("/account");
      } else {
        const data = await res.json();
        toast.error(data.error);
        router.push("/account");
      }
    };

    handleLink();
  }, [params.provider, searchParams, router]);

  return <div>Linking your {params.provider} account...</div>;
}
