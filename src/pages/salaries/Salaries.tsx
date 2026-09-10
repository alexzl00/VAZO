import { useNavigate, useSearchParams } from "react-router-dom";

// project
import SalariesTable from "../../sections/salaries-list/SalariesTable";

export default function Salaries() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  return (
    <SalariesTable
      editClick={(id: string) => {
        navigate({
          pathname: `/update-salary/${id}`,
          search: searchParams.toString()
        });
      }}
    />
  );
}
