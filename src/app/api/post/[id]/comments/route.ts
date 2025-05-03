import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import MainController from "@/controllers/post";
import Users from "@/controllers/user";

// GET all comments for a specific post
export async function GET(
  req: NextRequest
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
const userInstance = Users.getInstances();

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const commentId = searchParams.get("commentId");
  const postId = req.nextUrl.pathname.split("/").slice(-2, -1)[0];

  if (!postId) {
    return Response.json({ error: "Missing postId" }, { status: 400 });
  }

  const headersList = req.headers;
  const authHeader = headersList.get("authorization");
  const token = authHeader && authHeader.split(" ")[1]; // Extract token from "Bearer <token>"
  if (!token) {
    return Response.json({ error: "Invalid token" }, { status: 401 });
  }
  const checkToken = await userInstance.checkAccessToken(token);
  if (!checkToken) {
    return Response.json({ error: "Invalid token" }, { status: 401 });
  }

  const post = await MainController.getById(postId);
  if (!post) {
    return Response.json({ error: "Post not found" }, { status: 404 });
  }
  //@ts-ignore
  if (!commentId.user === checkToken.username && checkToken.atmin === false) {
    return Response.json({ error: "Unauthorized" }, { status: 403 });
  }

  const deleteResult = await MainController.deleteComment(commentId);

  if (deleteResult === 200) {
    return Response.json({ message: "Post deleted successfully" });
  } else {
    return Response.json({ error: "Failed to delete post" }, { status: 500 });
  }
}