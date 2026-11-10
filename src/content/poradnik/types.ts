import type { ComponentType } from 'react';

export type ArticleStatus = 'draft' | 'published';
export type CalculatorFeatureStatus = 'supported' | 'partial' | 'explanatoryOnly';
export type ArticleCategory = 'l4' | 'urlopy' | 'nadgodziny' | 'podatki' | 'ppk' | 'umowy';

export type OfficialSource = Readonly<{
  title: string;
  url: string;
  reviewedAt: string;
}>;

export type CalculatorCallToAction = Readonly<{
  /** Article-specific editorial promise; universal button and heading are localized in pl.json. */
  description: string;
  href: '/salary-calculator';
  featureStatus: CalculatorFeatureStatus;
}>;

export type ArticleDefinition = Readonly<{
  id: string;
  slug: string;
  category: ArticleCategory;
  title: string;
  seoTitle: string;
  metaDescription: string;
  excerpt: string;
  directAnswer: string;
  status: ArticleStatus;
  publishedAt?: string;
  updatedAt?: string;
  reviewedAt?: string;
  effectiveDateScope?: string;
  sources: readonly OfficialSource[];
  relatedArticleIds: readonly string[];
  cta: CalculatorCallToAction;
  content: ComponentType;
}>;
