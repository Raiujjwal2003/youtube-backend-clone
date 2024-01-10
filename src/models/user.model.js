import mongoose, { Schema } from "mongoose";

const userSchema = new Schema.ObjectId(
    {
        username:{
            type:String,
            required:true,
            unique:true,
            lowercare:true,
            trim:true,
            index:true,
        },
        email:{
            type:String,
            required:true,
            unique:true,
            lowercare:true,
            trim:true,
            index:true,
        },
        
    }
)