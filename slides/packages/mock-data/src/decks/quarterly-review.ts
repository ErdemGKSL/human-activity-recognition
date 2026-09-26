import { defineDeck } from "@pptx/core";

/** Mock data — Acme Robotics fictional Q3 business review. Every figure is invented. */
export const quarterlyReview = defineDeck({
  id: "quarterly-review",
  title: "Acme Robotics — Q3 2026 Business Review",
  lang: "en-US",
  author: "Finance & Strategy",
  transition: { effect: "fade", duration: 0.5 },
  slides: [
    {
      id: "cover",
      layout: "cover",
      title: "Q3 2026 Business Review",
      subtitle: "Acme Robotics · Growth, margins and the road to FY27",
      presenter: "Jordan Lee, CFO",
      date: "October 2026",
      notes: "Welcome everyone. This review covers Q3 results and our FY27 outlook.",
    },
    {
      id: "agenda",
      layout: "agenda",
      title: "Agenda",
      items: [
        "Quarter at a glance",
        "Revenue by region",
        "Product line performance",
        "Customer voice",
        "Priorities for Q4",
      ],
    },
    {
      id: "highlights",
      layout: "metrics",
      title: "Quarter at a glance",
      metrics: [
        { label: "Revenue", value: "$48.2M", delta: "+18% YoY", tone: "positive" },
        { label: "Gross margin", value: "62.4%", delta: "+3.1 pts", tone: "positive" },
        { label: "Net retention", value: "118%", delta: "flat QoQ", tone: "neutral" },
        { label: "Churn", value: "2.1%", delta: "-0.4 pts", tone: "positive" },
      ],
      notes: "Churn trending down is good news — call that out explicitly.",
      // Presenter-paced: one click per card, then Revenue pulses once. Every row
      // has an explicit `order` so the pulse waits for the last card.
      animations: {
        "metric-0": [
          { effect: "entrance_rise_up", duration: 0.5, trigger: "on-click", order: 1 },
          {
            effect: "emphasis_grow_shrink",
            options: { size: 110 },
            duration: 0.4,
            autoReverse: true,
            delay: 0.3,
            order: 2,
          },
        ],
        ...Object.fromEntries(
          [1, 2, 3].map((i) => [
            `metric-${i}`,
            { effect: "entrance_rise_up", duration: 0.5, trigger: "on-click", order: 1 },
          ]),
        ),
      },
    },
    {
      id: "revenue-by-region",
      layout: "bar-chart",
      title: "Revenue by region",
      caption: "Q3 2026, USD millions",
      unit: "$M",
      data: [
        { label: "North America", value: 21.4 },
        { label: "Europe", value: 13.9 },
        { label: "APAC", value: 8.6 },
        { label: "LATAM", value: 3.1 },
        { label: "MEA", value: 1.2 },
      ],
    },
    {
      id: "section-products",
      layout: "section",
      transition: { effect: "push", options: { direction: "up" }, duration: 0.6 },
      eyebrow: "Part 2",
      title: "Product line performance",
      description: "Warehouse automation keeps compounding; field robotics is still early.",
    },
    {
      id: "product-table",
      layout: "table",
      title: "Product lines",
      columns: ["Product", "Revenue", "YoY", "Margin"],
      rows: [
        ["Atlas Picker", "$19.8M", "+24%", "66%"],
        ["Sorter X2", "$12.1M", "+15%", "61%"],
        ["FieldBot", "$6.7M", "+41%", "48%"],
        ["Fleet Cloud", "$9.6M", "+9%", "81%"],
      ],
    },
    {
      id: "customer-quote",
      layout: "quote",
      quote:
        "Atlas cut our pick times in half within the first month. It's the easiest rollout we've done.",
      author: "Priya Raman",
      role: "VP Operations, Northwind Logistics",
    },
    {
      id: "closing",
      layout: "closing",
      title: "Thank you",
      subtitle: "Questions & discussion",
      contact: "finance@acme-robotics.example",
      // Override the layout's default: zoom in, then a small wiggle.
      animations: {
        contact: [
          { effect: "entrance_zoom", duration: 0.5 },
          { effect: "emphasis_teeter", duration: 0.6, delay: 0.3 },
        ],
      },
    },
  ],
});
