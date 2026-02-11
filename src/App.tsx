import Button from "@mui/material/Button";
import { HomeOutlined } from "@ant-design/icons";

function App() {
  return (
    <div>
      <Button variant="contained" startIcon={<HomeOutlined />}>
        Hello World
      </Button>
    </div>
  );
}

export default App;
