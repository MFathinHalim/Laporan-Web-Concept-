// controllers/MainController.ts
import { mainModel, tagModel, pusatModel } from "@/models/post";
import dbConnect from "@/utils/mongoose";
import mongoose from "mongoose";

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
  }) {
    const tags = (data.title.match(/#(\w+)/g) || []).map(tag =>
      tag.slice(1).toLowerCase()
    );

    const newPost = await mainModel.create({
      title: data.title,
      image: data.image,
      tags,
      completed: false,
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

  static async get(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const posts = await mainModel.find()
      .sort({ _id: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    return posts;
  }

  static async getPusat(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const posts = await pusatModel.find()
      .sort({ _id: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

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

  static async completeIt(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("ID tidak valid");
    }

    const updated = await mainModel.findByIdAndUpdate(
      id,
      { completed: true },
      { new: true }
    );

    if (!updated) {
      throw new Error("Post tidak ditemukan");
    }

    return updated;
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
    return await mainModel.find({ completed: false }).sort({ _id: -1 }).exec();
  }

  static async getCompleted() {
    return await mainModel.find({ completed: true }).sort({ _id: -1 }).exec();
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
