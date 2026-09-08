import type { SummaryData } from "../type/speech-to-text.type";

export const MOCK_SUMMARY: SummaryData = {
  takeaways: [
    "Latency between API Gateway and microservices identified as primary bottleneck.",
    "Edge caching implementation (Redis test) yielded a 40% reduction in response time.",
  ],
  keyTerms: [
    "Router Architecture",
    "API Gateway",
    "Redis Caching",
    "Microservices",
  ],
  actionItems: [
    {
      id: "a1",
      label:
        "Draft cache invalidation rules document (Owner: John, Due: Friday)",
      done: false,
    },
    { id: "a2", label: "Review edge caching deployment pipeline", done: false },
  ],
};
