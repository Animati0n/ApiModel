const express = require('express')
const userHelper = require("../helper/userHelper")
const router = express.Router()
const JWT = require("jsonwebtoken")
const JWTSecrt = "abcdefghijklmnopqrstuvwxyz1234567890"


async function VerifyToken(req, res, next) {
    // console.log(req.headers['authorization']);
    const token = req.headers['authorization']
    // console.log("token:", JSON.stringify(token))
    if (token) {
        //     console.log("JWTverify:", JWT.verify(req.body.token, JWTSecrt))
        let authToken = token.split(' ')[1]
        // console.log("auth:", authToken);
        let isblackListToken = await userHelper.isTokenBlacklisted(authToken)
        // console.log("blackliste##:", isblackListToken);
        // console.log("**jwt:",JWT.decode(authToken))
        if (isblackListToken) {
            return next(res.send({ msg: "token is expired. Login Again" }))
        } else {
            JWT.verify(authToken, JWTSecrt, (err, result) => {
                if (err) {
                    // console.log("JWTError:", err);
                    return next(res.send({ msg: "invalid token,Try again!!!" }))
                } else {
                    // console.log("##:", result);
                    console.log(result.user.id);
                    userHelper.getUserByEmail(result.user.id).then((result) => {
                        // console.log("db:", result);
                        console.log("login success full");
                        res.locals.userId = result._id
                        next()
                    }).catch((err) => console.log(err))
                }
            })
        }
    } else {
        res.send({ msg: "unauthorised access" })
    }
}

router.post('/register', async (req, res) => {
    // console.log(req.body);
    userHelper.registerUser(req.body).then((result) => {
        res.json({ status: true })
    }).catch((err) => console.log(err))


});

router.post("/login", (req, res) => {
    // console.log(req.body);
    userHelper.userLogin(req.body).then((result) => {
        // console.log(result);
        res.send(result)
    }).catch((err) => {
        console.log(err);
        res.send(err)
    })
})
router.get('/homepage', VerifyToken, (req, res) => {
    // console.log(req.body)
    // console.log("req:", req.headers)
    userHelper.getBookData().then((result) => {
        // console.log("data:", result)
        res.json({ result, status: 200 })

    }).catch((err) => console.log(err))

    // res.json(req.body)
})

router.post('/addToCart', VerifyToken, (req, res) => {
    // console.log(res.locals.userId)
    // console.log(req.body);
    const { userId } = res.locals
    const { productId } = req.body
    let data = {
        userId,
        productId
    }
    userHelper.addToCart(data).then(() => {
        res.send({ msg: "added to cart successfully" })
    }).catch((err) => console.log(err))
    // res.send(res.locals.userId)
})

router.get('/cart', VerifyToken, (req, res) => {
    const { userId } = res.locals
    // console.log(userId);
    userHelper.getCartItems(userId).then((result) => {
        // console.log(result);
        res.json(result)
    }).catch((err) => console.log(err))

})
router.post("/removeCartItem", VerifyToken, (req, res) => {
    // console.log(req.body);
    const { userId } = res.locals
    const { productId } = req.body
    let data = {
        userId,
        productId
    }
    userHelper.removeCartItem(data).then((result) => {
        res.json(result)
    }).catch((err) => console.log(err))
})

router.get("/logout", VerifyToken, (req, res) => {
    // console.log(req.headers['authorization']);

    const token = req.headers['authorization']
    if (token) {
        let authToken = token.split(' ')[1]
        // console.log(authToken);
        userHelper.blackListToken(authToken).then(() => {
            // console.log("inside");
            res.json({ msg: "logout successful" })
        }).catch((err) => { console.log(err); })
    }
})

module.exports = router;
