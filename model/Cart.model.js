import mongoose from "mongoose";
import ProductsModel from "./Products.model.js";
export const CartSchema = new mongoose.Schema({
    _id :{ type: mongoose.Schema.Types.ObjectId, 
        auto: true, 
        required: true 
    },
    products: [
        {
            product:{
                type: mongoose.Schema.Types.ObjectId,
                ref: ProductsModel,
            },
            quantity: {
                type: Number,
                default: 1
            },
            shopID:{
                type: mongoose.Schema.Types.ObjectId,
                ref: 'shops'
            }
        }
    ]
}, { _id: false });

export default mongoose.model.Carts || mongoose.model('Cart', CartSchema);