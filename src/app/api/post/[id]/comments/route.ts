import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import MainController from "@/controllers/post";

// GET all comments for a specific post
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
    const postId = req.nextUrl.pathname.split("/").slice(-2, -1)[0];

  // Validate the postId
  if (!mongoose.Types.ObjectId.isValid(postId)) {
    return NextResponse.json({ error: "Invalid Post ID" }, { status: 400 });
  }

  try {
    // Get comments for the post (with pagination)
    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get("page") || 1);
    const limit = Number(searchParams.get("limit") || 10);

    const comments = await MainController.getCommentsByPostId(
      postId,
      page,
      limit
    );
    return NextResponse.json(comments);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

// POST a new comment to a specific post
export async function POST(req: NextRequest) {
  const postId = req.nextUrl.pathname.split("/").slice(-2, -1)[0];

  // Validate the postId
  if (!mongoose.Types.ObjectId.isValid(postId)) {
    return NextResponse.json({ error: "Invalid Post ID" }, { status: 400 });
  }

  try {
    const { user, content } = await req.json(); // Extract data from the request body
    // Call the controller to create a new comment
    const newComment = await MainController.createComment(postId, {
      user,
      content,
    });

    return NextResponse.json(newComment, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to add comment" },
      { status: 500 }
    );
  }
}
