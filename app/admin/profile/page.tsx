import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, UserRound } from "lucide-react";
import {
  ADMIN_TONES,
  getAdminToneKey,
} from "@/src/components/admin/admin-theme";
import { ProfileForm } from "@/src/components/admin/profile-form";
import { auth } from "@/src/lib/auth";
import { getGender } from "@/src/lib/gender";
import { getUserById } from "@/src/lib/users-store";
import { cn } from "@/src/lib/utils";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const [user, cookieGender] = await Promise.all([
    getUserById(session.user.id),
    getGender(),
  ]);

  if (!user) {
    redirect("/login");
  }
  if (user.role === "client") {
    redirect("/client");
  }

  const toneKey = getAdminToneKey(user.gender ?? cookieGender ?? null);
  const tone = ADMIN_TONES[toneKey];

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-size-[56px_56px] opacity-60"
      />
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute -top-40 left-1/2 size-[42rem] -translate-x-1/2 rounded-full blur-[120px]",
          tone.pageBlob,
        )}
      />

      <section className="relative mx-auto w-full max-w-5xl space-y-6 px-4 py-6 sm:px-6 sm:py-10 lg:py-12">
        <header className="space-y-5">
          <Link
            href="/admin"
            className={cn(
              "inline-flex items-center gap-1.5 text-xs font-medium text-white/60 transition-colors sm:text-sm",
              tone.linkHover,
            )}
          >
            <ArrowLeft className="size-4" />
            Retour au tableau de bord
          </Link>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-3">
              <span
                className={cn(
                  "inline-flex w-fit items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em]",
                  tone.eyebrow,
                )}
              >
                <UserRound className="size-3.5" />
                Profil {tone.label}
              </span>
              <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
                Gerer mon profil
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-white/55 sm:text-base">
                Mettez a jour les informations visibles par vos clientes et
                clients. L&apos;adresse email reste verrouillee.
              </p>
            </div>
          </div>
        </header>

        <ProfileForm user={user} toneKey={toneKey} />
      </section>
    </main>
  );
}
