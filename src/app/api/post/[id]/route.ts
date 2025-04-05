import { NextRequest } from "next/server";
import MainController from "@/controllers/post";;

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const post = await MainController.getById(params.id);
    return Response.json(post);
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 404 });
  }
}

export async function PATCH(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const result = await MainController.completeIt(params.id);
    return Response.json(result);
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 400 });
  }
}