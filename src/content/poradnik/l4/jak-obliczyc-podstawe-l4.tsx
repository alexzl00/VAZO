import ArticleExample from '../../../sections/poradnik/ArticleExample';
import { guidePath } from '../../../seo/routes';

/** Editorial text is authored content, not global UI translation. */
export default function SickBaseContent() {
  return (
    <>
      <h2>Co oznacza podstawa L4?</h2>
      <p>
        Podstawa wymiaru świadczenia chorobowego to kwota, od której oblicza się wynagrodzenie
        chorobowe albo zasiłek chorobowy. Nie należy jej mylić z całkowitym wynagrodzeniem brutto
        z umowy ani z kwotą przelewu na konto. Zasady opisane poniżej dotyczą przede wszystkim
        pracownika zatrudnionego na podstawie umowy o pracę.
      </p>

      <h2>Z których miesięcy oblicza się podstawę?</h2>
      <p>
        Co do zasady przyjmuje się przeciętne miesięczne wynagrodzenie z <strong>12 pełnych
        miesięcy kalendarzowych</strong> poprzedzających miesiąc powstania niezdolności do pracy.
        Jeżeli okres zatrudnienia i ubezpieczenia chorobowego jest krótszy, stosuje się przepisy
        dotyczące pełnych miesięcy ubezpieczenia, a w szczególnych przypadkach również
        uzupełniania wynagrodzenia. Nie wystarczy więc zawsze zsumować ostatnich 12 wypłat
        widocznych na rachunku bankowym.
      </p>
      <p>
        W miesiącach, w których pracownik nie przepracował pełnego okresu z przyczyn
        usprawiedliwionych, ZUS przewiduje dodatkowe zasady uwzględniania i uzupełniania
        wynagrodzenia. Znaczenie może mieć również zmiana wymiaru etatu albo okres przerwy
        między świadczeniami. Szczegóły opisuje oficjalna instrukcja ZUS wskazana w źródłach.
      </p>

      <h2>Jakie składniki wynagrodzenia się liczą?</h2>
      <p>
        Punktem wyjścia jest przychód stanowiący podstawę składki chorobowej, pomniejszony
        o finansowane przez pracownika składki emerytalną, rentową i chorobową. Przy typowym
        wynagrodzeniu pracowniczym odpowiada to potrąceniu <strong>13,71%</strong>. Do podstawy
        mogą wejść nie tylko wynagrodzenie zasadnicze, lecz także premie i inne odpowiednie
        składniki, zależnie od ich charakteru, okresu, za który przysługują, oraz zasad
        wypłacania podczas choroby.
      </p>
      <p>
        Nie każdy dodatek dolicza się automatycznie. Przykładowo, składnika, do którego
        pracownik zachowuje prawo i który otrzymuje za okres pobierania zasiłku, co do zasady
        nie uwzględnia się w podstawie świadczenia za czas trwania ubezpieczenia.
        ZUS wskazuje przy tym odrębną zasadę dotyczącą świadczeń po ustaniu zatrudnienia.
        Premie kwartalne lub roczne także nie są po prostu dodawane do jednego wybranego miesiąca:
        stosuje się dla nich właściwe reguły uwzględniania.
      </p>

      <h2>Przykład obliczenia podstawy L4</h2>
      <ArticleExample title="Stałe wynagrodzenie 6000 zł brutto">
        <p>
          Załóżmy umowę o pracę, 12 pełnych miesięcy z wynagrodzeniem 6000 zł brutto w każdym
          miesiącu, brak dodatkowych składników i nieobecności wymagających uzupełnienia.
        </p>
        <ol>
          <li>Średnie miesięczne wynagrodzenie uwzględniane w przykładzie: <strong>6000,00 zł</strong>.</li>
          <li>Składki finansowane przez pracownika: 6000,00 × 13,71% = <strong>822,60 zł</strong>.</li>
          <li>Podstawa miesięczna: 6000,00 − 822,60 = <strong>5177,40 zł</strong>.</li>
        </ol>
        <p>
          <strong>Wynik: 5177,40 zł podstawy miesięcznej</strong>, a nie wypłaty netto.
          W tym uproszczonym przypadku nie występują składniki zmienne ani sytuacje wymagające
          przeliczenia podstawy.
        </p>
      </ArticleExample>

      <h2>Najczęstsze błędy</h2>
      <ul>
        <li>Przyjmowanie kwoty netto z ostatniego miesiąca zamiast prawidłowego okresu bazowego.</li>
        <li>Uznanie, że każda premia musi wejść do podstawy lub że wszystkie premie są wyłączone.</li>
        <li>Nieuwzględnienie szczególnych zasad dotyczących niepełnych miesięcy, zmiany etatu i przerw w świadczeniach.</li>
        <li>Mylenie samej podstawy z kwotą należną za konkretne dni zwolnienia.</li>
      </ul>
      <p>
        Gdy znasz już podstawę, zobacz <a href={guidePath('ile-wynosi-wyplata-na-l4')}>
        jak obliczyć świadczenie za dni L4</a>. W umowie zleceniu zasady ustalania podstawy
        i prawo do świadczenia mogą wyglądać inaczej; przykład z tej strony nie powinien być
        wtedy przenoszony bez zmian.
      </p>
    </>
  );
}
