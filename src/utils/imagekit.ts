import ImageKit from "imagekit";
const imagekit = new ImageKit({
    publicKey: process.env.publicImg || "",
    privateKey: process.env.privateImg || "",
    urlEndpoint: process.env.urlEndpoint || ""
})
export default imagekit