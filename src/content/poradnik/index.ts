import type { ArticleCategory, ArticleDefinition } from './types';
import type { PoradnikReleaseMode } from '../../seo/siteConfig';
import { PUBLIC_PATHS } from '../../seo/routes';
import SickBaseContent from './l4/jak-obliczyc-podstawe-l4';
import SickPayoutContent from './l4/ile-wynosi-wyplata-na-l4';
import VacationPayContent from './vacation/jak-obliczyc-wynagrodzenie-urlopowe';
import OvertimeContent from './overtime/jak-obliczyc-nadgodziny';
import YoungReliefContent from './taxes/ulga-dla-mlodych';
import PpkNetContent from './ppk/ppk-a-wynagrodzenie-netto';
import MandateNetContent from './contracts/umowa-zlecenie-netto';
import Pit2Content from './taxes/co-to-jest-pit-2';
import BonusNetContent from './contracts/premia-brutto-netto';
import SickPayVsBenefitContent from './l4/wynagrodzenie-chorobowe-a-zasilek';

export const ARTICLE_CATEGORIES: readonly Readonly<{ id: ArticleCategory; labelId: string }>[] = [
  { id: 'l4', labelId: 'poradnik-category-l4' },
  { id: 'urlopy', labelId: 'poradnik-category-urlopy' },
  { id: 'nadgodziny', labelId: 'poradnik-category-nadgodziny' },
  { id: 'podatki', labelId: 'poradnik-category-podatki' },
  { id: 'ppk', labelId: 'poradnik-category-ppk' },
  { id: 'umowy', labelId: 'poradnik-category-umowy' },
];

/** Public launch gate: first three pilot guides must be explicitly approved as published. */
export const PILOT_ARTICLE_IDS = [
  'jak-obliczyc-podstawe-l4',
  'ile-wynosi-wyplata-na-l4',
  'jak-obliczyc-wynagrodzenie-urlopowe',
] as const;

/** Explicitly reviewed draft selection. Future drafts are NOT previewed automatically. */
export const PREVIEW_ARTICLE_IDS = [
  ...PILOT_ARTICLE_IDS,
  'jak-obliczyc-nadgodziny',
  'ulga-dla-mlodych',
  'ppk-a-wynagrodzenie-netto',
  'umowa-zlecenie-netto',
  'co-to-jest-pit-2',
  'premia-brutto-netto',
  'wynagrodzenie-chorobowe-a-zasilek',
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
    reviewedAt: '2026-11-10',
    effectiveDateScope: 'zasady ogólne na listopad 2026 r.; umowa o pracę',
    sources: [
      { title: 'ZUS — Podstawa wymiaru zasiłku chorobowego dla pracowników', url: 'https://www.zus.pl/swiadczenia/zasilki/zasilek-chorobowy/podstawa-wymiaru/dla-pracownikow', reviewedAt: '2026-11-10' },
    ],
    relatedArticleIds: ['ile-wynosi-wyplata-na-l4'],
    cta: {
      description: 'Do ustalenia podstawy L4 potrzebne są właściwe miesiące i składniki wynagrodzenia. Nie każda wypłata wchodzi do podstawy na tych samych zasadach.',
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
      description: 'Wysokość świadczenia zależy od podstawy wymiaru, liczby dni kalendarzowych zwolnienia i właściwej stawki procentowej.',
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
    reviewedAt: '2026-11-10',
    effectiveDateScope: 'zasady ogólne na listopad 2026 r.; urlop wypoczynkowy przy umowie o pracę',
    sources: [
      { title: 'PIP — Urlop wypoczynkowy i wynagrodzenie za czas urlopu', url: 'https://www.pip.gov.pl/dla-pracodawcow/porady-prawne/urlopy-pracownicze', reviewedAt: '2026-11-07' },
      { title: 'PIP — Przez jakie godziny dzielić zmienne składniki wynagrodzenia urlopowego?', url: 'https://www.pip.gov.pl/dla-pracodawcow/pytania-i-odpowiedzi/jak-prawidlowo-ustalic-stawke-wynagrodzenia-urlopowego-ze-zmiennych-skladnikow-wynagrodzenia-przyslugujacych-za-okresy-nie-dluzsze-niz-miesiac-przez-jakie-godziny-nalezy-podzielic-te-skladniki', reviewedAt: '2026-11-07' },
      { title: 'PIP — Nie wystarczy nazwa: premia', url: 'https://www.pip.gov.pl/aktualnosci/nie-wystarczy-nazwa-premia', reviewedAt: '2026-11-10' },
      { title: 'Dziennik Ustaw — zasady wynagrodzenia urlopowego (§ 6–12)', url: 'https://eli.gov.pl/eli/DU/1997/14/ogl/pol', reviewedAt: '2026-11-10' },
    ],
    relatedArticleIds: [],
    cta: {
      description: 'Wynagrodzenie urlopowe ustala się z uwzględnieniem składników stałych, odpowiednich składników zmiennych i godzin przyjętych do obliczeń.',
      href: PUBLIC_PATHS.calculator,
      featureStatus: 'partial',
    },
    content: VacationPayContent,
  },
  {
    id: 'jak-obliczyc-nadgodziny',
    slug: 'jak-obliczyc-nadgodziny',
    category: 'nadgodziny',
    title: 'Jak obliczyć wynagrodzenie za nadgodziny?',
    seoTitle: 'Jak obliczyć nadgodziny? Dodatek 50% i 100% — VAZO',
    metaDescription: 'Jak policzyć nadgodziny na umowie o pracę? Sprawdź dodatek 50% i 100%, czas wolny i przykład ze stawką godzinową.',
    excerpt: 'Dodatek 50% i 100%, płaca za godzinę oraz zasady czasu wolnego.',
    directAnswer: 'Za nadgodziny na umowie o pracę przysługuje zazwyczaj normalna płaca za dodatkowe godziny i dodatek 50% albo 100%. Niektóre nadgodziny można rozliczyć czasem wolnym zamiast dodatku. Stawka zależy od grafiku i rodzaju przekroczenia.',
    status: 'draft',
    reviewedAt: '2026-11-17',
    effectiveDateScope: 'zasady ogólne na listopad 2026 r.; pełny etat UoP, typowy grafik pon.–pt.',
    sources: [
      { title: 'MRPiPS — Praca nadliczbowa', url: 'https://www.gov.pl/web/rodzina/praca-nadliczbowa', reviewedAt: '2026-11-17' },
      { title: 'MRPiPS — Rozliczanie czasu pracy', url: 'https://www.gov.pl/web/rodzina/rozliczanie-czasu-pracy', reviewedAt: '2026-11-17' },
    ],
    relatedArticleIds: ['premia-brutto-netto'],
    cta: {
      description: 'Rozliczenie nadgodzin zależy od normalnego wynagrodzenia, rodzaju dodatku oraz tego, czy zamiast dodatku udzielono czasu wolnego.',
      href: PUBLIC_PATHS.calculator, featureStatus: 'partial',
    },
    content: OvertimeContent,
  },
  {
    id: 'ulga-dla-mlodych',
    slug: 'ulga-dla-mlodych',
    category: 'podatki',
    title: 'Ulga dla młodych — jak działa PIT-0 do 26 lat?',
    seoTitle: 'Ulga dla młodych PIT-0 do 26 lat — limit i przykład | VAZO',
    metaDescription: 'Poznaj ulgę dla młodych w 2026 roku: limit 85 528 zł, umowy objęte PIT-0, składki ZUS i prosty przykład.',
    excerpt: 'PIT-0 do 26 lat, roczny limit 85 528 zł i różnica między PIT a ZUS.',
    directAnswer: 'Ulga dla młodych zwalnia z PIT określone przychody uzyskane przed 26. urodzinami, do 85 528 zł rocznie. Nie znosi automatycznie składek ZUS i nie obejmuje każdego rodzaju umowy.',
    status: 'draft',
    reviewedAt: '2026-11-17',
    effectiveDateScope: 'PIT 2026; kwalifikujące się przychody uzyskane przed 26. urodzinami',
    sources: [
      { title: 'Ministerstwo Finansów — Ulga dla młodych', url: 'https://podatki.gov.pl/ulgi-i-odliczenia/ulga-dla-mlodych-pit', reviewedAt: '2026-11-17' },
      { title: 'ZUS — Studenci na umowie zleceniu', url: 'https://www.zus.pl/-/studencki-portfel-w-wakacje.-kiedy-praca-sezonowa-zasili-twoje-konto-w-zus-a-kiedy-do-twojego-portfela-trafi-%E2%80%9Eca%C5%82a-pensja-', reviewedAt: '2026-11-17' },
    ],
    relatedArticleIds: ['umowa-zlecenie-netto', 'co-to-jest-pit-2'],
    cta: {
      description: 'Ulga dla młodych obejmuje określone rodzaje przychodów do ustawowego limitu rocznego. Sam wiek nie wystarcza do zwolnienia każdej wypłaty.',
      href: PUBLIC_PATHS.calculator, featureStatus: 'supported',
    },
    content: YoungReliefContent,
  },
  {
    id: 'ppk-a-wynagrodzenie-netto',
    slug: 'ppk-a-wynagrodzenie-netto',
    category: 'ppk',
    title: 'PPK a wynagrodzenie netto — ile zostaje na rękę?',
    seoTitle: 'PPK a wypłata netto — 2%, 1,5% i przykład | VAZO',
    metaDescription: 'Zobacz, ile potrąca się z wypłaty na PPK, ile dopłaca pracodawca i jak wpływa na podatek. Przykład dla 6000 zł.',
    excerpt: 'Wpłata pracownika 2%, wpłata pracodawcy 1,5% i wpływ na wypłatę.',
    directAnswer: 'PPK zwykle zmniejsza wypłatę o wpłatę finansowaną przez pracownika (podstawowo 2%). Pracodawca dopłaca od siebie 1,5%, a jego wpłata może dodatkowo wpłynąć na zaliczkę PIT. Nie należy odejmować obu wpłat od pensji netto.',
    status: 'draft',
    reviewedAt: '2026-11-17',
    effectiveDateScope: 'zasady PPK na listopad 2026 r.; przykładowa miesięczna podstawa 6000 zł',
    sources: [
      { title: 'Oficjalny portal PPK — Informacje dla pracownika', url: 'https://www.mojeppk.pl/dla-pracownika/artykul.html', reviewedAt: '2026-11-17' },
      { title: 'Oficjalny portal PPK — Podatek od wpłaty pracodawcy', url: 'https://www.mojeppk.pl/faq/pracownik/podatki-i-skladki-zus_jaki-podatek-zaplaci-pracownik-od-wplaty-pracodawcy.html', reviewedAt: '2026-11-17' },
    ],
    relatedArticleIds: ['co-to-jest-pit-2'],
    cta: {
      description: 'Wpłaty pracownika i pracodawcy do PPK są rozliczane odrębnie; wpływ na wypłatę netto zależy również od zasad opodatkowania.',
      href: PUBLIC_PATHS.calculator, featureStatus: 'supported',
    },
    content: PpkNetContent,
  },
  {
    id: 'umowa-zlecenie-netto',
    slug: 'umowa-zlecenie-netto',
    category: 'umowy',
    title: 'Umowa zlecenia — jak obliczyć wynagrodzenie netto?',
    seoTitle: 'Umowa zlecenie brutto netto — przykład dla studenta i dorosłego | VAZO',
    metaDescription: 'Sprawdź, jak liczyć netto na umowie zleceniu: status studenta, składki ZUS, zdrowotna, PIT i dwa przykłady z 5000 zł.',
    excerpt: 'Dlaczego 5000 zł ze zlecenia może dać inne netto studentowi i dorosłemu?',
    directAnswer: 'Netto z umowy zlecenia zależy między innymi od wieku, statusu studenta, innych tytułów do ubezpieczeń, składek i podatku. Student przed 26. urodzinami może otrzymać całe brutto, ale osoba objęta składkami zwykle dostaje mniej.',
    status: 'draft',
    reviewedAt: '2026-11-17',
    effectiveDateScope: 'przykładowe zasady 2026; typowe zlecenie, bez szczególnych zbiegów tytułów',
    sources: [
      { title: 'ZUS — Umowy cywilnoprawne w ubezpieczeniach społecznych', url: 'https://www.zus.pl/-/umowy-cywilnoprawne-w-ubezpieczeniach-spolecznych', reviewedAt: '2026-11-17' },
      { title: 'Ministerstwo Finansów — Dochody z umowy zlecenia lub o dzieło', url: 'https://podatki.gov.pl/podatki-osobiste/pit/informacje-podstawowe/co-jest-opodatkowane/dochody-z-umowy-zlecenia-lub-o-dzielo', reviewedAt: '2026-11-17' },
    ],
    relatedArticleIds: ['ulga-dla-mlodych', 'co-to-jest-pit-2'],
    cta: {
      description: 'Kwota netto z umowy zlecenia zależy między innymi od obowiązku ubezpieczeń, wieku, statusu studenta, kosztów uzyskania przychodu i podatku.',
      href: PUBLIC_PATHS.calculator, featureStatus: 'partial',
    },
    content: MandateNetContent,
  },
  {
    id: 'co-to-jest-pit-2',
    slug: 'co-to-jest-pit-2',
    category: 'podatki',
    title: 'PIT-2 — co to jest i jak wpływa na wypłatę?',
    seoTitle: 'PIT-2 — 300 zł, 150 zł czy 100 zł? Przykład | VAZO',
    metaDescription: 'Sprawdź, jak PIT-2 zmniejsza miesięczną zaliczkę podatkową, jak dzieli się 300 zł między płatników i kiedy nie działa.',
    excerpt: 'PIT-2 może zmniejszyć miesięczną zaliczkę PIT o 300, 150 albo 100 zł.',
    directAnswer: 'PIT-2 pozwala płatnikowi pomniejszyć miesięczną zaliczkę na PIT o zadeklarowaną część kwoty zmniejszającej podatek: 300, 150 albo 100 zł. Nie jest to dodatkowa premia i nie zwiększa rocznej ulgi podatkowej.',
    status: 'draft',
    reviewedAt: '2026-11-17',
    effectiveDateScope: 'zasady PIT-2 aktualne w 2026 r.; rozliczenie zaliczek według skali',
    sources: [
      { title: 'Ministerstwo Finansów — PIT-2 i zasady pomniejszania zaliczek', url: 'https://podatki.gov.pl/poradniki-i-informatory/pit-2-pit-2a-pit-3-zasady-skladania-oswiadczen-o-stosowaniu-pomniejszenia-zaliczki-o-kwote-zmniejszajaca-podatek-112-124-lub-136', reviewedAt: '2026-11-17' },
    ],
    relatedArticleIds: ['ulga-dla-mlodych', 'ppk-a-wynagrodzenie-netto'],
    cta: {
      description: 'Oświadczenie PIT-2 może wpływać na miesięczną zaliczkę na podatek; podział kwoty pomniejszenia zależy od liczby płatników.',
      href: PUBLIC_PATHS.calculator, featureStatus: 'supported',
    },
    content: Pit2Content,
  },
  {
    id: 'premia-brutto-netto',
    slug: 'premia-brutto-netto',
    category: 'umowy',
    title: 'Premia brutto a netto — ile zostaje na rękę?',
    seoTitle: 'Premia 500 zł brutto — ile netto? Obliczenia | VAZO',
    metaDescription: 'Ile zostaje z premii brutto po ZUS, składce zdrowotnej i PIT? Przykład premii 500 zł przy pensji 6000 zł.',
    excerpt: 'Przykład premii 500 zł: różnica między kwotą brutto i wypłatą netto.',
    directAnswer: 'Premia pieniężna na umowie o pracę zwykle zwiększa podstawę składek i podatku, dlatego dodatkowe 500 zł brutto nie oznacza 500 zł na rękę. Kwota netto zależy od całej pensji, progów podatkowych, ulg i PPK.',
    status: 'draft',
    reviewedAt: '2026-11-17',
    effectiveDateScope: 'modelowy przykład UoP 2026; KUP 250 zł, PIT-2 300 zł, bez PPK i ulg',
    sources: [
      { title: 'MRPiPS — Wynagrodzenie za pracę i inne świadczenia', url: 'https://www.gov.pl/web/rodzina/wynagrodzenie-za-prace-i-inne-swiadczenia-zwiazane-z-praca', reviewedAt: '2026-11-17' },
      { title: 'ZUS — Podleganie ubezpieczeniom społecznym', url: 'https://www.zus.pl/pracujacy/system-ubezpieczen-spolecznych-w-polsce/podleganie-ubezpieczeniom-spolecznym', reviewedAt: '2026-11-17' },
    ],
    relatedArticleIds: ['jak-obliczyc-podstawe-l4', 'jak-obliczyc-wynagrodzenie-urlopowe'],
    cta: {
      description: 'Premia brutto nie jest równa dodatkowej kwocie netto. Wynik zależy od zasad oskładkowania i opodatkowania całego wynagrodzenia.',
      href: PUBLIC_PATHS.calculator, featureStatus: 'partial',
    },
    content: BonusNetContent,
  },
  {
    id: 'wynagrodzenie-chorobowe-a-zasilek',
    slug: 'wynagrodzenie-chorobowe-a-zasilek',
    category: 'l4',
    title: 'Wynagrodzenie chorobowe a zasiłek chorobowy',
    seoTitle: 'Wynagrodzenie chorobowe a zasiłek — 33 lub 14 dni | VAZO',
    metaDescription: 'Czym różni się wynagrodzenie chorobowe od zasiłku? Kto finansuje L4, kiedy obowiązuje 33 lub 14 dni i przykład 35 dni.',
    excerpt: 'Kiedy kończy się wynagrodzenie chorobowe i zaczyna zasiłek?',
    directAnswer: 'Przez pierwsze 33 dni choroby w roku kalendarzowym pracownik zwykle otrzymuje wynagrodzenie chorobowe finansowane przez pracodawcę; dla określonych pracowników po 50. roku życia limit wynosi 14 dni. Potem, po spełnieniu warunków, przysługuje zasiłek chorobowy finansowany z FUS. Przelewu nie zawsze dokonuje ZUS.',
    status: 'draft',
    reviewedAt: '2026-11-17',
    effectiveDateScope: 'zasady 2026; typowa choroba pracownika na umowie o pracę',
    sources: [
      { title: 'ZUS — Prawo do zasiłku i okres przysługiwania', url: 'https://www.zus.pl/swiadczenia/zasilki/zasilek-chorobowy/z-ubezpieczenia-chorobowego/prawo-do-zasilku-i-okres-przyslugiwania', reviewedAt: '2026-11-17' },
      { title: 'ZUS — Płatnicy zasiłku chorobowego', url: 'https://www.zus.pl/swiadczenia/zasilki/zasilek-chorobowy/postepowanie-w-sprawie-zasilkow/platnicy-zasilku', reviewedAt: '2026-11-17' },
    ],
    relatedArticleIds: ['jak-obliczyc-podstawe-l4', 'ile-wynosi-wyplata-na-l4'],
    cta: {
      description: 'Wynagrodzenie chorobowe i zasiłek chorobowy to różne świadczenia. O rodzaju należności decydują m.in. liczba dni choroby i warunki ubezpieczenia.',
      href: PUBLIC_PATHS.calculator, featureStatus: 'partial',
    },
    content: SickPayVsBenefitContent,
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
  return ARTICLES.filter((article) => PREVIEW_ARTICLE_IDS.some((id) => id === article.id));
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
    if (!article.reviewedAt || !article.effectiveDateScope || !article.sources.length) {
      throw new Error(`Article is missing review date, legal scope or sources: ${article.id}`);
    }
    for (const date of [article.reviewedAt, article.publishedAt, article.updatedAt]) {
      if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error(`Invalid date: ${article.id}`);
    }
    for (const source of article.sources) {
      if (!source.title.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(source.reviewedAt) || !/^https:\/\//.test(source.url)) {
        throw new Error(`Invalid official source for: ${article.id}`);
      }
    }
    if (article.status === 'published' && article.cta.featureStatus === 'explanatoryOnly') {
      throw new Error(`Published guide CTA must refer to supported functionality: ${article.id}`);
    }
    if (article.status === 'published' && !article.publishedAt) {
      throw new Error(`Published article has no publication date: ${article.id}`);
    }
  }
  if (new Set(PREVIEW_ARTICLE_IDS).size !== PREVIEW_ARTICLE_IDS.length) {
    throw new Error('Duplicate preview article ID');
  }
  for (const pilot of PILOT_ARTICLE_IDS) {
    if (!ids.has(pilot)) throw new Error(`Missing pilot article: ${pilot}`);
  }
  for (const previewId of PREVIEW_ARTICLE_IDS) {
    if (!ids.has(previewId)) throw new Error(`Missing selected preview article: ${previewId}`);
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
