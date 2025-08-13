import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router";
import { Box, Button, TextField, Typography } from "@mui/material";
import { selectUserName, setUserName } from "../../features/slices/userSlice";

const RegistrationPage = () => {
  const [name, setName] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const userName = useSelector(selectUserName);

  useEffect(() => {
    if (userName && userName !== "null") {
      navigate("/");
    }
  });

  const handleSave = () => {
    dispatch(setUserName(name));
    navigate("/");
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
      }}
    >
      <Typography variant="h4" mb={4}>
        Введите ваше имя
      </Typography>
      <TextField
        fullWidth
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Ваше имя"
        sx={{ maxWidth: "500px" }}
      />
      <Box mt={2}>
        <Button variant="contained" color="primary" onClick={handleSave}>
          Сохранить
        </Button>
      </Box>
    </Box>
  );
};

export default RegistrationPage;
