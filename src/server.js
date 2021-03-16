import express from 'express'
import bodyParser from 'body-parser'
import { MongoClient } from 'mongodb'
import path from 'path'

const app = express()

app.use(bodyParser.json())
app.use(express.static(path.join(__dirname, './build')))

const withDb = async (operations, res) => {
  try {
    const client = await MongoClient.connect('mongodb://localhost:27017', {
      useNewUrlParser: true
    })
    const db = client.db('my-blog')
    await operations(db)
    client.close()
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong!', error })
  }
 
}
app.get('/api/articles/:name', async (req, res) => withDb(async db => {
  const name = req.params.name
  const articleInfo = await db.collection('articles').findOne({ name })
  res.status(200).json(articleInfo)
}, res))

app.post('/api/articles/:name/upvote', async (req, res) => withDb(async db => {
  const name = req.params.name
  const articleInfo = await db.collection('articles').findOne({ name })
  await db.collection('articles').updateOne({ name }, { $set: { upvotes: articleInfo.upvotes + 1}})
  const updatedArticleInfo = await db.collection('articles').findOne({ name })
  res.status(200).json(updatedArticleInfo)
}, res))

app.post('/api/articles/:name/add-comment', async (req, res) => withDb(async db => {
  const name = req.params.name
  const { username, text } = req.body;
  const articleInfo = await db.collection('articles').findOne({ name })
  await db.collection('articles').updateOne({ name }, { $push: { comments: {
    username,
    text
  } }})
  const updatedArticleInfo = await db.collection('articles').findOne({ name })
  res.status(200).json(updatedArticleInfo)
}, res))

app.get('*', () => res.sendFile(path.join(`${__dirname}/build/index.html`)))

app.listen(8000, () => console.log('Server listening on port 8000'))