import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class ProductService {

  async getAllProducts() {
    const products = await prisma.products.findMany({
      where: { deleted_at: null },
      include: {
        variants: {
          include: {
            skus: {
              include: {
                price_tables_skus: true,
              },
            },
          },
        },
        brands: true,
        categories: {
          include: {
            subcategories: true,
          },
        },
        subcategories: true,
      },
    });

    const filtered = products.map((prod) => {
      const validVariants = prod.variants.filter((variant) => {
        const priceTableIds = new Set(
          variant.skus.map((sku) =>
            sku.price_tables_skus.length > 0
              ? sku.price_tables_skus[0].price_table_id
              : null
          )
        );
        return priceTableIds.size === 1;
      });

      return {
        ...prod,
        variants: validVariants,
      };
    });

    return filtered;
  }

  async getProductById(id: number) {
    const prod = await prisma.products.findUnique({
      where: { id },
      include: {
        variants: {
          include: {
            skus: {
              include: {
                price_tables_skus: true,
              },
            },
          },
        },
        brands: true,
        categories: {
          include: {
            subcategories: true,
          },
        },
        subcategories: true,
      },
    });

    if (!prod) return null;

    const validVariants = prod.variants.filter((variant) => {
      const priceTableIds = new Set(
        variant.skus.map((sku) =>
          sku.price_tables_skus.length > 0
            ? sku.price_tables_skus[0].price_table_id
            : null
        )
      );
      return priceTableIds.size === 1;
    });

    return {
      ...prod,
      variants: validVariants,
    };
  }

  async createProduct(data: any) {
    const { variants, ...productData } = data;

    const createdProduct = await prisma.products.create({
      data: {
        ...productData,
        variants: {
          create: variants.map((variant: any) => ({
            name: variant.name,
            hex_code: variant.hex_code,
            skus: {
              create: variant.skus.map((sku: any) => ({
                size: sku.size,
                stock: sku.stock,
                price: sku.price,
                code: sku.code,
                min_quantity: sku.min_quantity,
                multiple_quantity: sku.multiple_quantity,
                price_tables_skus: {
                  create: sku.price_tables_skus ?? [],
                },
              })),
            },
          })),
        },
      },
      include: {
        variants: {
          include: {
            skus: true,
          },
        },
      },
    });

    return createdProduct;
  }

  async updateProduct(id: number, data: any) {
    const { variants, ...productData } = data;

    const updatedProduct = await prisma.products.update({
      where: { id },
      data: { ...productData },
    });

    // Remove variantes antigas (e skus em cascade)
    await prisma.variants.deleteMany({ where: { product_id: id } });

    for (const variant of variants) {
      const createdVariant = await prisma.variants.create({
        data: {
          name: variant.name,
          hex_code: variant.hex_code,
          product_id: id,
        },
      });

      for (const sku of variant.skus) {
        const createdSku = await prisma.skus.create({
          data: {
            size: sku.size,
            stock: sku.stock,
            price: sku.price,
            code: sku.code,
            min_quantity: sku.min_quantity,
            multiple_quantity: sku.multiple_quantity,
            variant_id: createdVariant.id,
          },
        });

        if (sku.price_tables_skus && sku.price_tables_skus.length > 0) {
          for (const pts of sku.price_tables_skus) {
            await prisma.price_tables_skus.create({
              data: {
                sku_id: createdSku.id,
                price_table_id: pts.price_table_id,
                price: pts.price,
              },
            });
          }
        }
      }
    }

    return updatedProduct;
  }

  async deleteProduct(id: number) {
    return prisma.products.update({
      where: { id },
      data: { deleted_at: new Date() },
    });
  }

  async getProductFilters() {
  const products = await prisma.products.findMany({
    where: { deleted_at: null },
    include: {
      brands: true,
      categories: {
        include: { subcategories: true },
      },
      subcategories: true,
    },
  });

  const filters = {
    brands: [] as { id: number; name: string; quantity: number }[],
    types: [] as { name: string; quantity: number }[],
    genders: [] as { name: string; quantity: number }[],
    categories: [] as {
      name: string;
      quantity: number;
      subcategories: { name: string; quantity: number }[];
    }[],
    promptDelivery: { true: 0, false: 0 },
  };

  const brandMap = new Map<number, { id: number; name: string; quantity: number }>();
  const typeMap = new Map<string, number>();
  const genderMap = new Map<string, number>();
  const categoryMap = new Map<string, { quantity: number; sub: Map<string, number> }>();

  for (const prod of products) {
    // Marcas
    if (prod.brands) {
      const key = prod.brands.id;
      const existing = brandMap.get(key);
      if (existing) {
        existing.quantity += 1;
      } else {
        brandMap.set(key, { id: key, name: prod.brands.name, quantity: 1 });
      }
    }

    // Tipos
    if (prod.type) {
      typeMap.set(prod.type, (typeMap.get(prod.type) ?? 0) + 1);
    }

    // Gêneros
    if (prod.gender) {
      genderMap.set(prod.gender, (genderMap.get(prod.gender) ?? 0) + 1);
    }

    // Prompt delivery
    if (prod.prompt_delivery) filters.promptDelivery.true += 1;
    else filters.promptDelivery.false += 1;

    // Categorias e Subcategorias
    if (prod.categories) {
      const catName = prod.categories.name;
      if (!categoryMap.has(catName)) {
        categoryMap.set(catName, { quantity: 0, sub: new Map() });
      }
      const catData = categoryMap.get(catName)!;
      catData.quantity += 1;

      if (prod.subcategories) {
        const subName = prod.subcategories.name;
        catData.sub.set(subName, (catData.sub.get(subName) ?? 0) + 1);
      }
    }
  }

  filters.brands = Array.from(brandMap.values());

  filters.types = Array.from(typeMap.entries()).map(([name, quantity]) => ({ name, quantity }));

  filters.genders = Array.from(genderMap.entries()).map(([name, quantity]) => ({ name, quantity }));

  filters.categories = Array.from(categoryMap.entries()).map(([name, cat]) => ({
    name,
    quantity: cat.quantity,
    subcategories: Array.from(cat.sub.entries()).map(([name, quantity]) => ({ name, quantity })),
  }));

  return filters;
}

async countProducts() {
  const count = await prisma.products.count({
    where: {
      deleted_at: null,
    },
  });

  return count;
}

}
