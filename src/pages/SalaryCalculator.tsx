import { useState } from 'react';

// mui


// third party
import { useIntl } from 'react-intl';
import { 
  Formik,
  Form
} from "formik";

import * as Yup from 'yup';

// project imports
import CardTabs from '../components/CardTabs';

export default function SalaryCalculator() {

  const intl = useIntl();
  const [value, setValue] = useState(0);

  const labels = [
    'Podatki i potrącenia',
    'Kalendarz i norma czasu',
    'Stawka i premie',
    'Nadgodziny i godziny nocne',
    'Zwolnienie lekarskie (L4)',
    'Urlop'
  ];

  const changeTab = (value: number) => {
    setValue(value);
  }

  console.log(value);

  return (
    <>
      <Formik
        initialValues={{ email: intl.formatMessage({id: 'hello'}) }}
        validationSchema={Yup.object({ email: Yup.string().email('Invalid email').required('Required') })}
        onSubmit={(values) => { console.log(values); }}
      >
        <Form>
          <CardTabs value={value} labels={labels} onChange={changeTab}/>
        </Form>
      </Formik>
    </>
  )
}