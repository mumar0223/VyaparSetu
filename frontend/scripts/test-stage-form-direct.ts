import dotenv from "dotenv";
dotenv.config();

import { getAgentTools } from "../lib/agent/tools";

async function testStageFormDirect() {
  console.log("Testing stageForm directly...");
  const tools = getAgentTools({
    userId: "test-user-id",
    conversationId: "test-conv-id",
  });

  console.log("stageForm tool exists:", Boolean(tools.stageForm));
  console.log("typeof stageForm.execute:", typeof tools.stageForm?.execute);

  const testArgs = {
    title: "SBI PMEGP Loan Form",
    sections: [
      {
        title: "Personal Details",
        fields: [
          { id: "name", label: "Full Name", type: "text", required: true }
        ]
      }
    ]
  };

  try {
    const result = await tools.stageForm.execute(testArgs, {} as any);
    console.log("Result of stageForm.execute:", JSON.stringify(result, null, 2));
  } catch (err) {
    console.error("Error executing stageForm:", err);
  }
}

testStageFormDirect().catch(console.error);
