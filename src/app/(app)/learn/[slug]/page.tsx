import { LearnScreen } from "@/components/learn/learn-screen";

interface LearnPageProps {
  params: Promise<{ slug: string }>;
}

export default async function LearnPage({ params }: LearnPageProps) {
  const { slug } = await params;
  return <LearnScreen slug={slug} />;
}
