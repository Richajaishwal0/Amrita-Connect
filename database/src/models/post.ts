import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IPostComment {
  _id?: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  text: string;
  createdAt: Date;
}

export interface IPost extends Document {
  _id: mongoose.Types.ObjectId;
  authorId: mongoose.Types.ObjectId;
  content: string;
  imageUrl?: string | null;
  category:
    | "General"
    | "Achievement"
    | "Project"
    | "Opportunity"
    | "Interview Experience"
    | "Resource"
    | "Question"
    | "Help Needed";
  campus: string;
  department: string;
  likes: mongoose.Types.ObjectId[];
  comments: IPostComment[];
  savedBy: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const PostCommentSchema = new Schema<IPostComment>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  text: { type: String, required: true, trim: true },
  createdAt: { type: Date, default: Date.now },
});

const PostSchema = new Schema<IPost>(
  {
    authorId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    content: { type: String, required: true, trim: true },
    imageUrl: { type: String, default: null },
    category: {
      type: String,
      required: true,
      enum: [
        "General",
        "Achievement",
        "Project",
        "Opportunity",
        "Interview Experience",
        "Resource",
        "Question",
        "Help Needed",
      ],
      default: "General",
      index: true,
    },
    campus: { type: String, required: true, index: true },
    department: { type: String, required: true, index: true },
    likes: [{ type: Schema.Types.ObjectId, ref: "User" }],
    comments: [PostCommentSchema],
    savedBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
    createdAt: { type: Date, default: Date.now, index: true },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const PostModel: Model<IPost> =
  mongoose.models.Post || mongoose.model<IPost>("Post", PostSchema, "amrita_posts");
