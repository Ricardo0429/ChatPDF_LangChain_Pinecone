import express from "express";
import dotenv from "dotenv";
import multer from "multer";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log("hi 00000000 ");
    cb(null, "images/");
  },
  filename: (req, file, cb) => {
    console.log("helo ooo ");
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: storage });
dotenv.config();
import { OpenAIEmbeddings } from "langchain/embeddings";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

import { pinecone } from "./pinecone-client.js";
import { CustomPDFLoader } from "./customPDFLoader.js";
import { PineconeStore } from "langchain/vectorstores";

import { PINECONE_INDEX_NAME, PINECONE_NAME_SPACE } from "./config/pinecone.js";
import { DirectoryLoader, PDFLoader } from "langchain/document_loaders";

import cors from "cors";
import { Configuration, OpenAIApi } from "openai";
// const { init, insertItem } = require("./db");

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);
var corsOptions = {
  origin: "*",
};

// init();

const app = express();
app.use(cors(corsOptions));

app.use(express.json());

app.post("/initialize", upload.single("file"), (req, res) => {
  console.log("success");
  run("images/" + "hubspot.pdf");
  res.json({});
});

app.post("/", async (req, res) => {
  try {
    const prompt = req.body.prompt;

    const response = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: `${prompt}`,
      temperature: 0, // Higher values means the model will take more risks.
      max_tokens: 3000, // The maximum number of tokens to generate in the completion. Most models have a context length of 2048 tokens (except for the newest models, which support 4096).
      top_p: 1, // alternative to sampling with temperature, called nucleus sampling
      frequency_penalty: 0.5, // Number between -2.0 and 2.0. Positive values penalize new tokens based on their existing frequency in the text so far, decreasing the model's likelihood to repeat the same line verbatim.
      presence_penalty: 0, // Number between -2.0 and 2.0. Positive values penalize new tokens based on whether they appear in the text so far, increasing the model's likelihood to talk about new topics.
    });

    res.status(200).send({
      bot: response.data.choices[0].text,
    });
    insertItem(response.data.choices[0].text);
  } catch (error) {
    // console.error(process.env.OPENAI_API_KEY,"error")
    console.log(error);
    res.status(500).send(error || "Something went wrong");
  }
});

app.listen(5000, () =>
  console.log("AI server started on http://localhost:5000")
);

const run = async (data) => {
  try {
    /*load raw docs from the all files in the directory */
    const directoryLoader = new DirectoryLoader("images", {
      ".pdf": (path) => new CustomPDFLoader(path),
    });

    // const loader = new PDFLoader(data);
    console.log("after load");
    const rawDocs = await directoryLoader.load();
    // const rawDocs = await loader.load();
    console.log("after rawDocs ----------");

    /* Split text into chunks */
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    console.log("text splitter ----------");

    const docs = await textSplitter.splitDocuments(rawDocs);
    console.log("split docs", docs);

    console.log("creating vector store...");
    /*create and store the embeddings in the vectorStore*/
    const embeddings = new OpenAIEmbeddings();
    console.log("1");
    const index = pinecone.Index("gptpdf"); //change to your own index name
    console.log("2");

    //embed the PDF documents
    await PineconeStore.fromDocuments(docs, embeddings, {
      pineconeIndex: index,
      namespace: "pdf-test",
      textKey: "text",
    });
    console.log("pinecone dataabse successfully updated");
  } catch (error) {
    console.log("error", error);
    throw new Error("Failed to ingest your data");
  }
};
