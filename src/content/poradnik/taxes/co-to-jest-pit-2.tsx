import ArticleExample from '../../../sections/poradnik/ArticleExample';

export default function Pit2Content() {
  return (
    <>
      <h2>Co zmienia PIT-2?</h2>
      <p>PIT-2 to oświadczenie pozwalające płatnikowi <strong>zmniejszać miesięczną zaliczkę na podatek</strong>. Dzięki temu możesz dostawać więcej na konto w ciągu roku. Nie zwiększa to pensji brutto ani rocznej kwoty zmniejszającej podatek.</p>
      <ArticleExample title="Przykład: zaliczka PIT przed pomniejszeniem to 360 zł">
        <p>Zakładamy, że na tę zaliczkę można zastosować całą wskazaną kwotę zmniejszenia.</p>
        <ol>
          <li>Jeden płatnik i pełne pomniejszenie <strong>300 zł</strong>: zaliczka wynosi <strong>60 zł</strong>.</li>
          <li>Podział między dwóch płatników, po <strong>150 zł</strong>: u każdego pomniejszenie jest mniejsze.</li>
          <li>Podział między trzech płatników, po <strong>100 zł</strong>: każdy może zastosować swoją część.</li>
        </ol>
        <p>Łącznie można rozdzielić maksymalnie 300 zł miesięcznie — <strong>nie 300 zł u każdego płatnika</strong>.</p>
      </ArticleExample>
      <h2>A jeśli korzystasz z PIT-0?</h2>
      <p>Jeżeli z danego przychodu zaliczka PIT i tak wynosi 0 zł, PIT-2 nie da dodatkowych 300 zł wypłaty. Także przy zaliczce niższej od pomniejszenia nie można odliczyć więcej niż należny podatek.</p>
      <p>PIT-2 może dotyczyć nie tylko etatu, ale także odpowiednio rozliczanych zleceń. Wysokość miesięcznego pomniejszenia zależy od złożonego oświadczenia i sposobu podziału kwoty między płatników.</p>
    </>
  );
}
