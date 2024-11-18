const express = require('express');
require("dotenv").config();
const cors = require("cors");
const cookieParser = require("cookie-parser");



const app = express();

app.use((req, res, next) => {
    const originalCookie = res.cookie.bind(res);
  
    res.cookie = (name, value, options = {}) => {
      // Default SameSite to 'Lax' if not explicitly set
      if (!options.sameSite) {
        options.sameSite = 'Lax';
      }
  
      originalCookie(name, value, options);
    };
  
    next();
  });
  

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

// Routes setup
const routes = require("./routes/v1.routes");
app.use("/api/v1", routes);

// Handle unhandled routes
app.all("*", (req, res) => res.status(404).json({ message: `${req.originalUrl} not found` }));

const PORT = process.env.PORT || 7000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));