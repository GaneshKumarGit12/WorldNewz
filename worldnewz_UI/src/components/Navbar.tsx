import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";

const Navbar: React.FC = () => {
  return (
    <AppBar position="sticky" color="primary">
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          World News
        </Typography>
        <Button color="inherit" href="/">Discover</Button>
        <Button color="inherit" href="/sports">Sports</Button>
        <Button color="inherit" href="/money">Money</Button>
        <Button color="inherit" href="/weather">Weather</Button>
        <Button color="inherit" href="/shopping">Shopping</Button>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;