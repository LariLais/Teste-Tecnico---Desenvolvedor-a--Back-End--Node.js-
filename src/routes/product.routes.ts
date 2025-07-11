import { Router } from "express";
import { ProductController } from "../controllers/ProductController";
import { verifyCompanyKey } from "../middlewares/verifyCompanyKey";


const router = Router();
const controller = new ProductController();

// USO DE MIDDLEWARE EM TODAS ROTAS
router.use(verifyCompanyKey)

// ROTA DOS PRODUTOS
router.get("/products", controller.getAll);
router.post("/products", controller.create);
router.get("/products/filters",controller.getFilters);
router.get("/products/count", controller.count);
router.get("/products/:id", controller.getById);
router.put("/products/:id", controller.update);
router.delete("/products/:id", controller.delete);

export default router;
