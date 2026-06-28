import mongoose from "mongoose";

const CitySchema = new mongoose.Schema(
  {
    country_code: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },

    country_name_ar: {
      type: String,
      required: true,
      trim: true,
    },

    country_name_en: {
      type: String,
      required: true,
      trim: true,
    },

    city_name_ar: {
      type: String,
      required: true,
      trim: true,
    },

    city_name_en: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    collection: "countries",
    timestamps: false,
  }
);

CitySchema.index(
  {
    country_code: 1,
    city_name_en: 1,
  },
  {
    unique: true,
  }
);

const CityModel = mongoose.models.cities || mongoose.model("cities", CitySchema, "countries");

export default CityModel;
