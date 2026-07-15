import { InterviewChat } from "@/components/interview/interview-chat";
import { Container } from "@/components/ui/container";

export default function InterviewPage() {
  return (
    <Container className="py-8 lg:py-10">
      <InterviewChat />
    </Container>
  );
}
