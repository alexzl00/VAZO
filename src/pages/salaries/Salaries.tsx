import { useNavigate } from 'react-router';
import { useSearchParams } from 'react-router-dom';

// project
import SalariesTable from '../../sections/salaries-list/SalariesTable';

// third party
import { useIntl } from 'react-intl';

// ==============================|| EXAMINATIONS PAGE ||============================== //

export default function Examinations() {
  const intl = useIntl();
  const [searchParams, setSearchParams] = useSearchParams();

  const navigate = useNavigate();

  return (
    <>
      <SalariesTable
        editClick={function (id: string): void {
          navigate({
            pathname: `/update-salary/${id}`,
            search: searchParams.toString()
          });
        }}
      />
    </>
  );
}
