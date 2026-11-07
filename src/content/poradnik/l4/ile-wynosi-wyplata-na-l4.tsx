import ArticleExample from '../../../sections/poradnik/ArticleExample';
import { guidePath } from '../../../seo/routes';

export default function SickPayoutContent() {
  return (
    <>
      <h2>80% czy 100% — od czego zależy wysokość?</h2>
      <p>
        W zwykłym przypadku choroby świadczenie wynosi <strong>80% podstawy</strong>, również
        za okres pobytu w szpitalu. <strong>100%</strong> przysługuje w sytuacjach wskazanych
        w przepisach, między innymi przy niezdolności do pracy w czasie ciąży, wskutek wypadku
        w drodze do pracy lub z pracy oraz w związku z określonymi badaniami i zabiegami dawcy.
        Wypadek przy pracy i choroba zawodowa podlegają osobnym przepisom ubezpieczenia
        wypadkowego. Samo wystawienie e-ZLA nie przesądza automatycznie o prawie do świadczenia:
        znaczenie mają też warunki ubezpieczenia i dokumenty.
      </p>

      <h2>Jak policzyć należność za konkretne dni?</h2>
      <p>
        Dzienna podstawa świadczenia chorobowego wynosi <strong>1/30 podstawy miesięcznej</strong>,
        niezależnie od tego, czy miesiąc ma 28, 30 czy 31 dni. Świadczenie ustala się za
        <strong> dni kalendarzowe</strong> objęte niezdolnością do pracy, a nie wyłącznie za dni,
        w których pracownik miał pracować. Potem stosuje się właściwą stawkę procentową.
      </p>
      <ArticleExample title="Sześć dni L4 przy podstawie 5177,40 zł">
        <p>
          Przyjmijmy miesięczną podstawę wymiaru 5177,40 zł, zwolnienie obejmujące sześć dni
          kalendarzowych i zwykłą chorobę z prawem do świadczenia w wysokości 80%.
        </p>
        <ol>
          <li>Podstawa dzienna: 5177,40 ÷ 30 = <strong>172,58 zł</strong>.</li>
          <li>Stawka dzienna 80%: 172,58 × 0,80 = 138,064 zł, po zaokrągleniu <strong>138,06 zł</strong>.</li>
          <li>Należność za sześć dni: 138,06 × 6 = <strong>828,36 zł</strong>.</li>
        </ol>
        <p>
          <strong>828,36 zł to kwota świadczenia z tego przykładu, nie całkowita wypłata na rękę.</strong>
          Pracownik może mieć w tym miesiącu także pensję za przepracowaną część miesiąca,
          premie oraz potrącenia podatkowe i składkowe. Dla uprawnionej sytuacji ze stawką
          100% te same założenia dałyby 172,58 × 6 = <strong>1035,48 zł</strong>.
        </p>
      </ArticleExample>

      <h2>Wynagrodzenie chorobowe a zasiłek chorobowy</h2>
      <p>
        Przy umowie o pracę pracodawca finansuje co do zasady wynagrodzenie chorobowe za
        pierwsze <strong>33 dni</strong> niezdolności w danym roku kalendarzowym.
        Po ukończeniu 50 lat limit wynosi <strong>14 dni</strong>, przy czym krótszy limit
        stosuje się od roku następującego po roku ukończenia 50 lat. Następnie, przy spełnieniu
        warunków, przysługuje zasiłek chorobowy finansowany z FUS. Okresy choroby w danym roku
        sumuje się także wtedy, gdy pomiędzy zwolnieniami były przerwy.
      </p>
      <p>
        Nazwa „zasiłek chorobowy” nie oznacza, że pieniądze zawsze wypłaca bezpośrednio ZUS.
        Podmiot zgłaszający do ubezpieczenia chorobowego więcej niż 20 ubezpieczonych zwykle
        ustala i wypłaca zasiłki swoim ubezpieczonym podczas trwania ubezpieczenia; w pozostałych
        wskazanych przypadkach robi to ZUS. Nie należy mylić <em>źródła finansowania</em>
        ze stroną dokonującą przelewu.
      </p>

      <h2>Co jeszcze wpływa na wysokość?</h2>
      <p>
        Ważne są zasady ustalenia podstawy, składniki wynagrodzenia, wcześniejsze okresy choroby,
        rodzaj zdarzenia oraz prawo do świadczenia. Okres choroby po zakończeniu zatrudnienia
        ma osobne warunki i ograniczenia, więc nie można bez sprawdzenia zastosować powyższego
        przykładu do każdego przypadku. Także umowa zlecenie wymaga odrębnej analizy
        ubezpieczenia chorobowego.
      </p>
      <p>
        Jeśli nie znasz miesięcznej podstawy użytej w przykładzie, najpierw sprawdź
        <a href={guidePath('jak-obliczyc-podstawe-l4')}> jak ustala się podstawę L4</a>.
      </p>
    </>
  );
}
