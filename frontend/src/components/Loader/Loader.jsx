import { Box, CircularProgress } from "@mui/material";

const Loader = () => {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        position: "absolute",
        inset: 0,
      }}
    >
      <CircularProgress />
    </Box>
  );
};

export default Loader;
