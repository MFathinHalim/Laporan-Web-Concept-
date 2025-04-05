import MainController from "@/controllers/post";;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tag = searchParams.get("tag") || "";
  const page = Number(searchParams.get("page") || 1);
  const limit = Number(searchParams.get("limit") || 10);

  const posts = await MainController.getByTag(tag, page, limit);
  return Response.json(posts);
}