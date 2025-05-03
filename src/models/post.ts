import { Types } from "mongoose";
import { Model, Schema, model, models } from "mongoose";

// Tambahkan interface Data di sini atau import dari file lain
interface Data {
  _id?: string;
  title: string;
  image?: string;
  tags: string[];
  completed?: [];
  userId?: Types.ObjectId;
  location?: {
    type: "Point";
    coordinates: [number, number]; // [lng, lat]
    address?: string;
  };
  createdAt?: Date;
  updatedAt?: Date;
}
interface CommentData {
  user: string; // The user who commented
  content: string; // The comment content
  postId: string; // Reference to the Post
  createdAt?: Date;
}

// Main post schema
const mainSchema = new Schema<Data>(
  {
    title: { type: String, required: true },
    image: { type: String },
    tags: [String],
    userId: { type: Types.ObjectId, ref: "User" }, 
    completed: [{ type: Types.ObjectId, ref: "User", default: [] }], 
    location: {
      type: {
        type: String,
        enum: ["Point"],
        required: false, // boleh kosong kalau belum ada lokasi
      },
      coordinates: {
        type: [Number],
        required: function () {
          return this.location?.type === "Point";
        },
      },
      address: String,
    },
  },
  { timestamps: true }
);
const commentSchema = new Schema<CommentData>(
  {
    user: { type: String, required: true },
    content: { type: String, required: true },
    //@ts-ignore
    postId: { type: Schema.Types.ObjectId, ref: "Post", required: true }, // Reference to the Post
  },
  { timestamps: true }
);

// Tambahkan index untuk geospasial query
mainSchema.index({ location: "2dsphere" });

// Tag schema
const tagSchema = new Schema({
  name: { type: String, required: true },
});

// Export model
const mainModel: Model<Data> = models.mains || model<Data>("mains", mainSchema);
const pusatModel: Model<Data> =
  models.pusats || model<Data>("pusats", mainSchema);
const tagModel: Model<{ name: string }> =
  models.tags || model("tags", tagSchema);
const commentModel: Model<CommentData> =
  models.Comment || model<CommentData>("Comment", commentSchema);

export { pusatModel, mainModel, tagModel, commentModel };
