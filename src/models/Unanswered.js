import mongoose from "mongoose";

const UnansweredSchema = new mongoose.Schema({
  tenant: { type: String, required: true },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const Unanswered = mongoose.model("Unanswered", UnansweredSchema);
export default Unanswered;
