import MainController from "@/controllers/post";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const page = Number(searchParams.get("page") || 1);
  const limit = Number(searchParams.get("limit") || 100);

  const tags = await MainController.getTag(page, limit);
  return Response.json(tags);
}
