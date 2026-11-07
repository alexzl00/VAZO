/** Public URL policy, shared by future calculator SEO and the guide. */
export const PUBLIC_PATHS = {
  home: '/',
  calculator: '/salary-calculator',
  poradnik: '/poradnik',
} as const;

export function guidePath(slug: string): string {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error(`Invalid Poradnik slug: ${slug}`);
  }
  return `${PUBLIC_PATHS.poradnik}/${slug}`;
}
