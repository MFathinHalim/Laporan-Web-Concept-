import Users from "@/controllers/user";
import MainController from "@/controllers/post";

const userInstance = Users.getInstances();

export async function DELETE(req: Request) {
    const { searchParams } = new URL(req.url);
    const postId = searchParams.get("postId");
  
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
    if (!post.userId.equals(checkToken._id) && checkToken.atmin === false) {
      return Response.json({ error: "Unauthorized" }, { status: 403 });
    }
    const deleteResult = await MainController.report(postId, post.title);

  
    if (deleteResult === 200) {
      return Response.json({ message: "Post deleted successfully" });
    } else {
      return Response.json({ error: "Failed to delete post" }, { status: 500 });
    }
  }