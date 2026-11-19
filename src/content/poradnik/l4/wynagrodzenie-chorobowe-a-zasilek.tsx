import ArticleExample from '../../../sections/poradnik/ArticleExample';

export default function SickPayVsBenefitContent() {
  return (
    <>
      <h2>Co jest wypłacane podczas L4?</h2>
      <p>Na umowie o pracę na początku choroby zwykle przysługuje <strong>wynagrodzenie chorobowe finansowane przez pracodawcę</strong>. Po wykorzystaniu odpowiedniego limitu dni — <strong>zasiłek chorobowy finansowany z FUS</strong>.</p>
      <h2>Ile dni obowiązuje limit?</h2>
      <ul>
        <li><strong>33 dni</strong> w roku kalendarzowym — zasadniczo dla pracowników do 50 lat.</li>
        <li><strong>14 dni</strong> — od roku następującego po roku, w którym pracownik ukończył 50 lat.</li>
      </ul>
      <p>Sumuje się kwalifikujące się dni choroby w całym roku, nawet jeśli zwolnienia były rozdzielone przerwą.</p>
      <ArticleExample title="Przykład: 35 dni zwykłej choroby">
        <p>Pracownik ma 35 lat, spełnia warunki prawa do świadczeń i od początku roku nie chorował. Zwolnienie obejmuje 35 kolejnych dni kalendarzowych.</p>
        <ol>
          <li>Pierwsze <strong>33 dni</strong>: wynagrodzenie chorobowe finansowane przez pracodawcę.</li>
          <li>Dzień <strong>34. i 35.</strong>: zasiłek chorobowy finansowany z FUS.</li>
        </ol>
        <p>Podział dotyczy <strong>rodzaju świadczenia</strong>, a nie koniecznie dwóch przelewów od różnych instytucji.</p>
      </ArticleExample>
      <h2>Czy zasiłek zawsze przelewa ZUS?</h2>
      <p><strong>Nie.</strong> Niektórzy pracodawcy sami ustalają i wypłacają zasiłki pracownikom, choć pieniądze są finansowane z ubezpieczenia. Zależy to m.in. od liczby zgłoszonych ubezpieczonych.</p>
      <p>Przy zleceniu nie ma pracowniczego wynagrodzenia chorobowego za pierwsze 33 dni; prawo do zasiłku zależy m.in. od ubezpieczenia chorobowego i okresu wyczekiwania. Wypadki przy pracy oraz okres po ustaniu zatrudnienia mają osobne zasady.</p>
    </>
  );
}
