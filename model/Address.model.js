import mongoose from "mongoose";

export const AddressSchema = new mongoose.Schema({
    full_name: String,
    address_line_1: String,
    address_line_2: String,
    landmark: String,
    city: String,
    state: String,
    country: String,
    latitude: String,
    longitude: String,
    mobile: Number,
    zip: Number,
    type: String,
});