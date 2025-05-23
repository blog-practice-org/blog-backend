import mongoose from "mongoose";
import AutoIncrementFactory from "mongoose-sequence";

const AutoIncrement = AutoIncrementFactory(mongoose);
const { Schema, model } = mongoose;

const userSchema = new Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    userId: {
      type: Number,
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);
userSchema.plugin(AutoIncrement, { inc_field: "userId" });
export const userModel = model("User", userSchema);
