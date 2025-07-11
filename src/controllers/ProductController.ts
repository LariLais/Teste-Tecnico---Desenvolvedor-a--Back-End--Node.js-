import { Request, Response } from "express";
import { ProductService } from "../services/ProductService";

const service = new ProductService();

export class ProductController {
  // MÉTODO DE PEGAR TODOS ITENS
  async getAll(req: Request, res: Response) {
    try {
      const result = await service.getAllProducts();
      res.json(result);
    } catch (error: any) {
      console.error("Erro ao buscar produtos:", error);
      res.status(500).json({ message: "Erro interno ao buscar produtos" });
    }
  }

  // MÉTODO DE PEGAR ITENS POR ID
  async getById(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const result = await service.getProductById(id);
      if (!result)
        return res.status(404).json({ message: "Produto não encontrado" });
      res.json(result);
    } catch (error: any) {
      console.error("Erro ao buscar produto:", error);
      res.status(500).json({ message: "Erro interno ao buscar produto" });
    }
  }

  // MÉTODO PARA DELETAR ITENS USANDO ID
  async delete(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      await service.deleteProduct(id);
      res.status(204).send();
    } catch (error: any) {
      console.error("Erro ao deletar produto:", error);
      res.status(500).json({ message: "Erro interno ao deletar produto" });
    }
  }

  // MÉTODO PARA CRIAR NOVO ITEM
  async create(req: Request, res: Response) {
    try {
      const productData = req.body;
      const createdProduct = await service.createProduct(productData);
      res.status(201).json(createdProduct);
    } catch (error: any) {
      console.error("Erro ao criar produto:", error);
      res.status(500).json({
        message: "Erro interno ao criar produto",
        error: error.message,
      });
    }
  }

  // MÉTODO PARA ATUALIZAR UM ITEM EXISTENTE
  async update(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const productData = req.body;
      const updatedProduct = await service.updateProduct(id, productData);
      if (!updatedProduct) {
        return res.status(404).json({ message: "Produto não encontrado" });
      }
      res.status(200).json(updatedProduct);
    } catch (error: any) {
      console.error("Erro ao atualizar produto:", error);
      res.status(500).json({ message: "Erro interno ao atualizar produto" });
    }
  }

  // MÉTODO PARA BUSCAR FILTROS
  async getFilters(req: Request, res: Response) {
    try {
      const filters = await service.getProductFilters();
      res.json(filters);
    } catch (err) {
      res.status(500).json({ message: "Erro ao buscar filtros", error: err });
    }
  }

  // MÉTODO DE CONTAGEM DE ITENS
  async count(req: Request, res: Response) {
    try {
      const total = await service.countProducts();
      res.json({ count: total });
    } catch (err) {
      res.status(500).json({ message: "Erro ao contar produtos", error: err });
    }
  }
}
