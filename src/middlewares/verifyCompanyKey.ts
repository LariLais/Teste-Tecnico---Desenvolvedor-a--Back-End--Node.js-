import { Request, Response, NextFunction } from "express";

// CHAVES VÁLIDAS PARA ACESSO DE ROTAS
const VALID_KEYS = ["10203040506070809", "10mysecretkey01"];

export function verifyCompanyKey(req: Request, res: Response, next: NextFunction) {
  const companyKey = req.header("x-company-key");

  if (!companyKey || !VALID_KEYS.includes(companyKey)) {
    return res.status(401).json({ message: "Chave de acesso inválida" });
  }

  next();
}
