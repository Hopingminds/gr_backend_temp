import mongoose from "mongoose";
import ShopModel from "./Shop.model.js";
export const SellerSchema = new mongoose.Schema({
    password: {
        type: String,
        required: [true, "Please provide a password"],
        unique : false,
    },
    OwnerEmail: {
        type: String,
        required : [true, "Please provide a unique email"],
        unique: true,
    },
    OwnerName: { type: String},
    OwnerMobile : { type : Number},
    OwnerDOB:{
        type: String
    },
    OwnerAddress: {
        type: String
    },
    OwnerProfile: { type: String},
    Aadhar:{
        type: Number
    },
    PanCard:{
        type: String
    },
    Shop:{
        type: mongoose.Schema.Types.ObjectId,
        ref: ShopModel,
    },
    Verified: {
        type: Boolean,
        default: false
    }
});

export default mongoose.model.Sellers || mongoose.model('Seller', SellerSchema);