export const LOCAL_CATEGORY_ICONS: Record<string, string> = {
  'energia-solar': '/solar-market-ico-avalia-solar.png',
  'mobilidade-eletrica': '/ev-icon-avalia-solar.png',
};

export const getPreferredCategoryIcon = (slug?: string, iconUrl?: string | null) => {
  if (slug && LOCAL_CATEGORY_ICONS[slug]) {
    return LOCAL_CATEGORY_ICONS[slug];
  }

  if (iconUrl) {
    return iconUrl;
  }

  return null;
};
