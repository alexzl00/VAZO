import ArticleExample from '../../../sections/poradnik/ArticleExample';

export default function BonusNetContent() {
  return (
    <>
      <h2>Dlaczego 500 zł premii nie daje 500 zł netto?</h2>
      <p>Premia wypłacana w gotówce jako zwykły składnik pensji na etacie zasadniczo zwiększa podstawę składek i podatku. Nie ma jednej stałej stawki potrącenia: znaczenie mają pozostała pensja, ulgi, próg PIT i PPK.</p>
      <ArticleExample title="Przykład: premia 500 zł do pensji 6000 zł">
        <p>UoP w 2026 r., pełny miesiąc bez nieobecności, 6000 zł stałej pensji, dodatkowe <strong>500 zł premii pieniężnej</strong>. Zakładamy standardowe KUP 250 zł, PIT-2 300 zł, stawkę PIT 12%, pełne składki pracownika, brak PPK i innych ulg.</p>
        <ol>
          <li>Bez premii: z 6000 zł brutto po składkach i zaliczce PIT zostaje <strong>4420,43 zł netto</strong>.</li>
          <li>Z premią: z 6500 zł brutto zostaje <strong>4761,05 zł netto</strong>.</li>
          <li>Różnica na rękę: 4761,05 − 4420,43 = <strong>340,62 zł</strong>.</li>
        </ol>
        <p>To konkretny przykład, a nie wzór „każda premia = 68% netto”. Przy innym progu, uldze lub PPK wynik będzie inny.</p>
      </ArticleExample>
      <h2>A premia podczas L4 i urlopu?</h2>
      <p>To <strong>osobne pytanie</strong>. Nawet gdy premia zwiększa bieżące brutto, nie oznacza to automatycznie, że w identyczny sposób wejdzie do podstawy L4 czy wynagrodzenia urlopowego. Liczą się zasady jej przyznawania i zachowania podczas nieobecności.</p>
    </>
  );
}
