import ArticleExample from '../../../sections/poradnik/ArticleExample';

export default function MandateNetContent() {
  return (
    <>
      <h2>Od czego zależy netto ze zlecenia?</h2>
      <p>Nie ma jednej stawki „brutto na rękę”. Liczą się m.in. <strong>wiek, status ucznia lub studenta, inne zatrudnienie, składki ZUS, dobrowolne chorobowe, koszty uzyskania przychodu i PIT</strong>.</p>
      <ArticleExample title="Przykład A: student poniżej 26 lat">
        <p>Student ma 22 lata, zwykłą umowę zlecenia na <strong>5000 zł brutto</strong> (100 godzin po 50 zł), nie pracuje na rzecz własnego pracodawcy i cały przychód mieści się w PIT-0. Nie występują inne potrącenia.</p>
        <ol>
          <li>ZUS i składka zdrowotna z tej umowy: <strong>0 zł</strong>.</li>
          <li>Zaliczka PIT: <strong>0 zł</strong>.</li>
          <li>Do wypłaty: <strong>5000 zł netto</strong>.</li>
        </ol>
      </ArticleExample>
      <ArticleExample title="Przykład B: dorosły zleceniobiorca bez innych tytułów">
        <p>Zlecenie na <strong>5000 zł brutto</strong> (100 godzin po 50 zł); osoba nie jest studentem, podlega obowiązkowym składkom emerytalnej i rentowej, nie przystąpiła do chorobowego ani PPK. Przyjmujemy standardowe koszty 20%, brak PIT-2 i innych dochodów.</p>
        <ol>
          <li>Składki społeczne pracownika: 5000 × (9,76% + 1,5%) = <strong>563,00 zł</strong>.</li>
          <li>Składka zdrowotna: (5000 − 563) × 9% = <strong>399,33 zł</strong>.</li>
          <li>Koszty uzyskania: (5000 − 563) × 20% = <strong>887,40 zł</strong>.</li>
          <li>Podstawa PIT po zaokrągleniu: 3550 zł; zaliczka 12% = <strong>426 zł</strong>.</li>
          <li>Wypłata: 5000 − 563 − 399,33 − 426 = <strong>3611,67 zł netto</strong>.</li>
        </ol>
      </ArticleExample>
      <h2>Kiedy wynik będzie inny?</h2>
      <p>Zlecenie z własnym pracodawcą lub wykonywane na jego rzecz może podlegać innym zasadom. Inny tytuł do ubezpieczeń także zmienia składki. Dobrowolne ubezpieczenie chorobowe oznacza dodatkową składkę i osobne warunki prawa do zasiłku.</p>
    </>
  );
}
