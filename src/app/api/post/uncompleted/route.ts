import MainController from "@/controllers/post";

export async function GET() {
  const posts = await MainController.getUncompleted();
  return Response.json(posts);
}
