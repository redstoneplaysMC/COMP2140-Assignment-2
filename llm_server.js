// BASED OFF OF THE WEEK 7 TUTORIAL SOLUTION.
import dotenv from "dotenv";
import { z } from "zod";
dotenv.config();
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";

const SYSTEM_PROMPT = `You are a presentation generator.

Generate a slide using the PresentMD markdown format. The Slide should use this format:

# Slide Title.

slide content in markdown format.
The slide should be at most 10 lines long.


Rules:
- Return only one slide, and if relevant, only one heading.
- Return only valid PresentMD markdown.
- Do not include explanations.
- Do not use Markdown code fences.
- The slide should follow the format specified above.
`;

const PresentationSchema = z.object({
  markdown: z.string().min(1),
});

function getModel() {
  const model = new ChatOpenAI({
  apiKey: process.env.VITE_LANGCHAIN_KEY,
  model: process.env.VITE_OPENAI_MODEL,
  configuration: {
    baseURL: process.env.VITE_RESTAPI_LINK + '/_ai/v1',
  },
});
  return model;
}

const baseModel = getModel();

const prompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    SYSTEM_PROMPT,
  ],
  [
    "human",
    "Create a presentation about: {topic}",
  ],
]);

export async function generateAiSlide(topic) {
  const modelWithSchema = baseModel.withStructuredOutput(
    PresentationSchema,
    {
      name: "presentation",
      strict: true,
    }
  );

  const chain = prompt.pipe(modelWithSchema);

  const result = await chain.invoke({
    topic: topic.trim(),
  });

  const parsed = PresentationSchema.safeParse(result);

  if (!parsed.success) {
    throw new Error("Model returned invalid presentation");
  }

  return parsed.data.markdown;
}
