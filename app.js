const express = require("express")
const db = require("./model/config")
const userRoutes = require('./routes/userRoutes')


const app = express()
app.use(express.json());
app.use(express.urlencoded({ extended: true }))
//views setup
// app.set('view engine', 'ejs');

// app.use(express.static('public'))
db.connect((err) => {
    if (err) console.log("Connection failed \n" + err)
    else { 
        console.log('Connection Succeful conected to port 27017')     
    }
})



app.use('', userRoutes)

app.use((req, res) => {
    res.status(404).render('404')
})
//port
app.listen(8000, () => {
    console.log('express is working at port 8000')
})