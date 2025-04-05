import MainController from "@/controllers/post";
import imagekit from "@/utils/imagekit";

export async function POST(req: Request) {
  const formData = await req.formData();

  const title = formData.get("title") as string;
  const file = formData.get("image") as File | null;

  const rawLat = formData.get("lat");
  const rawLng = formData.get("lng");
  const address = formData.get("address") as string | undefined;

  const lat =
    rawLat && rawLat !== "" ? parseFloat(rawLat as string) : undefined;
  const lng =
    rawLng && rawLng !== "" ? parseFloat(rawLng as string) : undefined;

  let imageUrl = "";

  if (file) {
    const buffer = await file.arrayBuffer();

    const uploadResult = await imagekit.upload({
      file: Buffer.from(buffer),
      fileName: `image-${Date.now()}.jpg`,
      useUniqueFileName: false,
      folder: "LaporanApp",
    });

    if (!uploadResult || !uploadResult.url) {
      throw new Error("Image upload failed");
    }

    imageUrl = uploadResult.url;
  }

  const post = await MainController.post({
    title,
    image: imageUrl,
    location:
      lat !== undefined &&
      lng !== undefined &&
      !isNaN(lat) &&
      !isNaN(lng) &&
      address
        ? {
            type: "Point",
            coordinates: [lng, lat], // GeoJSON format
            address,
          }
        : undefined,
  });

  return Response.json(post);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const page = Number(searchParams.get("page") || 1);
  const limit = Number(searchParams.get("limit") || 10);

  const posts = await MainController.get(page, limit);
  return Response.json(posts);
}
