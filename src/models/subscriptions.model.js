import mongoose ,{Schema} from "mongoose";
// import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const subscriptionSchema =  new Schema({


    subscriber:{
        type: Schema.Types.ObjectId, // whi is subscribe
        ref:"User",
        require: true
    },
    channel:{
        type: Schema.Types.ObjectId, 
        ref:"User"
    }

},{timestamps:true})



export const Subscription = mongoose.model("Subscription", subscriptionSchema)