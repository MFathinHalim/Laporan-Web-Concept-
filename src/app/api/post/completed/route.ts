import MainController from "@/controllers/post";;

export async function GET() {
  const posts = await MainController.getCompleted();
  return Response.json(posts);
}