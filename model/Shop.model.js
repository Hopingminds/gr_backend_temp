import mongoose from "mongoose";
export const ShopSchema = new mongoose.Schema({
    shopName: {
        type: String
    },
    OwnerEmail: {
        type: String,
        required : [true, "Please provide a unique email"],
        unique: true,
    },
    OwnerName: { type: String},
    OwnerNumber : { type : Number},
    ShopAddress: {
        type:String
    },
    BusinessLicenceNumber: {
        type: String
    },
    BusinessRegistrationNumber: {
        type: String
    },
    TaxIdentificationNumber: {
        type: String
    },
    TypeOfProductSold: {
        type: String
    },
    openingHours: {
        from:{
            type: String
        },
        to:{
            type: String
        }
    },
    deliveryInfo: {
        mon:{
            type: Boolean,
            default: false,
        },
        tue:{
            type: Boolean,
            default: false,
        },
        wed:{
            type: Boolean,
            default: false,
        },
        thu:{
            type: Boolean,
            default: false,
        },
        fri:{
            type: Boolean,
            default: false,
        },
        sat:{
            type: Boolean,
            default: false,
        },
        sun:{
            type: Boolean,
            default: false,
        }
    },
    workingDays: {
        type: Number
    },
    isProvideDeliveryService: {
        type: Boolean
    },
    deliveryArea: {
        type: String
    },
    deliveryCharges: {
        type: Number
    },
    paymentType: {
        type: Object
    },
    shop_primary_image_url:{
        type: String
    },
    shopImages: [{
        type: String
    }],
    termsAndCondition: {
        type: String
    },
    privacyPolicy: {
        type: String
    },
    returnPolicy: {
        type: String
    },
    refundPolicy: {
        type: String
    },
    products:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'inventory'
    }],
    "approved": {
        type:Boolean,
        default: false
    },
    visitors:{
        type: Number,
        default: 0
    }
});

export default mongoose.model.Shops || mongoose.model('Shop', ShopSchema);