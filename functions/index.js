import express from "express"
import cors from "cors"
import { MongoClient, ObjectId } from "mongodb"
import functions from "firebase-functions"
import MONGO_URI from "./secrets.js"
import { service_account } from "./service_account.js"

const app = express()
app.use(cors())
app.use(express.json())
const client = new MongoClient(MONGO_URI)
const db = client.db("portfolio")
const pictures = db.collection("pictures")
const categories = db.collection("categories")
const firebaseApp = initializeApp(service_account)

client.connect()
console.log("Connected to Mongo")

app.post("/upload", async function(req, res){
    const {url, fileName, description, category } = req.body
    const img = {
        url: url,
        name: fileName,
        description: description ? description: "no description",
        category, 
    }
    pictures.insertOne(img)
    res.status(200).send()
}) 

async function getAllCategories () {
    const allCategories = await categories.find().toArray()
    let all = []
    allCategories.forEach((category) =>{
        all.push(category.category)
    })
    return all
}

app.post('/addCategory', async (req, res)=>{
    const arr = []
    const category = req.body.category
    await categories.insertOne({category})
    const allCategories = await getAllCategories()
    res.status(200).send({message: 'category added', categories: allCategories})
})

app.post('/deleteCategory', async (req,res)=>{
    const category = req.body
    await categories.deleteOne(category)

const allCategories = await getAllCategories()
res.status(200).send({message: 'category deleted', categories: allCategories})
})

app.get('/images/:category', async (req, res) =>{
    const category = req.params.category
    const allImages = await pictures.find().toArray()
    const result = []
    allImages.map(image => {
        if (image.category === category) {
            result.push(image)
            res.status(200).send(result)
        }
        
    })
    
})

export const api = functions.https.onRequest(app)
