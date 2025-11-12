const productService = require('../../../src/v1/service/productService');
const ProductStyle = require('../../../src/v1/model/productStyle');

jest.mock('../../../src/v1/model/productStyle');

describe('ProductService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getProducts', () => {
    it('should return products with pagination', async () => {
      const mockProducts = [
        { _id: '1', title: 'Organic Apple', price: 100 },
        { _id: '2', title: 'Organic Banana', price: 50 }
      ];

      ProductStyle.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockProducts)
      });

      ProductStyle.countDocuments.mockResolvedValue(2);

      const result = await productService.getProducts({
        page: 1,
        limit: 10
      });

      expect(result).toHaveProperty('products');
      expect(result).toHaveProperty('pagination');
      expect(result.products).toEqual(mockProducts);
      expect(result.pagination.total).toBe(2);
    });

    it('should apply filters correctly', async () => {
      const query = {
        category: 'Fruits',
        minPrice: 50,
        maxPrice: 200
      };

      ProductStyle.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([])
      });

      ProductStyle.countDocuments.mockResolvedValue(0);

      await productService.getProducts(query);

      expect(ProductStyle.find).toHaveBeenCalledWith(expect.objectContaining({
        category: 'Fruits',
        price: expect.objectContaining({
          $gte: 50,
          $lte: 200
        })
      }));
    });
  });

  describe('getProductById', () => {
    it('should return product when found', async () => {
      const mockProduct = { _id: '1', title: 'Organic Apple', price: 100 };

      ProductStyle.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockProduct)
      });

      const result = await productService.getProductById('1');

      expect(result).toEqual(mockProduct);
    });

    it('should throw error when product not found', async () => {
      ProductStyle.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue(null)
      });

      await expect(productService.getProductById('nonexistent'))
        .rejects
        .toThrow('Product not found');
    });
  });

  describe('checkAvailability', () => {
    it('should return available true when stock is sufficient', async () => {
      const mockProduct = {
        _id: '1',
        title: 'Organic Apple',
        stock: 100
      };

      ProductStyle.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockProduct)
      });

      const result = await productService.checkAvailability('1', 10);

      expect(result.available).toBe(true);
      expect(result.availableStock).toBe(100);
    });

    it('should return available false when stock is insufficient', async () => {
      const mockProduct = {
        _id: '1',
        title: 'Organic Apple',
        stock: 5
      };

      ProductStyle.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockProduct)
      });

      const result = await productService.checkAvailability('1', 10);

      expect(result.available).toBe(false);
      expect(result.message).toContain('Only 5 items available');
    });

    it('should return available true when stock field does not exist', async () => {
      const mockProduct = {
        _id: '1',
        title: 'Organic Apple'
        // No stock field
      };

      ProductStyle.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockProduct)
      });

      const result = await productService.checkAvailability('1', 10);

      expect(result.available).toBe(true);
    });
  });

  describe('searchProducts', () => {
    it('should search products using Fuse.js', async () => {
      const mockProducts = [
        { _id: '1', title: 'Organic Apple', price: 100 },
        { _id: '2', title: 'Apple Juice', price: 150 }
      ];

      ProductStyle.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockProducts)
      });

      const result = await productService.searchProducts('apple', {
        page: 1,
        limit: 10
      });

      expect(result).toHaveProperty('products');
      expect(result).toHaveProperty('pagination');
      expect(result).toHaveProperty('searchTerm', 'apple');
    });
  });
});

