import productsModel from '../model/Products.model.js'
import OrdersModel from '../model/Orders.model.js'
import ShopModel from '../model/Shop.model.js'
// helper function
function percentage(percent, total) {
	return ((percent / 100) * total).toFixed(2)
}

const generateUniqueOrderID = () => {
	const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
	let randomString = ''

	// Generate a random string of capital letters
	for (let i = 0; i < 5; i++) {
		randomString += characters.charAt(
			Math.floor(Math.random() * characters.length)
		)
	}

	// Use current timestamp as a part of the order ID
	const timestamp = Date.now().toString(36)

	// Combine timestamp and random portion to create the order ID
	let uniqueOrderID = (timestamp + randomString).toUpperCase()

	// If the length exceeds 10 characters, truncate it
	if (uniqueOrderID.length > 10) {
		uniqueOrderID = uniqueOrderID.substr(0, 10)
	}

	// If the length is less than 10 characters, pad it with additional random characters
	while (uniqueOrderID.length < 10) {
		uniqueOrderID += characters.charAt(
			Math.floor(Math.random() * characters.length)
		)
	}

	return uniqueOrderID
}

/** POST: http://localhost:8080/api/order 
 * @param: {
    "header" : "Bearer <token>"
}
body: {
    "discount_coupon":{
        "coupon_code":"NEW-100",
        "discount_price":"50"
    },
    "shipping_address":{ -- address_object
        "full_name": "Hoping Minds",
        "address_line_1": "Sectore-75",
        "address_line_2": "Corporate Greens",
        "landmark": "2nd Floor",
        "city": "Mohali",
        "state": "Mohali",
        "country": "India",
        "latitude": "-10937484.3829",
        "longitude": "3249323.32333",
        "mobile": 9814740275,
        "zip": 144002,
        "type": "Office"
    },
    "products":[
        {
            "productid":"65d2fdd5020dd810551d66e7",
            "quantity":2,
			"shopid": "65d2fdd5020dd810551d36e9"
        },
        {
            "productid":"65d2fdd5020dd810551d66e3",
            "quantity":1,
			"shopid": "65d2fdd5020dd810551d66e9"
        }
    ],
}
*/
export async function order(req, res) {
	try {
		const { userID } = req.user
		const { discount_coupon, shipping_address, products } = req.body

		if (!userID)
			return res.status(401).send({ error: 'User Not Found...!' })

		const orders = []
		let totalPrice = 0

		for (const item of products) {
			const { productid, quantity, shopid } = item
			const shop = await ShopModel.findOne({ _id: shopid })

			if (!shop) {
				return res.status(404).send({ error: `Shop with ID ${shopid} not found` })
			}

			const product = await productsModel.findById(productid)
			if (!product) {
				return res.status(404).json({
					success: false,
					message: `Product with ID ${productid} not found`,
				})
			}

			const store = product.stores.find(store => store.store.toString() === shopid);
			let calculatedPrice =
				(store.variants1_mrp_price -
					percentage(
						store['variants1_discount_per'],
						store.variants1_mrp_price
					)) *
					quantity -
				discount_coupon.discount_price
			totalPrice += calculatedPrice
			orders.push({
				order_id: generateUniqueOrderID(),
				discount_coupon,
				shipping_address,
				product: productid,
				quantity,
				order_price: calculatedPrice,
				ordered_on: new Date(),
				ordered_by: userID,
				shop: shopid
			})
		}

		await OrdersModel.insertMany(orders)

		res.status(201).json({
			success: true,
			msg: 'Ordered successfully',
			total_price: totalPrice,
		})
	} catch (error) {
		console.error(error)
		res.status(500).json({ success: false, msg: 'Internal server error' })
	}
}

/** GET: http://localhost:8080/api/getorders
 * @param: {
    "header" : "Bearer <token>"
}
*/
export async function getorders(req, res) {
	const { userID } = req.user
	try {
		// Find the cart document and populate the products field with product data
		const orders = await OrdersModel.find({ ordered_by: userID }).populate(
			'product'
		)

		if (!orders) {
			return res
				.status(404)
				.json({ success: false, message: 'No orders history!' })
		}

		res.status(200).json({ success: true, orders: orders })
	} catch (error) {
		console.error(error)
		res.status(500).json({
			success: false,
			message: 'Internal server error',
		})
	}
}

/** GET: http://localhost:8080/api/getallorders*/
export async function getallorders(req, res) {
	try {
		// Find the cart document and populate the products field with product data
		const orders = await OrdersModel.find({}).populate(
			'product'
		)

		if (!orders) {
			return res
				.status(404)
				.json({ success: false, message: 'No orders history!' })
		}

		res.status(200).json({ success: true, orders: orders })
	} catch (error) {
		console.error(error)
		res.status(500).json({
			success: false,
			message: 'Internal server error',
		})
	}
}

/** GET: http://localhost:8080/api/getdeliveryorders*/
export async function getdeliveryorders(req, res) {
	try {
		const orders = await OrdersModel.find({status: 'shipped'}).populate(
			'shop'
		)

		if (!orders) {
			return res
				.status(404)
				.json({ success: false, message: 'No orders history!' })
		}

		res.status(200).json({ success: true, orders: orders })
	} catch (error) {
		console.error(error)
		res.status(500).json({
			success: false,
			message: 'Internal server error',
		})
	}
}
