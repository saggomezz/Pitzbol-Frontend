const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());

// Ruta API de ejemplo
app.get("/api/hello", (req, res) => {
  res.json({ message: "Hola desde el backend Node.js 🚀" });
});

// Servir React en producción
app.use(express.static(path.join(__dirname, "../client/build")));

// Catch-all route para React (evita error de *)
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, "../client/build", "index.html"));
});

// Puerto
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});
