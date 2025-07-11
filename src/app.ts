import express from "express";
import productRoutes from "./routes/product.routes";

const app = express();
app.use(express.json());

app.use(productRoutes);

app.listen(3333, () => console.log("Servidor rodando em: http://localhost:3333"))