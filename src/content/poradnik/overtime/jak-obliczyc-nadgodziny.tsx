import ArticleExample from '../../../sections/poradnik/ArticleExample';

export default function OvertimeContent() {
  return (
    <>
      <h2>Co dostajesz za nadgodziny?</h2>
      <p>Przy umowie o pracę za nadgodzinę zwykle przysługuje <strong>normalne wynagrodzenie</strong> i osobny <strong>dodatek 50% albo 100%</strong>. To nie oznacza, że dostajesz tylko połowę stawki.</p>
      <ul>
        <li><strong>50% dodatku</strong> — najczęściej za nadgodziny po zwykłym dniu pracy.</li>
        <li><strong>100% dodatku</strong> — m.in. za nadgodziny w nocy, a także w określone niedziele i święta.</li>
      </ul>
      <ArticleExample title="Przykład: stawka 37,50 zł za godzinę">
        <p>Pracownik ma 6000 zł wynagrodzenia zasadniczego brutto, a w przyjętym miesiącu 160 godzin do przepracowania. Dla uproszczenia nie ma innych składników wpływających na stawkę.</p>
        <ol>
          <li>Stawka godzinowa: 6000 ÷ 160 = <strong>37,50 zł</strong>.</li>
          <li>Jedna nadgodzina z dodatkiem 50%: 37,50 + 18,75 = <strong>56,25 zł brutto</strong>.</li>
          <li>Jedna nadgodzina z dodatkiem 100%: 37,50 + 37,50 = <strong>75,00 zł brutto</strong>.</li>
        </ol>
        <p>Za dwie takie nadgodziny byłoby odpowiednio <strong>112,50 zł</strong> lub <strong>150,00 zł brutto</strong> ponad zwykłe wynagrodzenie za zaplanowaną pracę.</p>
      </ArticleExample>
      <h2>A jeśli pracodawca odda czas wolny?</h2>
      <p>Zamiast dodatku można otrzymać czas wolny na zasadach Kodeksu pracy. Na wniosek pracownika co do zasady jest to godzina za godzinę, a bez jego wniosku — 1,5 godziny za godzinę nadliczbową.</p>
      <h2>Ważne przy sobotach i grafiku</h2>
      <p>Jeżeli sobota jest dniem wolnym wynikającym z przeciętnie pięciodniowego tygodnia pracy, co do zasady pracownikowi przysługuje inny dzień wolny, uzgodniony z pracodawcą, do końca okresu rozliczeniowego. Nie każda sobota jest dniem wolnym: sposób rozliczenia zależy od rozkładu czasu pracy, rodzaju przekroczenia norm oraz zasad udzielania czasu wolnego.</p>
    </>
  );
}
