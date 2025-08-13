import { Button, IconButton } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { toggleTheme } from "../../features/slices/themeSlice";
import WbSunnyIcon from "@mui/icons-material/WbSunny";
import ModeNightIcon from "@mui/icons-material/ModeNight";
import styles from "./theme-button.module.css";

const ThemeButton = () => {
  const dispatch = useDispatch();
  const mode = useSelector((state) => state.theme.mode);

  return (
    <IconButton
      sx={{ padding: "8px 8px 5px" }}
      className={styles.themeButton}
      onClick={() => dispatch(toggleTheme())}
    >
      {mode === "light" ? <ModeNightIcon /> : <WbSunnyIcon />}{" "}
    </IconButton>
  );
};

export default ThemeButton;
