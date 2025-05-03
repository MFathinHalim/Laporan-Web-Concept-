// controllers/MainController.ts
import { mainModel, tagModel, pusatModel, commentModel } from "@/models/post";
import dbConnect from "@/utils/mongoose";
import mongoose, { Model, Types } from "mongoose";

await dbConnect();
class MainController {
  static async post(data: {
    title: string;
    image: string;
    location?: {
      type: "Point";
      coordinates: [number, number]; // [lng, lat]
      address: string;
    };
    userId: string;
  }) {
    const tags = (data.title.match(/#(\w+)/g) || []).map(tag =>
      tag.slice(1).toLowerCase()
    );

    const newPost = await mainModel.create({
      title: data.title,
      image: data.image,
      tags,
      userId: data.userId,
      completed: [],
      location: data.location, // Sudah GeoJSON
      expiredAt: new Date(Date.now() + 60 * 1000), // 1 menit dari sekarang (debugging)
    });

    for (const tag of tags) {
      await tagModel.updateOne(
        { name: tag },
        { $setOnInsert: { name: tag } },
        { upsert: true }
      );
    }

    return newPost;
  }

  static async getTag(page: number = 1, limit: number = 100) {
    const getTags = this.get(page, limit, tagModel)
    return getTags;
  }

  static async createComment(postId: string, data: { user: userType; content: string }) {
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      throw new Error("Invalid Post ID");
    }

    const post = await mainModel.findById(postId);
    if (!post) {
      throw new Error("Post not found");
    }

    // Create the comment
    const newComment = new commentModel({
      postId,
      user: data.user.username,
      content: data.content,
    });

    await newComment.save();
    return newComment;
  }

  // Get comments for a specific post (with pagination)
  static async getCommentsByPostId(postId: string, page: number = 1, limit: number = 10) {
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      throw new Error("Invalid Post ID");
    }

    const skip = (page - 1) * limit;
    const comments = await commentModel
      .find({ postId })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }); // Sort comments by creation date (latest first)
    
    return comments;
  }

  // Get all comments for a post without pagination (useful for backend/admin panels)
  static async getAllCommentsForPost(postId: string) {
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      throw new Error("Invalid Post ID");
    }

    const comments = await commentModel
      .find({ postId })
      .sort({ createdAt: -1 }); // Sort comments by creation date (latest first)

    return comments;
  }


  static async get(page: number = 1, limit: number = 10, model:any = mainModel) {
    const skip = (page - 1) * limit;

    const posts = await model.find()
      .sort({ _id: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    return posts;
  }

  static async getPusat(page: number = 1, limit: number = 10) {
    const posts = this.get(page, limit, pusatModel)
    return posts;
  }

  static async migrateExpiredToPusat() {
    const now = new Date();
    const expiredPosts = await mainModel.find({
      completed: false,
      expiredAt: { $lte: now },
    });

    for (const post of expiredPosts) {
      await pusatModel.create(post.toObject());
      // Optional: Hapus dari main jika sudah dipindah
      // await mainModel.deleteOne({ _id: post._id });
    }
  }

  static async deletePost(post: any) {  
    const result = await mainModel.deleteOne({ _id: post });
    if (result.deletedCount === 0) {
      throw new Error("Post not found or already deleted");
    }
    return 200;
  }
  
  static async deleteComment(comment: any) {
    const result = await commentModel.deleteOne({ _id: comment });
    if (result.deletedCount === 0) {
      throw new Error("Comment not found or already deleted");
    }
    return 200;
  }
  

  static async completeIt(itemId: Types.ObjectId, userId: any) {
    const item = await mainModel.findById(itemId);
    if (!item) throw new Error("Item not found");
    
    const userIndex = item.completed?.findIndex(
      (u: any) => String(u) === String(userId._id)
    );
    if (userIndex === -1) {
      //@ts-ignore
      item.completed?.push(userId._id);
    } else {
      //@ts-ignore
      item.completed?.splice(userIndex, 1);
    }
    
    await item.save();
    
    return item;
  }

  static async completePusat(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("ID tidak valid");
    }

    const updated = await pusatModel.findByIdAndUpdate(
      id,
      { completed: true },
      { new: true }
    );

    if (!updated) {
      throw new Error("Post pusat tidak ditemukan");
    }

    return updated;
  }

  static async getByTag(tag: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const posts = await mainModel.find({ tags: tag })
      .sort({ _id: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    return posts;
  }

  static async getUncompleted() {
    return await mainModel
    .find({ "completed.3": { $exists: false } }) // artinya index ke-3 (user ke-4) ada → total > 3
    .sort({ _id: -1 })
    .exec();  }

  static async getCompleted() {
    return await mainModel
    .find({ "completed.9": { $exists: true } })
    .sort({ _id: -1 })
    .exec();
    }

  static async getById(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("ID tidak valid");
    }

    const post = await mainModel.findById(id).exec();
    if (!post) {
      throw new Error("Post tidak ditemukan");
    }

    return post;
  }
}

export default MainController;
