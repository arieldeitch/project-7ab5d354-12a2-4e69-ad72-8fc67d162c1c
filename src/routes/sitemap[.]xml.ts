import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const xml = [
          '<?xml version="1.0" encoding="UTF-8"?>',
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
          "  <url><loc>/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>",
          "  <url><loc>/select-player</loc></url>",
          "  <url><loc>/home</loc></url>",
          "  <url><loc>/predictions</loc></url>",
          "  <url><loc>/tournament</loc></url>",
          "  <url><loc>/leaderboard</loc></url>",
          "  <url><loc>/profile</loc></url>",
          "  <url><loc>/bracket</loc></url>",
          "</urlset>",
        ].join("\n");
        return new Response(xml, {
          headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" },
        });
      },
    },
  },
});