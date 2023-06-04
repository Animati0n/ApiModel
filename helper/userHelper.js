const db = require("../model/config");
const collections = require("../model/collection");
const bcrypt = require("bcrypt");
const { ObjectId } = require("mongodb");
const JWT = require("jsonwebtoken")
const JWTSecrt = "abcdefghijklmnopqrstuvwxyz1234567890"

function authTokenGenerate(data) {
    return JWT.sign(data, JWTSecrt)
}



module.exports = {
    registerUser: (userData) => {
        return new Promise(async (resolve, reject) => {
            let { password, cpassword } = userData
            if (password == cpassword) {
                userData.password = await bcrypt.hash(password, 10)
                db.get().collection(collections.USER_COLLECTION).insertOne(userData)
                    .then((data) => {
                        resolve(data.insertedId);
                        console.log(data.insertedId)
                    }).catch((err) => {
                        console.log(err);
                        reject(err)
                    })
            }
        })
    },
    userLogin: (userData) => {
        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection(collections.USER_COLLECTION).findOne({ email: userData.email });
            console.log(user)
            const id = user._id
            let data = {
                user: {
                    id
                }
            }
            const accessToken = authTokenGenerate(data)
            // db.get().collection(collections.USER_COLLECTION).updateOne(
            //     { _id: new ObjectId(id) }, // Query to identify the document
            //     { $set: { token: [{accessToken}]} } // Update operation
            //   ).then((result)=>{
            //     console.log(result);
            //   }).catch((err)=>console.log(err))
            // console.log("ass",accessToken);
            if (user) {
                bcrypt.compare(userData.password, user.password).then((status) => {
                    console.log(status);
                    if (status) {
                        // res.redirect('/')
                        // res.sendStatus(200)
                        resolve({ status, accessToken })
                    } else {
                        reject('Incorrect password')
                        // res.redirect('/login')
                    }
                }).catch((err) => {
                    console.log(err);
                })
            } else {
                reject("user dose not exist")
            }
        })
    },
    getUserByEmail: (userData) => {
        return new Promise((resolve, reject) => {
            console.log("userdtaaaa:", userData);
            db.get().collection(collections.USER_COLLECTION).findOne({ _id: new ObjectId(userData) }).then((result) => {
                console.log("***:", result)
                resolve(result)
            }).catch((err) => {
                // console.log(err);
                reject(err)
            })
        })
    },
    getBookData: () => {
        return new Promise(async (resolve, reject) => {
            let books = await db.get().collection(collections.BOOKS_COLLECTION).find().toArray()
            //    console.log(books);
            // if(books.length>0){
            resolve(books)
            // }else{
            //     resolve({msg: "No items  "})
            // }

        })
    },
    addToCart: (details) => {
        return new Promise(async (resolve, reject) => {
            let productObj = {
                product: new ObjectId(details.productId),
                quantity: 1
            }
            // console.log(details);
            let userCart = await db.get().collection(collections.CART_COLLECTION).findOne({ userId: new ObjectId(details.userId) });
            // console.log("usercart:", userCart)
            if (userCart) {
                // console.log("inside cart if");
                let productExist = userCart.products.findIndex(
                    (pro) => pro.product == details.productId
                );
                console.log(productExist)
                if (productExist != -1) {
                    db.get().collection(collections.CART_COLLECTION)
                        .updateOne(
                            { userId: new ObjectId(details.userId), "products.product": new ObjectId(details.productId) },
                            {
                                $inc: { "products.$.quantity": 1 }
                            }
                        )
                        .then((result) => {
                            // console.log(result);
                            resolve()
                        });
                } else {
                    db.get().collection(collections.CART_COLLECTION)
                        .updateOne(
                            { userId: new ObjectId(details.userId) },
                            {
                                $push: {
                                    products: productObj,
                                },
                            }
                        )
                        .then((response) => {
                            // console.log(response);
                            resolve()
                        });
                }
            } else {
                let cartObj = {
                    userId: new ObjectId(details.userId),
                    products: [productObj],
                };
                db.get().collection(collections.CART_COLLECTION).insertOne(cartObj)
                    .then((response) => {
                        console.log(response);
                        resolve();
                    });
            }
        })
    },
    getCartItems: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cartItems = await db.get().collection(collections.CART_COLLECTION)
                .aggregate([
                    {
                        $match: { userId: new ObjectId(userId) },
                    },
                    {
                        $unwind: "$products",
                    },
                    {
                        $project: {
                            product: "$products.product",
                            quantity: "$products.quantity",
                        },
                    },
                    {
                        $lookup: {
                            from: collections.BOOKS_COLLECTION,
                            localField: "product",
                            foreignField: "_id",
                            as: "product",
                        },
                    },
                    {
                        $project: {
                            quantity: 1,
                            product: { $arrayElemAt: ["$product", 0] },
                        },
                    },
                ]).toArray()
            // then((result)=>{
            // console.log("cartItems:", cartItems);
            if (cartItems.length > 0) {
                resolve({ cartItems, cartLength: cartItems.length })
            } else {
                resolve({ msg: "cart Is empty" })
            }

        })
    },
    removeCartItem: (details) => {
        return new Promise((resolve, reject) => {
            console.log("dtails:", details);
            db.get().collection(collections.CART_COLLECTION)
                .updateOne(
                    {
                        userId: new ObjectId(details.userId)
                    },
                    {
                        $pull: {
                            products: {
                                product: new ObjectId(details.productId)
                            }
                        }
                    }
                ).then((response) => {
                    console.log("removeditem1:", response);
                    resolve(response);
                }).catch((err) => console.log(err))
        });
    },
    blackListToken: (token) => {
        return new Promise((resolve, reject) => {

            let blackToken = {
                token,
                expiresAt: new Date()
            }
            // console.log(blackToken);
            db.get().collection(collections.BLACKTOKEN_COLLECTION).insertOne(blackToken).then((result) => {
                // console.log(result);
                resolve()
            }).catch((err) => console.log(err))
        })
    },
    isTokenBlacklisted: (token) => {
        return new Promise(async (resolve, reject) => {
            let blacklistedToken = await db.get().collection(collections.BLACKTOKEN_COLLECTION).findOne({ token })
            // .toArray()
            // .then((result) => {
            // console.log("blacklistdbtokr=en:", blacklistedToken);
            if (blacklistedToken) {
                // Token is blacklisted
                console.log('Token is blacklisted');
                resolve(true);
            } else {
                // Token is not blacklisted
                console.log('Token is not blacklisted');
                resolve(false);
            }
        })
    }
}