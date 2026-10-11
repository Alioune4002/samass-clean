import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/admin-samass-98342/",
        "/api/",
        "/cart",
        "/shop",
      ],
    },
    sitemap: "https://samassbysam.com/sitemap.xml",
    host: "https://samassbysam.com",
  };
}
