import productModel from '../model/Products.model.js'
import cartModel from '../model/Cart.model.js'
import wishlistModel from '../model/Wishlist.model.js'
import slugify from 'slugify'
/** GET: http://localhost:8080/api/products */
export async function products(req, res) {
	let {category,subcategory,sort,price_min,price_max,search,populate} = req.query
	// console.log(category,subcategory,sort,price_min,price_max);
	try {
		let query = {};

		// Add category and subcategory to the query if provided
		if (category) {
			query.parent_category_name = category;
		}
		if (subcategory) {
			query.sub_category_name = subcategory;
		}

		// Add price range to the query if provided
		if (price_min !== undefined && price_max !== undefined) {
			query.variants1_mrp_price = { $gte: price_min, $lte: price_max };
		} else if (price_min !== undefined) {
			query.variants1_mrp_price = { $gte: price_min };
		} else if (price_max !== undefined) {
			query.variants1_mrp_price = { $lte: price_max };
		}

        if (search) {
            query.products_title = { $regex: search, $options: 'i' };
        }

		// Build the sort object based on the 'sort' parameter
		let sortObj = {};
		if (sort === 'price_asc') {
			sortObj.variants1_mrp_price = 1;
		} else if (sort === 'price_desc') {
			sortObj.variants1_mrp_price = -1;
		}
		
		const products = await productModel.find(query).sort(sortObj).populate(populate)
		res.status(200).json(products)
	} catch (err) {
		res.status(500).send('Internal Server Error')
	}
}

/** POST: http://localhost:8080/api/addproduct
* @body : {
    "slug":"apple-fruit",
	"products_title":"Apple Fruit",
    "products_description":"An apple is a round, edible fruit produced by an apple tree. Apple trees are cultivated worldwide and are the most widely grown species in the genus Malus. The tree originated in Central Asia, where its wild ancestor, Malus sieversii, is still found.",
    "brand":"",
    "product_primary_image_url":"https://cdn.britannica.com/22/187222-050-07B17FB6/apples-on-a-tree-branch.jpg",
    "product_images_url":[
        "https://cdn.britannica.com/22/187222-050-07B17FB6/apples-on-a-tree-branch.jpg",
        "https://domf5oio6qrcr.cloudfront.net/medialibrary/11525/0a5ae820-7051-4495-bcca-61bf02897472.jpg",
        "https://static.tnn.in/thumb/msid-94915915,thumbsize-65898,width-1280,height-720,resizemode-75/94915915.jpg"
    ],
    "product_videos_url":[
        "https://www.youtube.com/watch?v=zSWq8qI_cN0",
        "https://www.youtube.com/watch?v=zSWq8qI_cN0"
    ],
    "tags":"Featured Popular",
    "parent_category_name":"Fruits",
    "sub_category_name":"Apple",
    "variants1_weight":"500gm",
    "variants1_unit_type":"Fruit"
}
*/
export async function addproduct(req, res) {
	try {
		const productData = req.body
		// If the user has no wishlist, create a new one
        productData.slug = slugify(productData.products_title)
		let product = new productModel(productData)
		await product.save()
		res.status(201).json({ success: true, msg: 'Product added successfully' })
	} catch (error) {
		console.error(error)
		res.status(500).json({ success: false, msg: 'Internal server error' })
	}
}

/** GET: http://localhost:8080/api/product/:product-slug */
export async function getProductByName(req, res) {
	const { productname } = req.params

	try {
		if (!productname)
			return res.status(501).send({ error: 'Invalid Productname' })

		const checkProduct = new Promise((resolve, reject) => {
			productModel.findOne({ slug:productname }).populate('stores.store')
				.exec()
				.then((product) => {
					if (!product) {
						reject({ error: "Couldn't Find the Product." })
					} else {
						resolve(product)
					}
				})
				.catch((err) => {
					reject(new Error(err))
				})
		})

		Promise.all([checkProduct])
			.then((productDetails) => {
				return res.status(200).send(productDetails)
			})
			.catch((error) => {
				return res.status(500).send({ error: error.message })
			})
	} catch (error) {
		return res.status(404).send({ error: 'Cannot Find Product Data' })
	}
}

/** POST: http://localhost:8080/api/addtocart
body: {
    --pass only one email or mobile according to reset with mobile or reset with email
    "email": "example@gmail.com",
    "mobile": 8009860560,
    "productid": "65c4ba60866d0d5a6fc4a82b",
    "quantity":1,
    "shopID": "65c4ba60866d0d5a6fc4a82b"
}
*/
export async function addToCart(req, res) {
	let userID = req.userID
	try {
        const { productid, quantity, shopID } = req.body;
		
		// Fetch the product data
		const product = await productModel.findById(productid);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        // Find the cart for the user
        let cart = await cartModel.findOne({ _id:userID }).populate('products.product');

        // If the user has no cart, create a new one
        if (!cart) {
            cart = new cartModel({ _id:userID, products: [] });
        }

        const existingProductIndex = cart.products.findIndex(p => p.product.equals(product._id));

        if (existingProductIndex !== -1) {
            cart.products[existingProductIndex].quantity += quantity || 1;
        } else {
            cart.products.push({ product:product._id, quantity, shopID });
        }

        await cart.save();

        res.status(201).json({success: true, msg: 'Product added to cart successfully', data: cart.products });
    } catch (error) {
        console.error(error);
        res.status(500).json({success: false, msg: 'Internal server error' });
    }
}

/** POST: http://localhost:8080/api/removefromcart
body: {
    --pass only one email or mobile according to reset with mobile or reset with email
    "email": "example@gmail.com",
    "mobile": 8009860560,
    "productid": "65c4ba60866d0d5a6fc4a82b",
    "operation": "removeOne" || "removeAll" || "deleteCart"
}
*/
export async function removeFromCart(req, res) {
    let userID = req.userID;
    try {
        const { productid, operation } = req.body;

        // Find the cart for the user
        let cart = await cartModel.findOne({ _id: userID }).populate('products.product');

        // If the user has no cart, return with a message
        if (!cart) {
            return res.status(404).json({ success: false, message: 'Cart not found for the user' });
        }

        const existingProductIndex = cart.products.findIndex(p => p.product.equals(productid));

        // If the product is not found in the cart, return with a message
        if (existingProductIndex === -1 && operation != 'deleteCart') {
            return res.status(404).json({ success: false, message: 'Product not found in the cart' });
        }

        switch (operation) {
            case 'removeOne':
                // Decrease the quantity of the product by 1
                cart.products[existingProductIndex].quantity -= 1;
                // If the quantity becomes 0, remove the product from the cart
                if (cart.products[existingProductIndex].quantity <= 0) {
                    cart.products.splice(existingProductIndex, 1);
                }
                break;
            case 'removeAll':
                // Remove the entire quantity of the product from the cart
                cart.products.splice(existingProductIndex, 1);
                break;
            case 'deleteCart':
                // Delete the entire cart for the user
                await cartModel.deleteOne({ _id: userID });
                return res.status(200).json({ success: true, message: 'Cart deleted successfully' });
            default:
                return res.status(400).json({ success: false, message: 'Invalid operation' });
        }

        await cart.save();

        res.status(200).json({ success: true, message: 'Operation successful', data:cart.products });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
}

/** GET: http://localhost:8080/api/getcart
query: {
    --pass only one email or mobile according to reset with mobile or reset with email
    "email": "example@gmail.com",
    "mobile": 8009860560,
}
*/
export async function getcart(req, res) {
	let userID = req.userID
	try {
        // Find the cart document and populate the products field with product data
        const cart = await cartModel.findOne({_id:userID}).populate('products.product');

        if (!cart) {
            return res.status(404).json({ success: false, message: 'Cart not found' });
        }

        res.status(200).json({ success: true, cart:cart.products });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
}

/** POST: http://localhost:8080/api/addtowishlist
body: {
    --pass only one email or mobile according to reset with mobile or reset with email
    "email": "example@gmail.com",
    "mobile": 8009860560,
    "productid": "65c4ba60866d0d5a6fc4a82b",
    "shopID":"65c4ba60866d0d5a6fc4a82b"
}
*/
export async function addtowishlist(req, res) {
	let userID = req.userID
	try {
        const { productid , shopID} = req.body;
		
		// Fetch the product data
		const product = await productModel.findById(productid);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        // Find the wishlist for the user
        let wishlist = await wishlistModel.findOne({ _id:userID });

        // If the user has no wishlist, create a new one
        if (!wishlist) {
            wishlist = new wishlistModel({ _id:userID, products: [] });
        }

        const existingProductIndex = wishlist.products.findIndex(p => p.product.equals(product._id));

        if (existingProductIndex == -1) {
            wishlist.products.push({ product:product._id, shopID});
        }

        await wishlist.save();
        res.status(201).json({success: true, msg: 'Product added to wishlist successfully' });

    } catch (error) {
        console.error(error);
        res.status(500).json({success: false, msg: 'Internal server error' });
    }
}

/** POST: http://localhost:8080/api/removefromwishlist
body: {
    --pass only one email or mobile according to reset with mobile or reset with email
    "email": "example@gmail.com",
    "mobile": 8009860560,
    "productid": "65c4ba60866d0d5a6fc4a82b",
}
*/
export async function removeFromWishlist(req, res) {
    let userID = req.userID;
    try {
        const { productid, shopID } = req.body;

        // Find the wishlist for the user
        let wishlist = await wishlistModel.findOne({ _id: userID }).populate('products.product');

        // If the user has no wishlist, return with a message
        if (!wishlist) {
            return res.status(404).json({ success: false, message: 'Wishlist not found for the user' });
        }

        const existingProductIndex = wishlist.products.findIndex(p => p.product.equals(productid));

        // If the product is not found in the wishlist, return with a message
        if (existingProductIndex === -1) {
            return res.status(404).json({ success: false, message: 'Product not found in the wishlist' });
        }

        // Remove the product from the wishlist
        wishlist.products.splice(existingProductIndex, 1);

        await wishlist.save();
        res.status(200).json({ success: true, message: 'Product removed from wishlist successfully', data:wishlist.products });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
}

/** GET: http://localhost:8080/api/getwishlist
query: {
    --pass only one email or mobile according to reset with mobile or reset with email
    "email": "example@gmail.com",
    "mobile": 8009860560,
}
*/
export async function getwishlist(req, res) {
	let userID = req.userID
	try {
        // Find the cart document and populate the products field with product data
        const wishlist = await wishlistModel.findOne({_id:userID}).populate('products.product');

        if (!wishlist) {
            return res.status(404).json({ success: false, message: 'wishlist not found' });
        }

        res.status(200).json({ success: true, wishlist:wishlist.products });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
}