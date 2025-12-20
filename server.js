import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient, ObjectId } from "mongodb";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const client = new MongoClient(process.env.MONGO_URI);
let db;

async function connectDB() {
  await client.connect();
  db = client.db(process.env.DB_NAME);
  console.log("MongoDB connected");
}
connectDB();

app.get("/", (req, res) => {
  res.send("KrishiLink API running");
});

app.get("/crops", async (req, res) => {
  const crops = await db.collection("crops").find().toArray();
  res.json(crops);
});

app.get("/crops/:id", async (req, res) => {
  const crop = await db.collection("crops").findOne({ _id: new ObjectId(req.params.id) });
  if (!crop) return res.status(404).json({ message: "Crop not found" });
  res.json(crop);
});

app.post("/crops", async (req, res) => {
  const crop = req.body;
  crop.interests = [];
  const result = await db.collection("crops").insertOne(crop);
  res.json({ insertedId: result.insertedId });
});

app.delete("/crops/:id", async (req, res) => {
  await db.collection("crops").deleteOne({
    _id: new ObjectId(req.params.id),
  });
  res.json({ success: true });
});
app.get("/interests", async (req, res) => {
  const interests = await db
    .collection("interests")
    .find()
    .toArray();

  res.json(interests);
});


app.post("/crops/:id/interest", async (req, res) => {
  const interestId = new ObjectId();
  const interest = { _id: interestId, ...req.body, status: "pending" };

  await db.collection("crops").updateOne(
    { _id: new ObjectId(req.params.id) },
    { $push: { interests: interest } }
  );

  res.json({ message: "Interest submitted" });
});

app.put("/interest", async (req, res) => {
  const { cropsId, interestId, status } = req.body;

  await db.collection("crops").updateOne(
    { _id: new ObjectId(cropsId), "interests._id": new ObjectId(interestId) },
    { $set: { "interests.$.status": status } }
  );

  res.json({ message: "Interest updated" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log("Server running on port", PORT));
