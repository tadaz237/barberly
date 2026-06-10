import Link from "next/link";
import { FileText, Users } from "lucide-react";

type PlatformUserTabsProps = {
  active: "accounts" | "publications";
};

const tabs = [
  {
    key: "accounts",
    href: "/platform/users",
    label: "Comptes",
    Icon: Users,
  },
  {
    key: "publications",
    href: "/platform/publications",
    label: "Publications",
    Icon: FileText,
  },
] as const;

export function PlatformUserTabs({ active }: PlatformUserTabsProps) {
  return (
    <nav
      aria-label="Sous-onglets utilisateurs"
      className="flex w-fit flex-wrap gap-1 rounded-2xl border border-white/10 bg-white/5 p-1 text-xs backdrop-blur"
    >
      {tabs.map(({ key, href, label, Icon }) => {
        const selected = active === key;
        return (
          <Link
            key={key}
            href={href}
            aria-current={selected ? "page" : undefined}
            className={`inline-flex h-9 items-center gap-2 rounded-xl px-3 font-semibold transition-colors ${
              selected
                ? "bg-cyan-300 text-cyan-950 shadow-lg shadow-cyan-500/15"
                : "text-white/60 hover:bg-white/8 hover:text-white"
            }`}
          >
            <Icon className="size-3.5" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
