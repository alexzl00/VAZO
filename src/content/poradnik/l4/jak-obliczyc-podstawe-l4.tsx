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
      <h2>Kiedy premia wlicza się do podstawy L4?</h2>
      <p>
        Nie każda premia automatycznie zwiększa podstawę świadczenia chorobowego. Trzeba sprawdzić
        <strong> trzy odrębne kwestie</strong>: czy premia stanowiła podstawę składki chorobowej,
        czy pracownik zachowuje do niej prawo za czas choroby oraz za jaki okres została przyznana.
        Sama nazwa „premia regulaminowa”, „uznaniowa” albo „nagroda” nie rozstrzyga wyniku.
      </p>
      <ul>
        <li><strong>Premia pomniejszana za chorobę:</strong> jeżeli podlega składce chorobowej
          i zgodnie z zasadami wynagradzania nie przysługuje w pełnej wysokości za czas pobierania
          świadczenia, co do zasady uwzględnia się ją w podstawie. Sposób pomniejszania
          (proporcjonalny albo inny) może wpływać na konieczność uzupełnienia jej kwoty.</li>
        <li><strong>Premia zachowywana podczas choroby:</strong> jeżeli pracownik ma prawo
          do składnika i otrzymuje go także za okres pobierania zasiłku, co do zasady nie wlicza
          się go do podstawy świadczenia należnego podczas zatrudnienia. Nie liczy się go
          ponownie, skoro przysługuje niezależnie od nieobecności.</li>
        <li><strong>Premia bez składki chorobowej:</strong> samo otrzymanie dodatkowych pieniędzy
          nie wystarcza. Punktem wyjścia jest przychód objęty podstawą składki chorobowej;
          nie należy automatycznie doliczać wypłat, które nią nie były objęte.</li>
      </ul>
      <p>
        Ważne jest również rozróżnienie między <strong>premią wypłaconą w miesiącu choroby
        za wcześniej wykonaną pracę</strong> a premią, która <strong>przysługuje za sam okres
        choroby</strong>. Sam termin przelewu nie przesądza o wyłączeniu składnika z podstawy.
        Pomocne są regulamin premiowania, umowa oraz rzeczywiste zasady wypłat.
      </p>
      <p>Składniki, które podlegają uwzględnieniu, rozlicza się zależnie od okresu, za który przysługują:</p>
      <ul>
        <li><strong>Miesięczne:</strong> bierze się pod uwagę premie za miesiące wchodzące
          do okresu ustalania podstawy, z uwzględnieniem zasad uzupełniania wynagrodzenia.</li>
        <li><strong>Kwartalne:</strong> do przeciętnej miesięcznej podstawy przyjmuje się
          co do zasady 1/12 sumy odpowiednich premii za cztery kwartały poprzedzające
          miesiąc zachorowania.</li>
        <li><strong>Roczne:</strong> co do zasady uwzględnia się 1/12 kwoty premii za poprzedni
          rok kalendarzowy, o ile dany składnik spełnia warunki wliczenia.</li>
      </ul>
      <p>
        <strong>Przykład:</strong> jeżeli w każdym z 12 miesięcy przysługiwała premia 400 zł,
        objęta składką chorobową i nieprzysługująca za czas choroby, to przy braku innych
        szczególnych okoliczności zwiększy ona miesięczną podstawę o
        <strong> 345,16 zł</strong> (400 zł pomniejszone o 13,71%). Jeżeli natomiast pracownik
        zachowuje prawo do tej premii za czas choroby, wynik może być inny.
      </p>
      <p>
        <strong>Po ustaniu zatrudnienia:</strong> ZUS uwzględnia także składniki, które podczas
        zatrudnienia były wyłączone dlatego, że pracownik zachowywał do nich prawo za czas
        pobierania zasiłku. Nie oznacza to jednak, że każda wcześniejsza wypłata automatycznie
        podwyższy zasiłek: nadal trzeba spełnić zasady dotyczące podstawy i okresu świadczenia.
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
