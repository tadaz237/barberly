import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Barberly",
    short_name: "Barberly",
    description:
      "Marketplace de coiffeuses et coiffeurs à domicile avec réservation en ligne.",
    start_url: "/marketplace",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#09090b",
    theme_color: "#09090b",
    icons: [
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/barberly.png",
        sizes: "400x120",
        type: "image/png",
      },
    ],
  };
}
