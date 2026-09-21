import { brands } from "./brands";

describe("brand product imagery", () => {
  brands.forEach((brand) => {
    test(`${brand.name} uses local, product-specific imagery`, () => {
      expect(brand.productVisuals).toHaveLength(brand.products.length);

      brand.productVisuals.forEach((imagePath) => {
        expect(imagePath).toMatch(
          new RegExp(`^/product-images/${brand.slug}/[a-z0-9-]+\\.webp$`)
        );
      });

      brand.products.forEach((product) => {
        expect(product.imageAlt).toEqual(expect.any(String));
        expect(product.imageAlt.trim().length).toBeGreaterThan(12);
      });
    });
  });
});
