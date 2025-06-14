import orderModel  from "../models/orderModel.js";
import userModel from "../models/userModel.js";

import { Stripe } from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

//placing user order for frontend

const placeOrder = async (req,res)=>{
    try {

        const frontend_url = 'https://foodio-yxrd.onrender.com'
;
        
        const newOrder = new orderModel({
            userId:req.body.userId,
            items:req.body.items,
            amount:req.body.amount,
            address:req.body.address,
        })

        await newOrder.save();
        await userModel.findByIdAndUpdate(req.body.userId,{cartData:{}})


        const line_items= req.body.items.map((item)=>({
           price_data:{
            currency:"inr",
            product_data:{
                name:item.name,
            },
            unit_amount: item.price*80*100,
           },
           quantity:item.quantity,
        }))

        line_items.push({
            price_data:{
                currency:"inr",
                product_data:{
                    name:"Delivery Charges",
                },
                unit_amount: 2*100*80,
            },
            quantity:1,
        })

        const session = await stripe.checkout.sessions.create({
            line_items,
            mode:"payment",
            success_url:`${frontend_url}/verify?success=true&orderId=${newOrder._id}`,
            cancel_url:`${frontend_url}/verify?success=false&orderId=${newOrder._id}`,
        })

        res.json({success:true,session_url:session.url})

    } catch (error) {
        console.log(error);
        res.json({success:false,message:"Error"});
    }
}


const verifyOrder = async(req,res)=>{

    const {success,orderId} = req.body;

    try {
        
        if(success==='true'){
            await orderModel.findByIdAndUpdate(orderId,{payment:true});
            res.json({success:true,message:"paid"});
        }
        else{
            await orderModel.findByIdAndDelete(orderId);
            res.json({success:false,message:"Not Paid"})
        }

    } catch (error) {
       console.log(error); 
       res.json({success:false,message:"Error"})
    }

}

// user orders for frontend

const userOrders = async(req,res)=>{
    try {
        
        const orders = await orderModel.find({userId:req.body.userId});
        res.json({success:true,data:orders});


    } catch (error){
        console.log(error);
        res.json({success:false,message:"Error"})
    }
}


export {placeOrder,verifyOrder,userOrders}
