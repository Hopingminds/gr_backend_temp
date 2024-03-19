import deliveryboyModel from '../model/Deliveryboy.model.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
// import ENV from '../config.js'
import { registerMail } from './mailer.js'
import OrdersModel from '../model/Orders.model.js'

// middleware for verify deliveryboy
const ENV = process.env;
export async function verifyDeliveryboy(req, res, next) {
	try {
		const { email, mobile } = req.method == 'GET' ? req.query : req.body
		// check the deliveryboy existance
		if (email && !mobile) {
			let exit = await deliveryboyModel.findOne({ email })
			if (!exit)
				return res.status(404).send({ error: "Can't find deliveryboy!" })
			req.deliveryboyID = exit._id
			next()
		} else if (!email && mobile) {
			let exit = await deliveryboyModel.findOne({ mobile })
			if (!exit)
				return res.status(404).send({ error: "Can't find deliveryboy!" })
			req.deliveryboyID = exit._id
			next()
		}
	} catch (error) {
		return res.status(404).send({ error: 'Authentication Error' })
	}
}

/** POST: http://localhost:8080/api/registerdeliveryboy
* @param : {
	"password": "12345678",
	"email": "sahilkumar142002@gmail.com",
	"firstName": "Sahil",
	"lastName": "Kumar",
	"mobile": 9814740275,
	"address": {
		"address_line_1": "675-E Type-2",
		"address_line_2": "RCF",
		"landmark": "Near Temple",
		"city": "Kaapurthala",
		"state": "Punjab",
		"country": "India",
		"zip": 144602
	},
	"dob": "14-09-2002"
	"gender": "Male" -- [Female/ Others]
	"vehicleNumber": "PB09 AE 7589"
	"drivingLicense": "PB0929848JHSLS"
	"profile": "https://dunb17ur4ymx4.cloudfront.net/webstore/logos/badc87621293f70727079411fcd552fae001b939.png",
	"Aadhar": 475881278859,
	"PanCard":"JYNPK7464J"
}
*/
export async function registerdeliveryboy(req, res) {
	try {
		const {
			password,
			email,
			firstName,
			lastName,
			mobile,
			address,
			dob,
			gender,
			vehicleNumber,
			drivingLicense,
			profile,
			Aadhar,
			PanCard,
		} = req.body
		// check for existing mobile number
		const existMobile = deliveryboyModel.findOne({ mobile }).exec()

		// check for existing email
		const existEmail = deliveryboyModel.findOne({ email }).exec()

		// Checking for existing mobile and email
		const [mobileExist, emailExist] = await Promise.all([
			existMobile,
			existEmail,
		])

		if (mobileExist) {
			return res.status(400).send({
				success: false,
				msg: 'Deliveryboy with mobile already exsist.',
			})
		}

		if (emailExist) {
			return res.status(400).send({
				success: false,
				msg: 'Deliveryboy with email already exsist.',
			})
		}
		if (password) {
			const hashedPassword = await bcrypt.hash(password, 10)
			const deliveryboy = new deliveryboyModel({
				password: hashedPassword,
				profile: profile || '',
				email,
				firstName,
				lastName,
				mobile,
				address,
				dob,
				gender,
				vehicleNumber,
				drivingLicense,
				profile,
				Aadhar,
				PanCard,
				join_date: new Date()
			})

			// Save the deliveryboy
			await deliveryboy.save()
			// Send response with _id and email
			return res
				.status(201)
				.send({ success: true, msg: 'Deliveryboy Registred Successfully.' })
		}
	} catch (error) {
		return res
			.status(500)
			.send({ success: false, msg: 'Internal Server Error.' })
	}
}

/** GET: http://localhost:8080/api/deliveryboy 
	query: {
	--pass only one email or mobile according to reset with mobile or reset with email
	"email": "example@gmail.com",
	"mobile": 8009860560,
}
*/
export async function getDeliveryboy(req, res) {
	let deliveryboyID = req.deliveryboyID
	try {
		const deliveryboyData = await deliveryboyModel
			.findOne({ _id: deliveryboyID })
			.populate('orders')

		if (!deliveryboyData) {
			return res
				.status(404)
				.json({ success: false, msg: 'Deliveryboy not found' })
		}
		const { password, ...rest } = deliveryboyData.toObject()
		res.status(200).json({ success: true, data: rest })
	} catch (error) {
		console.error(error)
		res.status(500).json({ success: false, msg: 'Internal server error' })
	}
}

// verify deliveryboy
/** POST: http://localhost:8080/api/approvedeliveryboy
	body:{
		"email" : "sahilkumar142002@gmail.com", // or
		"mobile": "9814740275",
		"approved": true // flase
	}
*/
export async function approvDeliveryboy(req, res) {
	// Verified
	let deliveryboyID = req.deliveryboyID
	let { approved } = req.body
	let deliveryboy = await deliveryboyModel.findOne({ _id: deliveryboyID })

	try {
		// If the user has no cart, create a new one
		if (!deliveryboy) {
			return res
				.status(500)
				.json({ success: false, msg: 'Wrong deliveryboy ID' })
		}

		if (approved && !deliveryboy.isVerified) {
			await deliveryboyModel.updateOne({ _id: deliveryboyID }, { isVerified: approved })
			registerMail(
				{
					body: {
						username: `${deliveryboy.firstName} ${deliveryboy.lastName}`,
						userEmail: deliveryboy.email,
						subject: 'Congratulations - Deliveryboy Approved!',
						text: `Congratulations your deliveryboy account with email <b>${deliveryboy.email}</b> is now approved.
                                Go to the link http://localhost/merchant/ 
                                to login with your email or mobile.`,
					},
				},
				{
					status(status) {
						if (status === 200) {
							return res.status(200).json({
								success: true,
								msg: 'Deliveryboy approved.',
							})
						} else {
							return res.status(200).json({
								success: true,
								msg: 'Deliveryboy approved but failed to send mail',
								mail: deliveryboy.email,
							})
						}
					},
				}
			)
		} else {
			return res
				.status(500)
				.json({ success: false, msg: 'Deliveryboy is already approved.' })
		}
		if (!approved) {
			await deliveryboyModel.deleteOne({ _id: deliveryboyID })
			return res.status(200).json({
				success: true,
				msg: 'Deliveryboy is set to not approved.',
			})
		}
	} catch (error) {
		console.error(error)
		res.status(500).json({ success: false, msg: 'Internal server error' })
	}
}

// logins

/** POST: http://localhost:8080/api/deliveryboyloginWithEmail 
* @param : {
	"email" : "example123@mail.com",
	"password" : "admin123",
}
*/
export async function deliveryboyLoginWithEmail(req, res) {
	const { email, password } = req.body
	try {
		deliveryboyModel
			.findOne({ email })
			.then((deliveryboy) => {
				bcrypt
					.compare(password, deliveryboy.password)
					.then((passwordCheck) => {
						if (!passwordCheck)
							return res
								.status(400)
								.send({ error: 'Wrong password' })

						// create jwt token
						const token = jwt.sign(
							{
								deliveryboyID: deliveryboy._id,
								email: deliveryboy.email,
								mobile: deliveryboy.mobile
							},
							ENV.JWT_SECRET,
							{ expiresIn: '24h' }
						)
						return res.status(200).send({
							msg: 'Login Successful',
							email: deliveryboy.email,
							token,
							verified: deliveryboy.isVerified,
						})
					})
					.catch((error) => {
						return res
							.status(400)
							.send({ error: 'Password does not match' })
					})
			})
			.catch((error) => {
				return res.status(404).send({ error: 'Email not Found' })
			})
	} catch (error) {
		return res.status(500).send(error)
	}
}

/** POST: http://localhost:8080/api/deliveryboyloginWithMobile 
* @param : {
	"mobile" : "1234567890",
	"password" : "admin123",
}
*/
export async function DeliveryboyLoginWithMobile(req, res) {
	const { mobile, password } = req.body
	try {
		deliveryboyModel
			.findOne({ mobile })
			.then((deliveryboy) => {
				bcrypt
					.compare(password, deliveryboy.password)
					.then((passwordCheck) => {
						if (!passwordCheck)
							return res
								.status(400)
								.send({ error: 'Wrong password' })

						// create jwt token
						const token = jwt.sign(
							{
								deliveryboyID: deliveryboy._id,
								email: deliveryboy.email,
								mobile: deliveryboy.mobile
							},
							ENV.JWT_SECRET,
							{ expiresIn: '24h' }
						)
						return res.status(200).send({
							msg: 'Login Successful',
							email: deliveryboy.OwnerEmail,
							token,
							verified: deliveryboy.isVerified,
						})
					})
					.catch((error) => {
						return res
							.status(400)
							.send({ error: 'Password does not match' })
					})
			})
			.catch((error) => {
				return res.status(404).send({ error: 'Mobile not Found' })
			})
	} catch (error) {
		return res.status(500).send(error)
	}
}

// Get all deliveryboys

/** GET: http://localhost:8080/api/deliveryboys */
export async function getdeliveryboys(req, res) {
	try {
		const deliveryboys = await deliveryboyModel.find({})

		if (!deliveryboys) {
			return res.status(404).json({ success: false, message: 'Deliveryboys not found' });
		}

		res.status(200).json({ success: true, deliveryboys });
	} catch (error) {
		console.error(error);
		res.status(500).json({ success: false, message: 'Internal server error' });
	}
}

/** POST: http://localhost:8080/api/acceptdeliveryboyorder 
	body: {
		"email" : "sahilkumar142002@gmail.com",
		"_id": "gdwuydt5e87wcbw678c6cbe671"
	}
*/
export async function acceptdeliveryboyorder(req, res) {
	try {
		let deliveryboyID = req.deliveryboyID
		const { _id } = req.body

		let deliveryboy = await deliveryboyModel.findOne({ _id: deliveryboyID }).populate('all_orders');
		let orders = await OrdersModel.findOne({ _id })

		if (!orders) {
			return res.status(404).json({ success: false, msg: 'Delivery boy not found.' });
		}
		const existingorderID = deliveryboy.all_orders.findIndex(p => p.equals(_id));
		if (existingorderID == -1) {
			deliveryboy.all_orders.push(_id);
		} else {
			return res.status(500).json({ success: false, msg: 'Order already accepted.' });
		}

		await deliveryboy.save();

		res.status(201).json({ success: true, msg: 'Product added to cart successfully' });
	} catch (error) {
		console.error(error);
		res.status(500).json({ success: false, msg: 'Internal server error' });
	}
}

/** POST: http://localhost:8080/api/deliverdeliveryboyorder 
 * body {
		"orderID": "65e050f4392acdc91e9db224"
	}
*/
export async function deliverdeliveryboyorder(req, res) {
	try {
		const { orderID } = req.body

		OrdersModel.updateOne({ _id: orderID },
			{ status: "delivered" })
			.exec()
			.then(() => {
				return res.status(201).send({ msg: "Successfully Delivered!" })
			})
			.catch((error) => {
				throw error;
			})
	} catch (error) {
		console.error(error);
		res.status(500).json({ success: false, msg: 'Internal server error' });
	}
}