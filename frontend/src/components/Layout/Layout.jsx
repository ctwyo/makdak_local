import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { NavLink, useNavigate } from "react-router";
import { selectUserName, setUserName } from "../../features/slices/userSlice";
import {
  Box,
  Button,
  Container,
  IconButton,
  Link,
  Modal,
  TextField,
  Typography,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import styles from "./layout.module.css";
import ThemeButton from "../ThemeButton/ThemeButton";

export const Layout = ({ children }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const dispatch = useDispatch();
  const userName = useSelector(selectUserName);
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!userName) {
      navigate("/registration");
    }
  }, [userName, navigate]);

  const handleOpen = () => {
    setName(userName);
    setIsModalOpen(true);
  };

  const handleClose = () => setIsModalOpen(false);

  const handleSave = () => {
    dispatch(setUserName(name));
    handleClose();
  };

  return (
    <div className={styles.layout}>
      <div className={styles.layoutContainer}>
        <Container
          sx={{
            display: "flex",
            justifyContent: "flex-start",
            gap: "20px",
            margin: "0px",
            padding: "0px !important",
          }}
        >
          <Link
            component="button"
            onClick={() => navigate("/")}
            underline="hover"
            sx={{
              fontSize: "16px",
              fontWeight: "bold",
              cursor: "pointer",
              color: "inherit",
              "&:hover": {
                color: "#007bff",
              },
              ":focus": {
                outline: "none",
              },
            }}
          >
            Main
          </Link>
          <Link
            component="button"
            onClick={() => navigate("/database")}
            underline="hover"
            sx={{
              fontSize: "16px",
              fontWeight: "bold",
              cursor: "pointer",
              color: "inherit",
              "&:hover": {
                color: "#007bff",
              },
              ":focus": {
                outline: "none",
              },
            }}
          >
            DataBase
          </Link>
        </Container>
        <div className={styles.nameContainer}>
          <Typography className={styles.userName}>{userName}</Typography>
          <IconButton
            sx={{ padding: "8px 8px 5px 8px", width: "40px", height: "40px" }}
            className={styles.editButton}
            onClick={handleOpen}
          >
            <EditIcon />
          </IconButton>
          <ThemeButton className={styles.themeButton} />
        </div>
      </div>
      <Modal open={isModalOpen} onClose={handleClose}>
        <Box
          className={styles.modalBox}
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 400,
            bgcolor: "background.paper",
            boxShadow: 24,
            p: 4,
            borderRadius: "8px",
          }}
        >
          <Typography variant="h6" component="h2" mb={2}>
            Редактировать имя пользователя
          </Typography>
          <TextField
            fullWidth
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Введите ваше имя"
          />
          <Box mt={2} display="flex" justifyContent="space-between">
            <Button variant="contained" color="primary" onClick={handleSave}>
              Сохранить
            </Button>
            <Button variant="outlined" onClick={handleClose}>
              Отменить
            </Button>
          </Box>
        </Box>
      </Modal>
      {children}
    </div>
  );
};
