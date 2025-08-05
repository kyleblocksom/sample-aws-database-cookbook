const db = require('../utils/db');

const getAll = async () => {
  const query = `
    SELECT p.*, i.filename, iu.presigned_url as image_url
    FROM xpoints.catalog_items p
    LEFT JOIN xpoints.catalog_images ci ON p.id = ci.item_id
    LEFT JOIN xpoints.images i ON ci.image_id = i.id
    LEFT JOIN xpoints.image_urls iu ON i.id = iu.image_id AND iu.region = $1
  `;
  
  try {
    const result = await db.query(query, [process.env.REGION]);
    return { products: Array.isArray(result) ? result : [] };
  } catch (error) {
    console.error('Error fetching products:', error);
    return { products: [] };
  }
};

const getById = async (id) => {
  const query = `
    SELECT p.*, i.filename, iu.presigned_url as image_url
    FROM xpoints.catalog_items p
    LEFT JOIN xpoints.catalog_images ci ON p.id = ci.item_id
    LEFT JOIN xpoints.images i ON ci.image_id = i.id
    LEFT JOIN xpoints.image_urls iu ON i.id = iu.image_id AND iu.region = $2
    WHERE p.id = $1
  `;
  
  try {
    const result = await db.query(query, [id, process.env.REGION]);
    return { 
      product: Array.isArray(result) && result.length > 0 ? result[0] : null 
    };
  } catch (error) {
    console.error('Error fetching product:', { productId: id, error: error.message });
    return { product: null };
  }
};

const getByCategory = async (category) => {
  const query = `
    SELECT p.*, i.filename, iu.presigned_url as image_url
    FROM xpoints.catalog_items p
    LEFT JOIN xpoints.catalog_images ci ON p.id = ci.item_id
    LEFT JOIN xpoints.images i ON ci.image_id = i.id
    LEFT JOIN xpoints.image_urls iu ON i.id = iu.image_id AND iu.region = $2
    WHERE p.category = $1
  `;
  
  try {
    const result = await db.query(query, [category, process.env.REGION]);
    return { products: Array.isArray(result) ? result : [] };
  } catch (error) {
    console.error('Error fetching products in category:', { category, error: error.message });
    return { products: [] };
  }
};

const getCategories = async () => {
  const query = `
    SELECT DISTINCT category
    FROM xpoints.catalog_items
    ORDER BY category
  `;
  
  try {
    const result = await db.query(query);
    return { 
      categories: Array.isArray(result) 
        ? result.map(item => item && item.category ? item.category : '') 
        : [] 
    };
  } catch (error) {
    console.error('Error fetching categories:', error);
    return { categories: [] };
  }
};

module.exports = {
  getAll,
  getById,
  getByCategory,
  getCategories
};