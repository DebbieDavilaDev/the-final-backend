import express from "express" //anything app. below is express
import cors from "cors"  // line 12
import { MongoClient } from "mongodb" //line 14-18 it is connecting to my Mongo accnt, so my database
import functions from "firebase-functions" 
import MONGO_URI from "./secrets.js"
import { service_account } from "./service_account.js"
import { initializeApp } from "firebase-admin/app"


const app = express()

app.use(cors())
app.use(express.json())
const client = new MongoClient(MONGO_URI)  //16-18 collections within the client.db(portfolio) the Mongo  database
const db = client.db("portfolio")
const pictures = db.collection("pictures")  //collections within the client.db(portfolio)
const users = db.collection('users')  //
const categories = db.collection("categories")  //
const firebaseApp = initializeApp(service_account) // I was using it for google cloud storage but now we're using it in a different way thru my form

client.connect() // connects to mongodb, which connects to the internet
console.log("Connected to Mongo")  // to know that the api started

app.post("/upload", async function(req, res){ //handle requests from the front-end 
    const {url, description, category } = req.body
    const img = {
        url: url,
        description: description ? description: "no description",
        category: category, 
    }
    pictures.insertOne(img)
    res.status(200).send() //so everytime you have a request as in a.post or .get you need to send response
}) 

app.get("/",(req,res)=>{
     res.send("This is working!")
})

app.post('/signin',async(req,res)=>{ 
    const {email,password} = req.body
    // check if user exists
    const user = await users.findOne({email})
    
    app.post('/deleteImage', async (req,res)=>{
        const url = req.body.url
        // delete by image url
        // find image by url
        const image = await pictures.findOne({url})
        // delete image
        await pictures.deleteOne({url})
        // return all images
    res.status(200).send({message: 'image deleted'})
    })
    if(!user){
        res.status(404).send({message: 'user not found'})
        return
    }
    // check if password matches
    if(user.password !== password){
        res.status(401).send({message: 'password incorrect'})
        return
    }
    // create token
    const authKey = crypto.randomUUID() //this generates random #'s & letters comes javascript crypto library
    await users.updateOne({email},{$set: {authKey}}) //found this mongodb docs

    res.status(200).send({token}) //this goes to my frontend and then that goes to local storage my hard drive
})


async function getAllCategories () {
    const allCategories = await categories.find().toArray()// find(this is empty because its not a specific, its all)
    let all = [] //found on mongodb docs, its my categories and they needed to be turned into an array per mongodb
    allCategories.forEach((category) =>{
        all.push(category.category)  // for each category in the array, this is a function that iterates over each category
    })
    return all
}

app.get('/categories',async(req,res)=>{
    const categories = await getAllCategories()
    res.status(200).send(categories)
})

app.post('/addCategory', async (req, res)=>{
    const arr = []
    const category = req.body.category
    console.log('category',category)
    await categories.insertOne({category})
    const allCategories = await getAllCategories()
    res.status(200).send({message: 'category added', categories: allCategories})
})

app.post('/deleteCategory', async (req,res)=>{
    const category = req.body.category
    await categories.deleteOne({category})

const allCategories = await getAllCategories()
res.status(200).send({message: 'category deleted', categories: allCategories})
})
        // images/:category is one of the endpoints
app.get('/images/:category', async (req, res) =>{ //app.get images is one of my endpoints to get all my images by category and send them back.  Its only two lines.
    const category = req.params.category //gets the category from the url endpoint
    const allImages = await pictures.find().toArray() //gets all the images
    const result = []
    allImages.map(image => { //this loops through the images to only select the ones from the given category
        if (image.category === category) {
            result.push(image)
            
        }
        
    })
    res.status(200).send(result)
    
})

app.get('/images', async (req,res)=>{ //all images
    const images = await pictures.find().toArray()
    res.status(200).send(images)
})


export const api = functions.https.onRequest(app)
// //*is where firebase functions connects to my code, I deploy my api to firebase functions which is
//  a google cloud service, so here the word functions is not a function.*//