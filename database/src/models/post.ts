import mongoose, { Schema, type Document, type Model } from "mongoose";

export type ReactionType = "like" | "celebrate" | "support" | "love" | "insightful" | "curious";

export interface IPostReaction {
  _id?: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  type: ReactionType;
  createdAt: Date;
}

export interface IPostComment {
  _id?: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  text: string;
  likes?: mongoose.Types.ObjectId[];
  createdAt: Date;
}

export interface IPost extends Document {
  _id: mongoose.Types.ObjectId;
  authorId: mongoose.Types.ObjectId;
  content: string;
  imageUrl?: string | null;
  documentUrl?: string | null;
  documentName?: string | null;
  linkUrl?: string | null;
  category:
    | "General"
    | "Blog"
    | "Article"
    | "Achievement"
    | "Project"
    | "Opportunity"
    | "Interview Experience"
    | "Research"
    | "Resource"
    | "Question"
    | "Help Needed";
  campus: string;
  department: string;
  likes: mongoose.Types.ObjectId[];
  reactions?: IPostReaction[];
  comments: IPostComment[];
  savedBy: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const PostReactionSchema = new Schema<IPostReaction>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  type: {
    type: String,
    enum: ["like", "celebrate", "support", "love", "insightful", "curious"],
    default: "like",
  },
  createdAt: { type: Date, default: Date.now },
});

const PostCommentSchema = new Schema<IPostComment>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  text: { type: String, required: true, trim: true },
  likes: [{ type: Schema.Types.ObjectId, ref: "User" }],
  createdAt: { type: Date, default: Date.now },
});

const PostSchema = new Schema<IPost>(
  {
    authorId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    content: { type: String, required: true, trim: true },
    imageUrl: { type: String, default: null },
    documentUrl: { type: String, default: null },
    documentName: { type: String, default: null },
    linkUrl: { type: String, default: null },
    category: {
      type: String,
      required: true,
      enum: [
        "General",
        "Blog",
        "Article",
        "Achievement",
        "Project",
        "Opportunity",
        "Interview Experience",
        "Research",
        "Resource",
        "Question",
        "Help Needed",
      ],
      default: "General",
      index: true,
    },
    campus: { type: String, default: "Coimbatore", index: true },
    department: { type: String, default: "General", index: true },
    likes: [{ type: Schema.Types.ObjectId, ref: "User" }],
    reactions: [PostReactionSchema],
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
