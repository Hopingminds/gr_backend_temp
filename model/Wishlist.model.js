import mongoose from "mongoose";
import ProductsModel from "./Products.model.js";
export const WishlistSchema = new mongoose.Schema({
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
            shopID:{
                type: mongoose.Schema.Types.ObjectId,
                ref: 'shops'
            }
        }
    ]
}, { _id: false });

export default mongoose.model.Wishlists || mongoose.model('Wishlist', WishlistSchema);