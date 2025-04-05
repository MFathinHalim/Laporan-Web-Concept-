import { NextApiRequest, NextApiResponse } from "next";
import MainController from "@/controllers/post";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    await MainController.migrateExpiredToPusat();
    return res.status(200).json({ message: "Migration success" });
  } catch (error: any) {
    console.error("Migration failed:", error);
    return res.status(500).json({ message: "Migration failed", error: error.message });
  }
}
