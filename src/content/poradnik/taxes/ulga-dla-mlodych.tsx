import ArticleExample from '../../../sections/poradnik/ArticleExample';

export default function YoungReliefContent() {
  return (
    <>
      <h2>Kto korzysta z ulgi?</h2>
      <p>PIT-0 dla młodych dotyczy uprawnionych przychodów otrzymanych <strong>przed ukończeniem 26 lat</strong>, m.in. z umowy o pracę i typowej umowy zlecenia. Roczny limit zwolnienia to <strong>85 528 zł</strong> łącznie dla przychodów objętych odpowiednimi ulgami zerowymi.</p>
      <ArticleExample title="Przykład: limit 85 528 zł">
        <p>Osoba przed 26. urodzinami uzyskała w 2026 r. wyłącznie przychody z pracy objęte ulgą.</p>
        <ol>
          <li>Przy przychodzie <strong>80 000 zł</strong> cała ta kwota mieści się w limicie PIT-0.</li>
          <li>Przy przychodzie <strong>90 000 zł</strong> zwolnione może być 85 528 zł, a <strong>4472 zł</strong> przekracza limit.</li>
        </ol>
        <p>4472 zł to przychód ponad limit, <strong>nie kwota podatku</strong>. Dalszy PIT zależy m.in. od kosztów, składek i rocznych rozliczeń.</p>
      </ArticleExample>
      <h2>Czy PIT-0 oznacza brak składek ZUS?</h2>
      <p><strong>Nie.</strong> Ulga dotyczy podatku PIT. Pracownik na etacie nadal co do zasady ma potrącane składki ZUS i zdrowotną. Inaczej może być ze zleceniem ucznia lub studenta przed 26. rokiem życia.</p>
      <h2>A umowa o dzieło?</h2>
      <p>Przychód ze zwykłej umowy o dzieło <strong>nie jest objęty ulgą dla młodych</strong>. Sam wiek poniżej 26 lat nie wystarczy. O zastosowaniu zwolnienia decydują rodzaj przychodu, wiek podatnika oraz pozostały roczny limit.</p>
    </>
  );
}
