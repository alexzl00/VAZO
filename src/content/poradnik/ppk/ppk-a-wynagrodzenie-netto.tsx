import ArticleExample from '../../../sections/poradnik/ArticleExample';

export default function PpkNetContent() {
  return (
    <>
      <h2>Kto wpłaca pieniądze do PPK?</h2>
      <p>Przy podstawowych stawkach pracownik odkłada <strong>2%</strong> odpowiedniego wynagrodzenia, a pracodawca dopłaca od siebie <strong>1,5%</strong>. Twoja wpłata jest potrącana z wypłaty; wpłata pracodawcy nie jest drugą taką samą potrącaną kwotą.</p>
      <ArticleExample title="Przykład: 6000 zł podstawy PPK">
        <p>Zakładamy standardowe stawki PPK i podstawę wpłat 6000 zł brutto.</p>
        <ol>
          <li>Wpłata pracownika: 6000 × 2% = <strong>120 zł</strong> potrącone z wynagrodzenia.</li>
          <li>Wpłata pracodawcy: 6000 × 1,5% = <strong>90 zł</strong> przekazane dodatkowo na PPK.</li>
          <li>Na rachunek PPK trafia łącznie <strong>210 zł</strong> z tych wpłat, przed ewentualnymi dopłatami państwa.</li>
        </ol>
        <p>Wpłata pracodawcy stanowi co do zasady przychód objęty PIT. Przy stawce 12% podatek od 90 zł to około <strong>11 zł</strong> — moment jego pobrania zależy m.in. od przekazania wpłaty. Dlatego wypłata może zmaleć o <strong>120 zł i ewentualny dodatkowy PIT</strong>, a nie o całe 210 zł.</p>
      </ArticleExample>
      <h2>Czy zawsze płacisz 2%?</h2>
      <p>Nie. Przy spełnieniu warunku łącznego miesięcznego wynagrodzenia nieprzekraczającego 120% pensji minimalnej wpłatę pracownika można obniżyć nawet do <strong>0,5%</strong>. Możliwe są też wpłaty dodatkowe. Wysokość wpłaty zależy od obowiązujących zasad i złożonych deklaracji.</p>
    </>
  );
}
