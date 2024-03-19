import UserModel from '../model/User.model.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
// import ENV from '../config.js'

import otpGenerator from 'otp-generator'
const ENV = process.env;

// middleware for verify user
export async function verifyUser(req, res, next) {
	try {
		const { email, mobile } = req.method == 'GET' ? req.query : req.body
		// check the user existance
		if (email && !mobile) {
			let exit = await UserModel.findOne({ email })
			if (!exit) return res.status(404).send({ error: "Can't find user!" })
			req.userID = exit._id
			next()
		}

		else if (!email && mobile) {
			let exit = await UserModel.findOne({ mobile })
			if (!exit) return res.status(404).send({ error: "Can't find user!" })
			req.userID = exit._id
			next()
		}
	} catch (error) {
		return res.status(404).send({ error: 'Authentication Error' })
	}
}

/** POST: http://localhost:8080/api/register 
* @param : {
	"password" : "admin123",
	"email": "example@gmail.com",
	"firstName" : "bill",
	"lastName": "william",
	"mobile": 8009860560,
	"profile": "" (not compuslory)
}
*/
export async function register(req, res) {
	try {
		const { password, email, profile, firstName, lastName, mobile } = req.body;

		// check for existing mobile number
		const existMobile = UserModel.findOne({ mobile }).exec();

		// check for existing email
		const existEmail = UserModel.findOne({ email }).exec();

		// Checking for existing mobile and email
		const [mobileExist, emailExist] = await Promise.all([existMobile, existEmail]);

		if (mobileExist) {
			return res.status(400).send({ error: 'Please use a unique mobile number' });
		}

		if (emailExist) {
			return res.status(400).send({ error: 'Please use a unique email' });
		}

		if (password) {
			const hashedPassword = await bcrypt.hash(password, 10);
			const user = new UserModel({
				password: hashedPassword,
				profile: profile || '',
				email,
				firstName,
				lastName,
				mobile
			});

			// Save the user
			const savedUser = await user.save();
			const token = jwt.sign(
				{
					userID: savedUser._id,
					email: savedUser.email,
					mobile: savedUser.mobile
				},
				ENV.JWT_SECRET,
				{ expiresIn: '24h' }
			)
			// Send response with _id and email
			return res.status(201).send({
				msg: 'User Registered Successfully',
				token
			});
		}
	} catch (error) {
		return res.status(500).send({ error: 'Internal Server Error' });
	}
}

/** POST: http://localhost:8080/api/loginWithEmail 
* @param : {
	"email" : "example123@mail.com",
	"password" : "admin123",
}
*/
export async function loginWithEmail(req, res) {
	const { email, password } = req.body
	try {
		UserModel.findOne({ email })
			.then((user) => {
				bcrypt
					.compare(password, user.password)
					.then((passwordCheck) => {
						if (!passwordCheck)
							return res
								.status(400)
								.send({ error: "Wrong password" })

						// create jwt token
						const token = jwt.sign(
							{
								userID: user._id,
								email: user.email,
								mobile: user.mobile
							},
							ENV.JWT_SECRET,
							{ expiresIn: '24h' }
						)
						return res.status(200).send({
							msg: 'Login Successful',
							email: user.email,
							token,
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

/** POST: http://localhost:8080/api/loginWithMobile 
* @param : {
	"mobile" : "1234567890",
	"password" : "admin123",
}
*/
export async function loginWithMobile(req, res) {
	const { mobile, password } = req.body
	try {
		UserModel.findOne({ mobile })
			.then((user) => {
				bcrypt
					.compare(password, user.password)
					.then((passwordCheck) => {
						if (!passwordCheck)
							return res
								.status(400)
								.send({ error: "Wrong password" })

						// create jwt token
						const token = jwt.sign(
							{
								userID: user._id,
								email: user.email,
								mobile: user.mobile
							},
							ENV.JWT_SECRET,
							{ expiresIn: '24h' }
						)
						return res.status(200).send({
							msg: 'Login Successful',
							email: user.email,
							token,
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

/** GET: http://localhost:8080/api/user 
	query: {
	--pass only one email or mobile according to reset with mobile or reset with email
	"email": "example@gmail.com",
	"mobile": 8009860560,
}
*/
export async function getUser(req, res) {
	let userID = req.userID
	try {
		const userData = await UserModel.findOne({ _id: userID });

		if (!userData) {
			return res.status(404).json({ success: false, msg: 'User not found' });
		}
		const { password, ...rest } = userData.toObject()
		res.status(200).json({ success: true, data: rest });
	} catch (error) {
		console.error(error);
		res.status(500).json({ success: false, msg: 'Internal server error' });
	}
}

/** GET: http://localhost:8080/api/users */
export async function getallUsers(req, res) {
	try {
		const userData = await UserModel.find({});
		const userDataWithoutPassword = userData.map((user) => {
			const { password, ...rest } = user.toObject()
			return rest
		})
		if (!userDataWithoutPassword) {
			return res.status(404).json({ success: false, msg: 'User not found' });
		}
		res.status(200).json({ success: true, data: userDataWithoutPassword });
	} catch (error) {
		console.error(error);
		res.status(500).json({ success: false, msg: 'Internal server error' });
	}
}

/** PUT: http://localhost:8080/api/updateuser 
 * @param: {
	"header" : "Bearer <token>"
}
body: { --pass only required fields
	"password" : "admin123",
	"email": "example@gmail.com",
	"firstName" : "bill",
	"lastName": "william",
	"mobile": 8009860560,
	"profile": ""
}
*/
export async function updateUser(req, res) {
	try {
		const { userID } = req.user;
		const body = req.body
		if (!userID) return res.status(401).send({ error: 'User Not Found...!' })

		const updateUser = new Promise((resolve, reject) => {
			// update the data
			UserModel.updateOne({ _id: userID }, body)
				.exec()
				.then(() => {
					resolve()
				})
				.catch((error) => {
					throw error
				})
		})

		Promise.all([updateUser])
			.then(() => {
				return res.status(201).send({ msg: "Record Updated" });
			})
			.catch((error) => {
				return res.status(500).send({ error: error.message })
			})

	} catch (error) {
		return res.status(401).send({ error })
	}
}

/** GET: http://localhost:8080/api/generateRestPwdOTP 
body: {
	--pass only one email or mobile according to reset with mobile or reset with email
	"email": "example@gmail.com",
	"mobile": 8009860560,
}
*/
export async function generateRestPwdOTP(req, res) {
	req.app.locals.OTP = await otpGenerator.generate(4, { lowerCaseAlphabets: false, upperCaseAlphabets: false, specialChars: false })
	res.status(201).send({ OTP: req.app.locals.OTP })
}

/** GET: http://localhost:8080/api/verifyRestPwdOTP  
	body: {
		"OTP":1234
}
*/
export async function verifyRestPwdOTP(req, res) {
	const { otp } = req.query;
	if (parseInt(req.app.locals.OTP) === parseInt(otp)) {
		req.app.locals.OTP = null //reset OTP value
		req.app.locals.resetSession = true // start session for reset password
		return res.status(201).send({ msg: 'Verify Successsfully!' })
	}
	return res.status(400).send({ error: "Invalid OTP" });
}

// successfully redirect user when OTP is valid
/** GET: http://localhost:8080/api/createResetSession */
export async function createResetSession(req, res) {
	if (req.app.locals.resetSession) {
		return res.status(201).send({ flag: req.app.locals.resetSession })
	}
	return res.status(440).send({ error: "Session expired!" })
}

// update the password when we have valid session
/** PUT: http://localhost:8080/api/resetPassword 
body: { 
	--pass only one email or mobile according to reset with mobile or reset with email
	"email": "example@gmail.com",
	"mobile": 8009860560,
	"password": "NewPassword"
}
*/
export async function resetPassword(req, res) {
	try {

		if (!req.app.locals.resetSession) return res.status(440).send({ error: "Session expired!" });

		const { mobile, email, password } = req.body;

		if (email && !mobile) {
			try {

				UserModel.findOne({ email })
					.then(user => {
						bcrypt.hash(password, 10)
							.then(hashedPassword => {
								UserModel.updateOne({ email: user.email },
									{ password: hashedPassword })
									.exec()
									.then(() => {
										req.app.locals.resetSession = false; // reset session
										return res.status(201).send({ msg: "Record Updated...!" })
									})
									.catch((error) => {
										throw error;
									})
							})
							.catch(e => {
								return res.status(500).send({
									error: "Enable to hashed password"
								})
							})
					})
					.catch(error => {
						return res.status(404).send({ error: "Email not Found" });
					})

			} catch (error) {
				return res.status(500).send({ error })
			}
		}
		else if (!email && mobile) {
			try {

				UserModel.findOne({ mobile })
					.then(user => {
						bcrypt.hash(password, 10)
							.then(hashedPassword => {
								UserModel.updateOne({ mobile: user.mobile },
									{ password: hashedPassword })
									.exec()
									.then(() => {
										req.app.locals.resetSession = false; // reset session
										return res.status(201).send({ msg: "Record Updated...!" })
									})
									.catch((error) => {
										throw error;
									})
							})
							.catch(e => {
								return res.status(500).send({
									error: "Enable to hashed password"
								})
							})
					})
					.catch(error => {
						return res.status(404).send({ error: "Mobile not Found" });
					})

			} catch (error) {
				return res.status(500).send({ error })
			}
		}

	} catch (error) {
		return res.status(401).send({ error })
	}
}

// add address
/** POST: http://localhost:8080/api/addaddress 
 * @param: {
	"header" : "Bearer <token>"
}
body: {
	"address":{
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
	"make_default": true/false
}
*/
export async function addAddress(req, res) {
	try {
		const { userID } = req.user;
		if (!userID) return res.status(401).send({ error: 'User Not Found...!' });
		const { address, make_default } = req.body;

		let userData = await UserModel.findOne({ _id: userID });

		userData.address.push(address);
		await userData.save().then(data => {
			if (make_default || userData.address.length == 0) {
				userData.default_address = data.address[data.address.length - 1]._id;
				userData.save();
			}
		});

		res.status(201).json({ success: true, msg: 'Address saved successfully' });
	} catch (error) {
		console.error(error);
		res.status(500).json({ success: false, msg: 'Internal server error' });
	}
}

// delete address
/** DELETE: http://localhost:8080/api/removeaddress 
 * @param: {
	"header" : "Bearer <token>"
}
body: {
	"address_id": "65d04729adbe892d50a62853"
}
*/
export async function removeAddress(req, res) {
	try {
		const { userID } = req.user;
		if (!userID) return res.status(401).send({ error: 'User Not Found...!' });
		const { address_id } = req.body;

		let userData = await UserModel.findOne({ _id: userID });

		// Find the index of the address with the given address_id
		const index = userData.address.findIndex(addr => addr._id.toString() === address_id);

		if (index === -1) {
			return res.status(404).json({ success: false, msg: 'Address not found' });
		}

		// Remove the address at the found index
		userData.address.splice(index, 1);

		// If the removed address was the default address, remove the default reference
		if (userData.default_address && userData.default_address.toString() === address_id) {
			userData.default_address = null;
		}

		await userData.save();

		res.status(200).json({ success: true, data: userData, msg: 'Address removed successfully' });
	} catch (error) {
		console.error(error);
		res.status(500).json({ success: false, msg: 'Internal server error' });
	}
}

// update address
/** PUT: http://localhost:8080/api/updateaddress 
 * @param: {
	"header" : "Bearer <token>"
}
body: {
	"address_id": "65d047b3adbe892d50a62877",
	"address":{
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
}
*/
export async function updateAddress(req, res) {
	try {
		const { userID } = req.user;
		if (!userID) return res.status(401).send({ error: 'User Not Found...!' });
		const { address_id, address, make_default } = req.body;

		let userData = await UserModel.findOne({ _id: userID });

		// Find the index of the address with the given address_id
		const index = userData.address.findIndex(addr => addr._id.toString() === address_id);

		if (index === -1) {
			return res.status(404).json({ success: false, msg: 'Address not found' });
		}

		// Update the address at the found index
		userData.address[index] = { ...userData.address[index], ...address };

		// If the updated address was the default address, update the default reference
		if (userData.default_address && userData.default_address.toString() === address_id && !make_default) {
			userData.default_address = userData.address[index]._id;
		}

		await userData.save().then(data => {
			if (make_default) {
				userData.default_address = data.address[index]._id;
				userData.save();
			}
		});

		res.status(200).json({ success: true, msg: 'Address updated successfully' });
	} catch (error) {
		console.error(error);
		res.status(500).json({ success: false, msg: 'Internal server error' });
	}
}

// get address by id
/** GET: http://localhost:8080/api/address/:addressid 
	query: {
		--pass only one email or mobile according to reset with mobile or reset with email
		"email": "example@gmail.com",
		"mobile": 8009860560,
	}
*/
export async function getaddressbyid(req, res) {
	const { addressid } = req.params;
	let userID = req.userID
	try {
		const address = await UserModel.findOne({ _id: userID });
		const addressindex = address.address.findIndex(data => data._id.equals(addressid));
		if (addressindex == -1) {
			return res.status(404).json({ success: false, msg: 'Address Data not found' });
		}
		res.status(200).json({ success: true, data: address.address[addressindex] });
	} catch (error) {
		console.error(error);
		res.status(500).json({ success: false, msg: 'Internal server error' });
	}
}