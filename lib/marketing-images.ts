/** Fresh marketing photography — separate from legacy /images/healthcare stock set */
export const marketingImages = {
  homeHeroCnaLaughing: {
    src: "/images/marketing/home-hero-cna-laughing.jpg",
    alt: "CNA and patient sharing a warm laugh together at home",
    credit: "Photo via Unsplash",
  },
} as const;

export type MarketingImageKey = keyof typeof marketingImages;
