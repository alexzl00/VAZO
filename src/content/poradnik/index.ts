import type { ArticleCategory, ArticleDefinition } from './types';
import type { PoradnikReleaseMode } from '../../seo/siteConfig';
import { PUBLIC_PATHS } from '../../seo/routes';
import SickBaseContent from './l4/jak-obliczyc-podstawe-l4';
import SickPayoutContent from './l4/ile-wynosi-wyplata-na-l4';
import VacationPayContent from './vacation/jak-obliczyc-wynagrodzenie-urlopowe';

export const ARTICLE_CATEGORIES: readonly Readonly<{ id: ArticleCategory; labelId: string }>[] = [
  { id: 'l4', labelId: 'poradnik-category-l4' },
  { id: 'urlopy', labelId: 'poradnik-category-urlopy' },
  { id: 'nadgodziny', labelId: 'poradnik-category-nadgodziny' },
  { id: 'podatki', labelId: 'poradnik-category-podatki' },
  { id: 'ppk', labelId: 'poradnik-category-ppk' },
  { id: 'umowy', labelId: 'poradnik-category-umowy' },
];

/** Only these approved pilot IDs may be rendered while content is under review. */
export const PILOT_ARTICLE_IDS = [
  'jak-obliczyc-podstawe-l4',
  'ile-wynosi-wyplata-na-l4',
  'jak-obliczyc-wynagrodzenie-urlopowe',
] as const;

export const ARTICLES: readonly ArticleDefinition[] = [
  {
    id: 'jak-obliczyc-podstawe-l4',
    slug: 'jak-obliczyc-podstawe-l4',
    category: 'l4',
    title: 'Jak obliczyć podstawę L4?',
    seoTitle: 'Jak obliczyć podstawę L4? Zasady i przykład — VAZO',
    metaDescription: 'Sprawdź, z których miesięcy i składników wynagrodzenia oblicza się podstawę L4 na umowie o pracę. Poznaj odliczenie 13,71% i przykład.',
    excerpt: '12 miesięcy, premie, pomniejszenie o składki i przykład obliczenia miesięcznej podstawy.',
    directAnswer: 'Podstawę L4 pracownika ustala się co do zasady z przeciętnego miesięcznego wynagrodzenia za 12 miesięcy kalendarzowych poprzedzających miesiąc choroby. Uwzględnia się odpowiednie składniki przychodu po odliczeniu składek społecznych finansowanych przez pracownika. To nie jest ani pensja netto, ani automatycznie 80% kwoty brutto.',
    status: 'draft',
    reviewedAt: '2026-11-07',
    effectiveDateScope: 'zasady ogólne na listopad 2026 r.; umowa o pracę',
    sources: [
      { title: 'ZUS — Podstawa wymiaru zasiłku chorobowego dla pracowników', url: 'https://www.zus.pl/swiadczenia/zasilki/zasilek-chorobowy/podstawa-wymiaru/dla-pracownikow', reviewedAt: '2026-11-07' },
    ],
    relatedArticleIds: ['ile-wynosi-wyplata-na-l4'],
    cta: {
      description: 'Wprowadź rodzaj umowy, składniki wynagrodzenia i dni L4, aby sprawdzić wyliczenie w kalkulatorze VAZO. Wynik zależy od kompletnych danych.',
      href: PUBLIC_PATHS.calculator,
      featureStatus: 'partial',
    },
    content: SickBaseContent,
  },
  {
    id: 'ile-wynosi-wyplata-na-l4',
    slug: 'ile-wynosi-wyplata-na-l4',
    category: 'l4',
    title: 'Ile wynosi wypłata na L4?',
    seoTitle: 'Ile wynosi wypłata na L4? 80%, 100% i przykład — VAZO',
    metaDescription: 'Dowiedz się, ile wynosi wypłata za dni L4, kiedy obowiązuje 80% lub 100%, jak liczyć stawkę dzienną i czym różni się wynagrodzenie chorobowe od zasiłku.',
    excerpt: 'Stawka 80% lub 100%, dni kalendarzowe, płatnik i przykład sześciu dni zwolnienia.',
    directAnswer: 'W typowym przypadku świadczenie za L4 wynosi 80% odpowiedniej podstawy, a w określonych sytuacjach 100%. Kwotę za jeden dzień ustala się, dzieląc miesięczną podstawę przez 30 i stosując właściwy procent. To kwota świadczenia przed rozliczeniem całej listy płac, nie gwarantowana wypłata netto.',
    status: 'draft',
    reviewedAt: '2026-11-07',
    effectiveDateScope: 'zasady ogólne na listopad 2026 r.; umowa o pracę',
    sources: [
      { title: 'ZUS — Wysokość zasiłku chorobowego', url: 'https://psz.zus.pl/web/guest/swiadczenia/zasilki/zasilek-chorobowy/z-ubezpieczenia-chorobowego/wysokosc', reviewedAt: '2026-11-07' },
      { title: 'ZUS — Prawo do zasiłku i okres przysługiwania', url: 'https://bip.zus.pl/pl/web/guest/swiadczenia/zasilki/zasilek-chorobowy/z-ubezpieczenia-chorobowego/prawo-do-zasilku-i-okres-przyslugiwania', reviewedAt: '2026-11-07' },
      { title: 'ZUS — Kto wypłaca zasiłek chorobowy', url: 'https://psz.zus.pl/web/guest/swiadczenia/zasilki/zasilek-chorobowy/postepowanie-w-sprawie-zasilkow/platnicy-zasilku', reviewedAt: '2026-11-07' },
      { title: 'ZUS — Podstawa wymiaru dla pracowników', url: 'https://www.zus.pl/swiadczenia/zasilki/zasilek-chorobowy/podstawa-wymiaru/dla-pracownikow', reviewedAt: '2026-11-07' },
    ],
    relatedArticleIds: ['jak-obliczyc-podstawe-l4'],
    cta: {
      description: 'Podaj wynagrodzenie i właściwy okres niezdolności do pracy, aby oszacować składniki wypłaty z uwzględnieniem L4.',
      href: PUBLIC_PATHS.calculator,
      featureStatus: 'partial',
    },
    content: SickPayoutContent,
  },
  {
    id: 'jak-obliczyc-wynagrodzenie-urlopowe',
    slug: 'jak-obliczyc-wynagrodzenie-urlopowe',
    category: 'urlopy',
    title: 'Jak obliczyć wynagrodzenie urlopowe?',
    seoTitle: 'Jak obliczyć wynagrodzenie urlopowe? Przykład — VAZO',
    metaDescription: 'Dowiedz się, jak liczyć wynagrodzenie za urlop wypoczynkowy: składniki stałe i zmienne, 3 lub 12 miesięcy, faktyczne godziny pracy i przykład.',
    excerpt: 'Stała pensja, zmienne dodatki, średnia godzinowa i przykład dwóch dni urlopu.',
    directAnswer: 'Za urlop wypoczynkowy pracownik otrzymuje wynagrodzenie takie, jakie otrzymałby, gdyby pracował. Stałe składniki miesięczne uwzględnia się w kwocie należnej w miesiącu urlopu, a odpowiednie składniki zmienne rozlicza się zwykle na podstawie trzech poprzednich miesięcy i faktycznie przepracowanych godzin.',
    status: 'draft',
    reviewedAt: '2026-11-07',
    effectiveDateScope: 'zasady ogólne na listopad 2026 r.; urlop wypoczynkowy przy umowie o pracę',
    sources: [
      { title: 'PIP — Urlop wypoczynkowy i wynagrodzenie za czas urlopu', url: 'https://www.pip.gov.pl/dla-pracodawcow/porady-prawne/urlopy-pracownicze', reviewedAt: '2026-11-07' },
      { title: 'PIP — Przez jakie godziny dzielić zmienne składniki wynagrodzenia urlopowego?', url: 'https://www.pip.gov.pl/dla-pracodawcow/pytania-i-odpowiedzi/jak-prawidlowo-ustalic-stawke-wynagrodzenia-urlopowego-ze-zmiennych-skladnikow-wynagrodzenia-przyslugujacych-za-okresy-nie-dluzsze-niz-miesiac-przez-jakie-godziny-nalezy-podzielic-te-skladniki', reviewedAt: '2026-11-07' },
    ],
    relatedArticleIds: [],
    cta: {
      description: 'W kalkulatorze VAZO możesz uwzględnić okres urlopu i składniki wynagrodzenia. Sprawdź, czy masz pełną historię potrzebną do ustalenia podstawy.',
      href: PUBLIC_PATHS.calculator,
      featureStatus: 'partial',
    },
    content: VacationPayContent,
  },
];

export function findArticleBySlug(slug: string): ArticleDefinition | undefined {
  return ARTICLES.find((article) => article.slug === slug);
}

export function findArticleById(id: string): ArticleDefinition | undefined {
  return ARTICLES.find((article) => article.id === id);
}

/** Exactly the same visibility decision applies to index, files and crosslinks. */
export function visibleArticles(mode: PoradnikReleaseMode): readonly ArticleDefinition[] {
  if (mode === 'off') return [];
  if (mode === 'public') return ARTICLES.filter((article) => article.status === 'published');
  return ARTICLES.filter((article) => PILOT_ARTICLE_IDS.some((id) => id === article.id));
}

export function validateRegistry(): void {
  const ids = new Set<string>();
  const slugs = new Set<string>();
  for (const article of ARTICLES) {
    if (!article.id || ids.has(article.id)) throw new Error(`Duplicate/missing article id: ${article.id}`);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(article.slug) || slugs.has(article.slug)) {
      throw new Error(`Invalid/duplicate article slug: ${article.slug}`);
    }
    ids.add(article.id);
    slugs.add(article.slug);
    for (const field of [article.title, article.seoTitle, article.metaDescription, article.excerpt, article.directAnswer]) {
      if (!field.trim()) throw new Error(`Required article field is blank: ${article.id}`);
    }
    if (article.cta.href !== PUBLIC_PATHS.calculator) throw new Error(`Unsupported calculator CTA: ${article.id}`);
    if (article.status === 'published' && article.cta.featureStatus === 'explanatoryOnly') {
      throw new Error(`Published guide CTA must refer to supported functionality: ${article.id}`);
    }
    if (article.status === 'published') {
      if (!article.publishedAt || !article.reviewedAt || !article.effectiveDateScope || !article.sources.length) {
        throw new Error(`Published article is missing dates, scope or official sources: ${article.id}`);
      }
      for (const date of [article.publishedAt, article.reviewedAt, article.updatedAt]) {
        if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error(`Invalid date: ${article.id}`);
      }
      for (const source of article.sources) {
        if (!source.title.trim() || !source.reviewedAt || !/^https:\/\//.test(source.url)) {
          throw new Error(`Invalid official source for: ${article.id}`);
        }
      }
    }
  }
  for (const pilot of PILOT_ARTICLE_IDS) {
    if (!ids.has(pilot)) throw new Error(`Missing pilot article: ${pilot}`);
  }
  for (const article of ARTICLES) {
    for (const relatedId of article.relatedArticleIds) {
      if (relatedId === article.id || !ids.has(relatedId)) throw new Error(`Invalid related article ${relatedId}: ${article.id}`);
      if (article.status === 'published' && findArticleById(relatedId)?.status !== 'published') {
        throw new Error(`Published article links to a draft: ${relatedId}`);
      }
    }
  }
}
