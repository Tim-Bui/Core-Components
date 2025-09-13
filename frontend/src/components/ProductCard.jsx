import { Link } from 'react-router-dom';

function ProductCard({ product }) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <Link to={`/product/${product.product_id}`}>
        <img
          src={product.image_url || 'https://via.placeholder.com/300'}
          alt={product.name}
          className="w-full h-48 object-cover"
        />
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{product.name}</h3>
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>
          <div className="flex justify-between items-center">
            <span className="text-2xl font-bold text-indigo-600">
              ${parseFloat(product.price).toFixed(2)}
            </span>
            <span className="text-sm text-gray-500">
              Stock: {product.stock_quantity || 'In Stock'}
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}

export default ProductCard;
