const express = require('express');
require("dotenv").config();
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");




const app = express();



app.use(express.json())
app.use(cookieParser());

// cors setup
app.use(
    cors({
      credentials: true,
      origin: [process.env.FRONTEND_URL],
      optionsSuccessStatus: 200,
    })
  );

// DB setup
const initDB = require("./db");
initDB();

app.use(express.static(path.join(__dirname, "build")));

// Routes setup
const routes = require("./routes/v1.routes");
app.use("/api/v1", routes);

app.use((_, res) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

// Handle unhandled routes
app.all("*", (req, res) => res.status(404).json({ message: `${req.originalUrl} not found` }));

const PORT = process.env.PORT || 7000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));