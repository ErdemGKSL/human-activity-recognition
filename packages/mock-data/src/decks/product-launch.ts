import { defineDeck } from "@pptx/core";

/** Mock data — fictional product launch pitch with a dark theme override. */
export const productLaunch = defineDeck({
  id: "product-launch",
  title: "Nimbus Notes — Launch Plan",
  lang: "en-US",
  author: "Product Marketing",
  transition: { effect: "cover", options: { direction: "left" }, duration: 0.6 },
  theme: {
    name: "midnight",
    colors: {
      background: "#0B1020",
      surface: "#141B2D",
      surfaceMuted: "#1F2940",
      text: "#F1F5F9",
      textMuted: "#94A3B8",
      primary: "#8B5CF6",
      accent: "#22D3EE",
      border: "#334155",
    },
  },
  slides: [
    {
      id: "cover",
      layout: "cover",
      title: "Nimbus Notes",
      subtitle: "Notes that organize themselves",
      presenter: "Sam Ortiz, Product Lead",
      date: "Launch · November 2026",
      // The cover appears as a whole.
      animate: false,
    },
    {
      id: "beta-results",
      layout: "metrics",
      title: "Private beta results",
      metrics: [
        { label: "Beta users", value: "12,400", delta: "+3.2k in Sept", tone: "positive" },
        { label: "Weekly active", value: "71%", delta: "+6 pts", tone: "positive" },
        { label: "NPS", value: "58", delta: "+4", tone: "positive" },
      ],
    },
    {
      id: "channel-mix",
      layout: "bar-chart",
      title: "Signup sources",
      caption: "Share of beta signups, %",
      unit: "%",
      // Present bar by bar: each bar waits for a click.
      animations: {
        "bar-0": { effect: "entrance_wipe", options: { direction: "right" }, trigger: "on-click" },
        "bar-1": { effect: "entrance_wipe", options: { direction: "right" }, trigger: "on-click" },
        "bar-2": { effect: "entrance_wipe", options: { direction: "right" }, trigger: "on-click" },
        "bar-3": { effect: "entrance_wipe", options: { direction: "right" }, trigger: "on-click" },
        "bar-4": "none",
      },
      data: [
        { label: "Referral", value: 38 },
        { label: "Organic search", value: 27 },
        { label: "Social", value: 19 },
        { label: "Paid", value: 11 },
        { label: "Other", value: 5 },
      ],
    },
    {
      id: "closing",
      layout: "closing",
      title: "Let's ship it",
      subtitle: "Go / no-go on Friday",
      contact: "launch@nimbus.example",
    },
  ],
});
