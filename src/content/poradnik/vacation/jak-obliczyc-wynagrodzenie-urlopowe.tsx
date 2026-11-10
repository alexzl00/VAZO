import ArticleExample from '../../../sections/poradnik/ArticleExample';

export default function VacationPayContent() {
  return (
    <>
      <h2>Stałe a zmienne składniki wynagrodzenia</h2>
      <p>
        Urlop wypoczynkowy przy umowie o pracę jest płatny. Jeśli dostajesz stałą pensję
        miesięczną, uwzględnia się ją w kwocie należnej w miesiącu, w którym korzystasz z urlopu.
        Nie oznacza to wypłaty tej stałej pensji drugi raz: jest ona częścią normalnego
        wynagrodzenia za ten miesiąc. Osobno mogą wymagać obliczenia składniki zmienne,
        na przykład kwalifikujące się dodatki za pracę w godzinach nadliczbowych.
      </p>

      <h2>Trzy miesiące czy dwanaście?</h2>
      <p>
        Zmienne składniki za okresy nie dłuższe niż miesiąc uwzględnia się co do zasady
        w wysokości wypłaconej w <strong>trzech miesiącach kalendarzowych</strong> poprzedzających
        miesiąc rozpoczęcia urlopu. Jeśli występują znaczne wahania wysokości takich składników,
        okres można przedłużyć do <strong>12 miesięcy</strong>. Zmiany zasad lub wysokości
        składników mogą wymagać ponownego ustalenia podstawy.
      </p>
      <h2>Które premie liczą się do wynagrodzenia urlopowego?</h2>
      <p>Najważniejsze jest to, jak premia jest przyznawana:</p>
      <ul>
        <li><strong>Stała co miesiąc:</strong> np. 300 zł dodatku miesięcznego —
          uwzględnia się kwotę należną w miesiącu urlopu, bez liczenia średniej.</li>
        <li><strong>Zmienna co miesiąc:</strong> np. premia za wyniki sprzedaży —
          zwykle wchodzi do średniej z 3 miesięcy (czasem z 12).</li>
        <li><strong>Kwartalna lub roczna:</strong> nie dodaje się jej do miesięcznej średniej
          urlopowej; wypłaca się ją na zwykłych zasadach.</li>
        <li><strong>Jednorazowa:</strong> np. nagroda za wyjątkowe zadanie —
          nie wchodzi do podstawy urlopowej.</li>
      </ul>
      <p>
        <strong>Przykład:</strong> jeśli premia sprzedażowa wyniosła kolejno 200, 400 i 600 zł,
        do obliczenia stawki zmiennej przyjmujesz łącznie <strong>1200 zł</strong>
        i dzielisz tę kwotę przez godziny faktycznie przepracowane w tych miesiącach.
      </p>
      <p>O tym, do której grupy należy premia, decydują zasady wypłaty, a nie jej nazwa.</p>

      <h2>Jak policzyć stawkę godzinową składników zmiennych?</h2>
      <p>
        Sumę uwzględnianych składników zmiennych z wybranego okresu dzieli się przez
        <strong> liczbę godzin faktycznie przepracowanych</strong> w tym okresie. Otrzymaną stawkę
        mnoży się przez liczbę godzin, które pracownik przepracowałby podczas urlopu zgodnie
        ze swoim rozkładem czasu pracy. Nie dzieli się na przykład samych dodatków za nadgodziny
        tylko przez liczbę nadgodzin: prawidłowy dzielnik odnosi się do całego czasu faktycznie
        przepracowanego w okresie bazowym.
      </p>

      <ArticleExample title="Dwa dni urlopu i zmienne dodatki">
        <p>
          Pracownik otrzymuje 6000 zł stałego wynagrodzenia miesięcznego i dodatkowo kwalifikujące
          się do podstawy składniki zmienne. W trzech miesiącach przed urlopem otrzymał z tego
          tytułu 600 zł, 480 zł i 360 zł, przepracowując po 160 godzin w każdym miesiącu.
          Dwa dni urlopu obejmują łącznie 16 zaplanowanych godzin pracy.
        </p>
        <ol>
          <li>Suma zmiennych składników: 600 + 480 + 360 = <strong>1440,00 zł</strong>.</li>
          <li>Faktycznie przepracowane godziny: 160 + 160 + 160 = <strong>480 godzin</strong>.</li>
          <li>Stawka dla składników zmiennych: 1440 ÷ 480 = <strong>3,00 zł/godz.</strong></li>
          <li>Część urlopowa ze zmiennych składników: 3,00 × 16 = <strong>48,00 zł brutto</strong>.</li>
        </ol>
        <p>
          <strong>48,00 zł to tylko część przypisana składnikom zmiennym</strong> w tym przykładzie.
          Stałe 6000 zł są rozliczane w normalnej pensji za miesiąc urlopu; nie należy dodawać
          do niej drugiego pełnego wynagrodzenia za te same godziny. To przykład modelowy:
          rzeczywista podstawa zależy od prawidłowej kwalifikacji składników i ewidencji czasu.
        </p>
      </ArticleExample>

      <h2>Kiedy wynik może być inny?</h2>
      <ul>
        <li>Jeżeli pracownik ma zmienny rozkład czasu, trzeba uwzględnić rzeczywiste godziny zaplanowane na urlop.</li>
        <li>Przy brakach w okresie bazowym lub zmianie warunków płacy mogą obowiązywać szczególne zasady.</li>
        <li>Jednorazowe wypłaty, premie i niektóre inne świadczenia nie mogą być traktowane jednakowo.</li>
        <li>Ekwiwalent za niewykorzystany urlop to odrębne rozliczenie, nie to samo co zwykłe wynagrodzenie urlopowe.</li>
      </ul>
      <p>
        Przed obliczeniem własnej kwoty sprawdź historię składników zmiennych i ewidencję
        przepracowanych godzin. Bez tych informacji nawet poprawny wzór może dać błędny rezultat.
      </p>
    </>
  );
}
