export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  author: string;
  authorRole: string;
  publishedAt: string;
  readTime: string;
  heroImage: string;
  cardImage: string;
  tags: string[];
  sections: Array<{
    heading: string;
    paragraphs: string[];
  }>;
};

export const blogPosts: BlogPost[] = [
  {
    slug: "build-a-champion-team-identity",
    title: "Build A Champion Team Identity Through Premium Uniform Design",
    excerpt:
      "Learn how elite programs use visual identity, material quality, and customization strategy to create confidence and culture before kickoff.",
    category: "Team Strategy",
    author: "Jordan Miles",
    authorRole: "Brand Performance Coach",
    publishedAt: "Apr 11, 2026",
    readTime: "8 min read",
    heroImage:
      "https://images.unsplash.com/photo-1521412644187-c49fa049e84d?q=80&w=1800&auto=format&fit=crop",
    cardImage:
      "https://images.unsplash.com/photo-1521412644187-c49fa049e84d?q=80&w=900&auto=format&fit=crop",
    tags: ["Uniforms", "Branding", "Team Culture"],
    sections: [
      {
        heading: "Why Uniform Design Is A Competitive Advantage",
        paragraphs: [
          "Teams that look unified feel unified. A thoughtful uniform system communicates discipline, standards, and identity long before the first play begins.",
          "At Athletic Force 1, we see programs gain stronger buy-in from athletes when their kit reflects the program mission, local story, and performance expectations.",
        ],
      },
      {
        heading: "Three Layers Of A Strong Uniform System",
        paragraphs: [
          "Start with visual hierarchy: numbers, logos, and contrast should remain clear under stadium lighting and in fast motion. That clarity boosts confidence and recognition.",
          "Next, optimize materials for movement and heat management. Athletes perform better in breathable, durable fabrics that keep shape through intense use.",
          "Finally, standardize accessories. Socks, arm sleeves, and warm-up layers should align with the same design language to complete the identity.",
        ],
      },
      {
        heading: "From Good Looking To Game Ready",
        paragraphs: [
          "Great uniform programs are not built only for photos. They are engineered for repetitive, high-intensity use across a full season.",
          "When design, fit, and durability work together, your team gains consistency, comfort, and confidence every single week.",
        ],
      },
    ],
  },
  {
    slug: "how-to-choose-game-day-accessories",
    title: "How To Choose Game-Day Accessories That Actually Improve Performance",
    excerpt:
      "A practical guide to selecting sleeves, socks, and compression layers that support movement, comfort, and visual consistency.",
    category: "Performance",
    author: "Riley Carter",
    authorRole: "Product Specialist",
    publishedAt: "Apr 08, 2026",
    readTime: "6 min read",
    heroImage:
      "https://images.unsplash.com/photo-1517466787929-bc90951d0974?q=80&w=1800&auto=format&fit=crop",
    cardImage:
      "https://images.unsplash.com/photo-1517466787929-bc90951d0974?q=80&w=900&auto=format&fit=crop",
    tags: ["Accessories", "Compression", "Fit"],
    sections: [
      {
        heading: "Start With Movement Patterns",
        paragraphs: [
          "Accessories should support your sport's movement profile. A receiver, a lineman, and a goalkeeper all need different levels of compression and flexibility.",
          "The right product choice is not about trends, it is about reducing distraction and maximizing freedom of movement.",
        ],
      },
      {
        heading: "Balance Protection And Comfort",
        paragraphs: [
          "Protective layers should never restrict range. Test every item in training speed before committing to full-team orders.",
          "Prioritize moisture control and seam quality. Poor seams become pain points in long sessions and repeated contact.",
        ],
      },
    ],
  },
  {
    slug: "custom-uniform-order-checklist",
    title: "The Complete Custom Uniform Order Checklist For Coaches",
    excerpt:
      "Avoid delays and reprints with a step-by-step ordering workflow used by high-performing programs.",
    category: "Operations",
    author: "Casey Nguyen",
    authorRole: "Team Account Lead",
    publishedAt: "Apr 05, 2026",
    readTime: "7 min read",
    heroImage:
      "https://images.unsplash.com/photo-1518091043644-c1d4457512c6?q=80&w=1800&auto=format&fit=crop",
    cardImage:
      "https://images.unsplash.com/photo-1518091043644-c1d4457512c6?q=80&w=900&auto=format&fit=crop",
    tags: ["Ordering", "Coaching", "Logistics"],
    sections: [
      {
        heading: "Lock Your Roster Early",
        paragraphs: [
          "The biggest source of order issues is late roster movement. Build two checkpoints: preliminary sizes and final confirmation.",
          "Use a single spreadsheet owner and keep naming conventions consistent for number assignment and print files.",
        ],
      },
      {
        heading: "Confirm Production Specs",
        paragraphs: [
          "Sign off on color codes, print placement, and logo scale with clear visual proofs. Never approve from text-only notes.",
          "A five-minute proof review prevents costly production re-runs and schedule delays.",
        ],
      },
    ],
  },
  {
    slug: "preseason-kit-planning-guide",
    title: "Preseason Kit Planning: What To Replace, Upgrade, Or Keep",
    excerpt:
      "Make smart budget decisions by auditing existing uniforms and prioritizing high-impact upgrades.",
    category: "Planning",
    author: "Morgan Lee",
    authorRole: "Program Consultant",
    publishedAt: "Apr 02, 2026",
    readTime: "5 min read",
    heroImage:
      "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?q=80&w=1800&auto=format&fit=crop",
    cardImage:
      "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?q=80&w=900&auto=format&fit=crop",
    tags: ["Preseason", "Budget", "Upgrades"],
    sections: [
      {
        heading: "Audit Condition First",
        paragraphs: [
          "Before buying new, inspect current inventory for fabric fatigue, print cracking, and fit inconsistency across positions.",
          "A condition-led approach helps you spend on performance gains rather than cosmetic replacements.",
        ],
      },
      {
        heading: "Upgrade In Priority Order",
        paragraphs: [
          "Replace high-contact and high-motion pieces first. Then refine secondary items for visual consistency.",
          "This sequence protects athlete comfort while keeping your program identity sharp.",
        ],
      },
    ],
  },
];
