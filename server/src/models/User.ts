import { Schema, model, type InferSchemaType } from "mongoose";

const userSchema = new Schema(
  {
    fullName: { type: String, required: true, trim: true, minlength: 2 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true, select: false },
    emailVerified: { type: Boolean, default: true },
    isDemo: { type: Boolean, default: false },
    onboardingCompleted: { type: Boolean, default: false }
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      transform(_doc, ret) {
        const output = ret as Record<string, unknown>;
        delete output.passwordHash;
        output.id = output._id?.toString();
        delete output._id;
        return ret;
      }
    }
  }
);

export type UserDocument = InferSchemaType<typeof userSchema>;
export const User = model("User", userSchema);
