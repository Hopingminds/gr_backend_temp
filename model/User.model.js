import mongoose from "mongoose";
import { AddressSchema } from "./Address.model.js";

export const UserSchema = new mongoose.Schema({
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
    default_address:{
        type: mongoose.Schema.Types.ObjectId,
    },
    address: [AddressSchema],
    profile: { type: String}
});

export default mongoose.model.Users || mongoose.model('User', UserSchema);