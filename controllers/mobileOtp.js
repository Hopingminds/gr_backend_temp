// import ENV from '../config.js'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
import jwt from 'jsonwebtoken'
import sellerModel from '../model/Seller.model.js'
import deliveryboyModel from '../model/Deliveryboy.model.js'

const ENV = process.env;
console.log(ENV)

// const accountSid = ENV.TWILIO_ACCOUNT_SID
const accountSid = "AC4d4333f7c36b37421a98b027fc9e6deb"
// const authToken = ENV.TWILIO_AUTH_TOKEN
const authToken = "2325ac470d9d3c9fb95bf14cb9eb1853"
// const verifySid = ENV.TWILIO_ACCOUNT_VERIFY_SID
const verifySid = "VAde426f3dcaa347b6bd5c609342728ff4"
const client = require('twilio')(accountSid, authToken)

/** POST: http://localhost:8080/api/generateMobileOTP 
* body : {
	"mobile" : "1234567890",
}
*/
export async function generateMobileOTP(req, res) {
	const { mobile } = req.body

	client.verify.v2
		.services(verifySid)
		.verifications.create({ to: `+91${mobile}`, channel: 'sms' })
		.then((verification) => res.status(201).send({ msg: 'OTP Sent.' }))
		.catch((err) => {
			res.status(500).send({ err: 'Unable to generate OTP' })
		})
}

/** POST: http://localhost:8080/api/verifyMobileOTP 
* body : {
	"mobile" : "1234567890",
	"otp": 0197
}
*/
export async function verifyMobileOTP(req, res) {
	const { mobile, otp } = req.body

	client.verify.v2
		.services(verifySid)
		.verificationChecks.create({
			to: `+91${mobile}`,
			code: otp,
		})
		.then((verification_check) =>
			res.status(201).send({ msg: verification_check.status })
		)
		.catch((err) => {
			res.status(500).send({ err: 'Wrong OTP' })
		})
}

/** POST: http://localhost:8080/api/verifySellerLoginMobileOTP 
* body : {
	"mobile" : "1234567890",
	"otp": 0197
}
*/
export async function verifySellerLoginMobileOTP(req, res) {
	const { mobile, otp } = req.body
	client.verify.v2
		.services(verifySid)
		.verificationChecks.create({
			to: `+91${mobile}`,
			code: otp,
		})
		.then((verification_check) => {
			console.log(verification_check.status);
			try {
				sellerModel
					.findOne({ OwnerMobile: mobile })
					.then((seller) => {
						// create jwt token
						const token = jwt.sign(
							{
								sellerID: seller._id,
								email: seller.OwnerEmail,
								mobile: seller.OwnerMobile,
								shop: seller?.Shop || false,
							},
							ENV.JWT_SECRET,
							{ expiresIn: '24h' }
						)
						return res
							.status(200)
							.send({
								msg: 'Login Successful',
								email: seller.OwnerEmail,
								token,
								shop: seller?.Shop || false,
								verified: seller.Verified,
							})
					})
					.catch((error) => {
						console.log(error);
						return res
							.status(404)
							.send({ error: 'Mobile not Found' })
					})
			} catch (error) {
				console.log(error);
				return res.status(500).send(error)
			}
		})
		.catch((err) => {
			console.log(err);
			res.status(500).send({ err: 'Wrong OTP' })
		})
}


/** POST: http://localhost:8080/api/verifyDeliveryboyLoginMobileOTP 
* body : {
	"mobile" : "1234567890",
	"otp": 0197
}
*/
export async function verifyDeliveryboyLoginMobileOTP(req, res) {
	const { mobile, otp } = req.body
	client.verify.v2
		.services(verifySid)
		.verificationChecks.create({
			to: `+91${mobile}`,
			code: otp,
		})
		.then((verification_check) => {
			console.log(verification_check.status);
			try {
				deliveryboyModel
					.findOne({ mobile })
					.then((deliveryboy) => {
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
						console.log(error);
						return res
							.status(404)
							.send({ error: 'Mobile not Found' })
					})
			} catch (error) {
				console.log(error);
				return res.status(500).send(error)
			}
		})
		.catch((err) => {
			console.log(err);
			res.status(500).send({ err: 'Wrong OTP' })
		})
}