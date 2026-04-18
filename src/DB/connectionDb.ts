import mongoose from "mongoose";
import { MONGO_URI } from "../config/config.service.js";

export const checkConnection=async()=>{
    try {
        await mongoose.connect(MONGO_URI);
        console.log(`Connected to MongoDB ${MONGO_URI} successfully 😁` );
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
    }
}