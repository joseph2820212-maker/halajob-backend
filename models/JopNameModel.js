import mongoose from "mongoose";

const JopNameSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  title_ar: { type: String, required: true },
  title_en: { type: String, required: true },
  keyword: { type: [String] }
}, { collection: "jop_name" });

const JopNameModel = mongoose.model("JopName", JopNameSchema);

// ✅ حذف الفهرس بعد الاتصال
mongoose.connection.once("open", async () => {
  try {
    await JopNameModel.collection.dropIndex("name_ar_1");
    console.log("Dropped index: name_ar_1");
  } catch (err) {
    if (err.codeName === "IndexNotFound") {
      console.log("Index name_ar_1 not found, nothing to drop.");
    } else {
      console.error("Error dropping index:", err);
    }
  }
});

export default JopNameModel;
