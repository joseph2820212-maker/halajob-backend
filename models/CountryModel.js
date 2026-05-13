import mongoose from "mongoose";

const CountrySchema = new mongoose.Schema(
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

CountrySchema.index(
  {
    country_code: 1,
    city_name_en: 1,
  },
  {
    unique: true,
  }
);

const CountryModel = mongoose.model("countries", CountrySchema);

export default CountryModel;