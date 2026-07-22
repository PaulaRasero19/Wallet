import { Schema, model, Types, type InferSchemaType } from "mongoose";

const categorySchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: "User", default: null, index: true },
    translationKey: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ["income", "expense"], required: true, index: true },
    icon: { type: String, required: true, default: "circle" },
    color: { type: String, required: true, default: "black" },
    isSystem: { type: Boolean, default: false, index: true },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true, versionKey: false }
);

categorySchema.index({ userId: 1, translationKey: 1, type: 1 }, { unique: true });

export type CategoryDocument = InferSchemaType<typeof categorySchema>;
export const Category = model("Category", categorySchema);
