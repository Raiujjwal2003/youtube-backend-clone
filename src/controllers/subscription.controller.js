import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscriptions.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    const  userId  = req.user._id;
    console.log(userId);
    // console.log(req.user._id);

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channelId");
    }


    const channel = await User.findById(channelId);
    if (!channel) {
        throw new ApiError(404, "Channel not found");
    }

    const existingSubscription = await Subscription.findOne({ subscriber: userId, channel: channelId });

    if (existingSubscription) {
        // If the user is already subscribed, unsubscribe
        await Subscription.findByIdAndDelete(existingSubscription._id);
        res.json(new ApiResponse("Unsubscribed successfully", { isSubscribed: false, subscriberId: userId }));
    } else {
        // If the user is not subscribed, subscribe
        const newSubscription = await Subscription.create({ subscriber: userId, channel: channelId });
        res.json(new ApiResponse("Subscribed successfully", { isSubscribed: true, subscriberId: userId }));
    }
});


// controller to return subscriber list of a channel
// const getUserChannelSubscribers = asyncHandler(async (req, res) => {
//     const {channelId} = req.params

//     if (!mongoose.isValidObjectId(channelId)) {
//         throw new ApiError(400, "Invalid channelId");
//     }


//     try {
//           const subscribers = await Subscription.find({ channel: channelId });

//           const subscriberCount = subscribers.length;
  
//           // Return the response with the subscriber count
//           return res
//           .status(200)
//           .json(new ApiResponse(200, { subscribers, subscriberCount }, "Subscriber count fetched successfully"));
//     } catch (error) {
//         console.error("Error:", error);
//         return res.status(500).json(new ApiResponse(500, null, "Internal Server Error"));
//     }
// })

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    // Check if channelId is a valid ObjectId
    if (!mongoose.isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channelId");
    }

    try {
        // Find all documents that match the channelId to get the subscriber list
        const subscribers = await Subscription.find({ channel: channelId });

        // Count the number of subscribers
        const subscriberCount = subscribers.length;

        // Return the response with the subscriber list and count
        return res.status(200).json(new ApiResponse(200, { subscribers, subscriberCount }, "Subscriber list and count fetched successfully"));
    } catch (error) {
        console.error("Error:", error);
        return res.status(500).json(new ApiResponse(500, null, "Internal Server Error"));
    }
});


const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params;

            // Check if subscriberId is a valid ObjectId
        if (!mongoose.isValidObjectId(subscriberId)) {
            throw new ApiError(400, "Invalid subscriberId");
        }

    try {

        // Find subscriptions for the subscriberId
        const subscriptions = await Subscription.find({ subscriber: subscriberId }).populate('channel', 'name');

        if (!subscriptions || subscriptions.length === 0) {
            throw new ApiError(404, "No subscriptions found for the provided subscriberId");
        }

        // Extract the channels from the subscriptions
        const subscribedChannels =  subscriptions.map(subscription => subscription.channel);
        const totalCountOfSubscribedChannels = subscribedChannels.length
        // Return the response with subscribed channels
        return res
        .status(200)
        .json(new ApiResponse(200, {subscribedChannels , totalCountOfSubscribedChannels}, "Subscribed channels fetched successfully"));
    } catch (error) {
        throw new ApiError(400 , "Data not Fetch")
    }
});

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}