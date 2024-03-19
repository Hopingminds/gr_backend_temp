import mongoose from "mongoose";
import { AddressSchema } from "./Address.model.js";

export const DeliveryboySchema = new mongoose.Schema({
    password: {
        type: String,
        required: [true, "Please provide a password"],
        unique : false,
    },
    email: {
        type: String,
        required : [true, "Please provide a unique email"],
        unique: true,
    },
    firstName: { type: String},
    lastName: { type: String},
    mobile : { type : Number},
    address: {type: AddressSchema},
    dob:{type:Date},
    gender: {
        type: String,
        enum: ['Male', 'Female', 'Others'],
    },
    vehicleNumber: { type:String },
    drivingLicense: { type:String },
    profile: { type: String},
    shift_status: {type: Boolean, default: false},
    isVerified: {type: Boolean, default: false},
    all_orders: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Orders'
    }],
    join_date: {type: Date},
    earnings: {type: Number, default: 0},
    Aadhar:{
        type: Number
    },
    PanCard:{
        type: String
    },
});

export default mongoose.model.Deliveryboys || mongoose.model('Deliveryboy', DeliveryboySchema);