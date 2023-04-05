import { PineconeClient } from "@pinecone-database/pinecone";

async function initPinecone() {
  try {
    const pinecone = new PineconeClient();

    await pinecone.init({
      environment: "us-east4-gcp", //this is in the dashboard
      apiKey: "YOUR API KEY",
    });

    return pinecone;
  } catch (error) {
    console.log("error", error);
    throw new Error("Failed to initialize Pinecone Client");
  }
}

export const pinecone = await initPinecone();
