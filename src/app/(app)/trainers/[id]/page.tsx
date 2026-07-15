import { TrainerScreen } from "@/components/trainers/trainer-screen";
import { getTrainerById } from "@/lib/courses/mock-data";
import { notFound } from "next/navigation";

interface TrainerPageProps {
  params: Promise<{ id: string }>;
}

export default async function TrainerPage({ params }: TrainerPageProps) {
  const { id } = await params;
  if (!getTrainerById(id)) notFound();
  return <TrainerScreen trainerId={id} />;
}
